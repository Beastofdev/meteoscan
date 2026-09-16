#!/usr/bin/env bash
#
# Las pruebas de la API, contra un PostgreSQL de usar y tirar.
#
#   bash backend/check_api.sh
#
# Crea un contenedor de cero, carga db/schema.sql, arranca la API contra esa
# base, pasa node --test, y lo destruye todo al acabar, pase lo que pase. Nunca
# toca la base de desarrollo (decision 0004). Hace falta Docker en marcha, las
# dependencias instaladas y el 8005 libre.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

CONTAINER=meteoscan-api-check
IMAGE=postgres:18   # la misma que compose.yaml (decision 0007)
DB_PORT=5439        # el de usar y tirar (CONTRIBUTING)
API_PORT=8005       # el de la API (CONTRIBUTING)

fail() {
    echo "FALLO  $*"
    exit 1
}

command -v docker >/dev/null 2>&1 || fail "no hay docker en el PATH"
docker info >/dev/null 2>&1 || fail "Docker no esta en marcha"
[ -d backend/node_modules ] || fail "faltan las dependencias: npm install, desde backend/"

# Un contenedor con este nombre es de una pasada que se corto de golpe. No se
# borra solo: antes de borrar algo, se mira que es.
if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    fail "ya hay un contenedor $CONTAINER. Si es de una pasada anterior: docker rm -f -v $CONTAINER"
fi

# El 8005 tiene que estar libre: con la API de desarrollo en marcha, las
# pruebas hablarian con ella, y con la base de desarrollo detras. Se mira con
# node, que contesta igual en Windows y en Linux.
node -e "
const net = require('net');
const server = net.createServer();
server.once('error', () => process.exit(1));
server.once('listening', () => server.close(() => process.exit(0)));
server.listen($API_PORT, '127.0.0.1');
" || fail "el $API_PORT esta ocupado: para la API de desarrollo antes de correr las pruebas"

# Desde aqui, el contenedor y la API se van al salir, salga como salga el guion.
API_PID=""
limpiar() {
    [ -n "$API_PID" ] && kill "$API_PID" 2>/dev/null
    docker rm -f -v "$CONTAINER" >/dev/null 2>&1
}
trap limpiar EXIT

docker run --rm -d --name "$CONTAINER" -p "127.0.0.1:$DB_PORT:5432" \
    -e POSTGRES_PASSWORD=check "$IMAGE" >/dev/null \
    || fail "no se pudo crear el contenedor (esta libre el $DB_PORT?)"

# Por la red (-h 127.0.0.1): la primera vez arranca un PostgreSQL provisional
# que solo escucha por dentro, y ese no cuenta.
ready=0
for _ in $(seq 1 60); do
    if docker exec "$CONTAINER" pg_isready -q -h 127.0.0.1 -U postgres; then
        ready=1
        break
    fi
    sleep 1
done
[ "$ready" -eq 1 ] || fail "PostgreSQL no contesta despues de 60 intentos"

out=$(docker exec -i "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 < db/schema.sql 2>&1) \
    || { echo "$out"; fail "db/schema.sql no carga"; }

# La API, contra esa base. Las variables van delante, y no por --env-file: en
# GitHub Actions no hay .env, y con --env-file Node no arrancaria.
LOG="$(mktemp)"
cd backend || exit 1
DB_HOST=127.0.0.1 DB_PORT="$DB_PORT" DB_USER=postgres DB_PASSWORD=check DB_NAME=postgres \
    node src/server.js >"$LOG" 2>&1 &
API_PID=$!
cd "$ROOT" || exit 1

ready=0
for _ in $(seq 1 30); do
    if curl -s -o /dev/null "http://127.0.0.1:$API_PORT/health"; then
        ready=1
        break
    fi
    sleep 1
done
[ "$ready" -eq 1 ] || { cat "$LOG"; fail "la API no llego a contestar"; }

echo "PostgreSQL de usar y tirar en el $DB_PORT, y la API en el $API_PORT"

# En serie (--test-concurrency=1): todas las pruebas comparten una sola base.
node --test --test-concurrency=1 "backend/test/*.test.js" \
    || { echo; echo "--- el registro de la API:"; cat "$LOG"; fail "hay pruebas de la API que fallan"; }

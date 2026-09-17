#!/usr/bin/env bash
#
# Las pruebas del panel, contra la aplicacion de verdad.
#
#   bash frontend/check_panel.sh
#
# Crea un PostgreSQL de cero, carga db/schema.sql, arranca la API contra esa
# base y pasa las pruebas de Playwright, que compilan el panel y lo sirven en el
# 5177. Al acabar lo destruye todo, pase lo que pase. Nunca toca la base de
# desarrollo (decision 0004). Hace falta Docker en marcha, las dependencias del
# panel y de la API, el navegador de Playwright (npx playwright install
# chromium) y los puertos 8005 y 5177 libres.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

CONTAINER=meteoscan-panel-check
IMAGE=postgres:18   # la misma que compose.yaml (decision 0007)
DB_PORT=5439        # el de usar y tirar (CONTRIBUTING)
API_PORT=8005       # el de la API (CONTRIBUTING)
PANEL_PORT=5177     # el del panel (CONTRIBUTING)

fail() {
    echo "FALLO  $*"
    exit 1
}

libre() {
    node -e "
const net = require('net');
const server = net.createServer();
server.once('error', () => process.exit(1));
server.once('listening', () => server.close(() => process.exit(0)));
server.listen($1, '127.0.0.1');
"
}

command -v docker >/dev/null 2>&1 || fail "no hay docker en el PATH"
docker info >/dev/null 2>&1 || fail "Docker no esta en marcha"
[ -d backend/node_modules ] || fail "faltan las dependencias de la API: npm install, desde backend/"
[ -d frontend/node_modules ] || fail "faltan las dependencias del panel: npm install, desde frontend/"

if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    fail "ya hay un contenedor $CONTAINER. Si es de una pasada anterior: docker rm -f -v $CONTAINER"
fi

# Con la API o el panel de desarrollo en marcha, las pruebas hablarian con
# ellos, y con la base de desarrollo detras.
libre "$API_PORT" || fail "el $API_PORT esta ocupado: para la API de desarrollo antes de correr las pruebas"
libre "$PANEL_PORT" || fail "el $PANEL_PORT esta ocupado: para el panel de desarrollo antes de correr las pruebas"

# Desde aqui, el contenedor y la API se van al salir, salga como salga el guion.
# El panel lo levanta y lo para Playwright.
API_PID=""
limpiar() {
    [ -n "$API_PID" ] && kill "$API_PID" 2>/dev/null
    docker rm -f -v "$CONTAINER" >/dev/null 2>&1
}
trap limpiar EXIT

docker run --rm -d --name "$CONTAINER" -p "127.0.0.1:$DB_PORT:5432" \
    -e POSTGRES_PASSWORD=check "$IMAGE" >/dev/null \
    || fail "no se pudo crear el contenedor (esta libre el $DB_PORT?)"

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

# Las variables van delante, y no por --env-file: en GitHub Actions no hay .env.
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

echo "PostgreSQL de usar y tirar en el $DB_PORT, la API en el $API_PORT y el panel en el $PANEL_PORT"

cd frontend || exit 1
npx playwright test \
    || { echo; echo "--- el registro de la API:"; cat "$LOG"; fail "hay pruebas del panel que fallan"; }

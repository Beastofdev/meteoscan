#!/usr/bin/env bash
#
# Las pruebas del esquema, sobre un PostgreSQL de usar y tirar.
#
#   bash db/check_all.sh
#
# Crea un contenedor de cero, carga db/schema.sql, pasa db/checks.sql y lo
# destruye al acabar, pase lo que pase. Nunca toca la base de desarrollo: una
# prueba que puede heredar lo que dejo la anterior no prueba nada (decision
# 0004). Hace falta Docker en marcha.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

CONTAINER=meteoscan-check
IMAGE=postgres:18   # la misma que compose.yaml (decision 0007)

fail() {
    echo "FALLO  $*"
    exit 1
}

command -v docker >/dev/null 2>&1 || fail "no hay docker en el PATH"
docker info >/dev/null 2>&1 || fail "Docker no esta en marcha"

# Un contenedor con este nombre es de una pasada que se corto de golpe. No se
# borra solo: antes de borrar algo, se mira que es.
if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    fail "ya hay un contenedor $CONTAINER. Si es de una pasada anterior: docker rm -f -v $CONTAINER"
fi

# Desde aqui, el contenedor se destruye al salir, salga como salga el guion.
trap 'docker rm -f -v "$CONTAINER" >/dev/null 2>&1' EXIT

docker run --rm -d --name "$CONTAINER" -p 127.0.0.1:5439:5432 \
    -e POSTGRES_PASSWORD=check "$IMAGE" >/dev/null \
    || fail "no se pudo crear el contenedor (esta libre el 5439?)"

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

echo "PostgreSQL $(docker exec "$CONTAINER" psql -U postgres -Atc 'SHOW server_version'), de usar y tirar"

out=$(docker exec -i "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 < db/schema.sql 2>&1) \
    || { echo "$out"; fail "db/schema.sql no carga"; }

docker exec -i "$CONTAINER" psql -U postgres -q -At -v ON_ERROR_STOP=1 < db/checks.sql \
    || fail "hay pruebas del esquema que fallan (arriba, las lineas FALLO)"

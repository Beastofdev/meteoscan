#!/usr/bin/env bash
#
# La unica lista de comprobaciones del proyecto.
#
#   bash check.sh
#
# La llaman el hook pre-push y GitHub Actions, y los dos llaman a ESTE fichero
# para que la lista se escriba en un solo sitio: dos listas escritas a mano se
# separan sin que nadie se entere, y la que se queda corta sigue en verde sin
# mirar (decision 0005). Una comprobacion nueva se anade aqui, y en ningun otro
# sitio.
#
# Y cuenta cuantas ha corrido. Con cero, "todo en verde" seria verdad y no
# diria nada: una lista vaciada por error se imprime igual que una limpia.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT" || exit 1

ran=0
failed=0

# run_check "<que se comprueba>" <orden> [argumentos...]
run_check() {
    local label="$1"; shift
    ran=$((ran + 1))
    echo "== $label =="
    if ! "$@"; then
        failed=$((failed + 1))
    fi
    echo
}

command -v node >/dev/null 2>&1 || { echo "FALLO  no hay node en el PATH"; exit 1; }

run_check "la documentacion" node docs/check_docs.mjs

# El esquema, sobre un PostgreSQL de usar y tirar en el 5439 (decision 0004).
# Hace falta Docker en marcha.
run_check "el esquema" bash db/check_all.sh

if [ "$ran" -eq 0 ]; then
    echo "FALLO  no se ha corrido ninguna comprobacion: la lista esta vacia"
    exit 1
fi
if [ "$failed" -ne 0 ]; then
    echo "HAY FALLOS: $failed de $ran comprobaciones."
    exit 1
fi
echo "Todo en verde: $ran de $ran comprobaciones."

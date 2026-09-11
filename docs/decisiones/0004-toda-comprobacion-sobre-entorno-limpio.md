# 0004 · Toda comprobación, sobre un entorno limpio

**Estado:** vigente
**Fecha:** 2026-09-11 · **Decide:** Carlos

## El problema

Una comprobación puede pasar, o fallar, por algo que no es lo que comprueba.
Hay dos formas típicas, y las dos parecen correctas:

- **Recargar el esquema sobre una base ya usada.** El DDL tira y recrea cada
  tabla, así que recargarlo *parece* empezar de cero. Pero la función del
  disparador se crea con `CREATE OR REPLACE`, que nunca borra: si alguien la
  quitara del fichero y dejara el disparador que la usa, sobre una base ya usada
  todo seguiría pasando, con la función de antes todavía viva. Sobre una limpia,
  fallaría al cargar.
- **Correr las pruebas sobre los datos de la pasada anterior.** Una prueba que
  da de alta «Sensor A» fallaría por el «Sensor A» que dejó la vez anterior, no
  por lo que comprueba, y el número de rechazos dejaría de significar nada.

El fallo de fondo es el mismo en los dos: **una comprobación que puede heredar
estado no es una comprobación.**

## Lo que se decidió

**El esquema se comprueba en un PostgreSQL de usar y tirar**, creado de cero y
destruido al acabar, en su propio puerto —el **5439**—, y nunca sobre la base de
desarrollo del **5438**. La decisión vive dentro del guion, para que no se
pueda olvidar.

Y tres reglas más, por el mismo motivo:

- **Un rechazo esperado va entre `SAVEPOINT` y `ROLLBACK TO`.** Una orden que
  falla deja la transacción abortada, y todo lo que venga detrás falla *por
  eso* y no por lo suyo: cuenta como rechazo y no ha comprobado nada. El guion
  cuenta esas sentencias saltadas, y si no son cero, falla.
- **Cada rechazo tiene que venir por la restricción que dice su etiqueta.** Eso
  no lo caza ningún contador: se comprueba leyendo el error.
- **Si un resultado sale idéntico al de antes de un cambio grande, se sospecha
  del método antes que del cambio.**

## Lo que se descartó, y por qué

**Probar sobre la base de desarrollo, para ir más rápido.** Es justo lo que abre
la puerta a los dos fallos de arriba. Levantar un contenedor de cero cuesta
segundos.

**Fiarse del total de rechazos.** Un número que sube puede estar subiendo por el
motivo equivocado.

## Lo que cuesta

Hace falta Docker, y cada comprobación tarda unos segundos más que sobre una
base ya montada. No hay atajo para probar una sola cosa sobre la base de
desarrollo, y es deliberado: ese atajo es el que puede mentir.

## Dónde vive en el código

- `db/check_all.sh` — llega con el paso 1
- [`check.sh`](../../check.sh) — lo llamará, con el resto de comprobaciones

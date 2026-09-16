# 0011 · Las pruebas de la API

**Estado:** vigente
**Fecha:** 2026-09-16 · **Decide:** Carlos

## El problema

Cada ruta se ha ido probando a mano con `curl`: el alta buena, el nombre
repetido, la fecha imposible, el sensor dado de baja. Eso tiene dos problemas:
se tarda, y **nadie lo repite**. Un cambio en una ruta puede romper otra sin
que nadie se entere hasta el panel.

El esquema ya tiene sus pruebas ([0004](0004-toda-comprobacion-sobre-entorno-limpio.md)),
y falta lo mismo para la API: el contrato que ve el panel.

## Lo que se decidió

1. **`node --test`, el corredor que trae Node**, sin librerías. No se mete una
   herramienta antes de que haga falta
   ([0001](0001-de-donde-salen-las-reglas.md)).
2. **Un guion, [`backend/check_api.sh`](../../backend/check_api.sh)**, como el
   del esquema: levanta un PostgreSQL de usar y tirar, le carga
   `db/schema.sql`, arranca la API contra esa base, pasa las pruebas y, con un
   `trap`, **destruye el contenedor y mata la API al salir, pase lo que pase**.
   Nunca toca la base de desarrollo ([0004](0004-toda-comprobacion-sobre-entorno-limpio.md)).
3. **En serie, con `--test-concurrency=1`.** Por defecto, Node corre cada
   fichero en su propio proceso y varios a la vez; como todas las pruebas
   comparten una sola base, se pisarían.
4. **Cada prueba crea sus propios datos, con nombres únicos**, sobre un esquema
   recién cargado. Así ninguna depende de lo que dejó la anterior.
5. **Se prueba el contrato HTTP**: los códigos, los códigos de error, la forma
   de las respuestas y las cabeceras. No se repite lo que ya prueban
   [`db/checks.sql`](../../db/checks.sql) ni se prueban el simulador o el
   panel.
6. **La API de las pruebas escucha en el 8005**, el de siempre. Si está
   ocupado, el guion se para y dice que hay que parar la API de desarrollo.
7. **Entra en [`check.sh`](../../check.sh)**, así que se corre antes de cada
   push y en GitHub Actions, con todo lo demás
   ([0005](0005-comprobaciones-en-local-y-en-ci.md)).
8. **Las variables de conexión van delante de `node src/server.js`**, no por
   `--env-file`: en GitHub Actions no hay `.env`, y con `--env-file` la API no
   arrancaría.

## Lo que se descartó, y por qué

- **Jest o Vitest**, los corredores más conocidos: traen su propio árbol de
  dependencias y su propia forma de hacer las cosas, para algo que Node ya sabe
  hacer.
- **`supertest`**, que levanta la API en memoria y le habla sin abrir un
  puerto: es cómodo, pero entonces no se prueba lo mismo que usa el panel, sino
  una versión de laboratorio. Aquí las pruebas hablan por HTTP, como el
  simulador.
- **`--test-global-setup`**, de Node 24, que levantaría el entorno desde
  JavaScript: su estabilidad es «early development», puede cambiar, y en este
  proyecto Docker ya se orquesta desde bash.
- **Correrlas en paralelo**: irían más rápido, pero comparten una base.
- **Vaciar las tablas entre ficheros** en vez de usar nombres únicos: obliga a
  no correr nunca nada en paralelo y esconde los fallos de aislamiento.
- **Un puerto aparte para las pruebas**: habría que reservarlo en la tabla de
  puertos de CONTRIBUTING y en la del ordenador, para ahorrar tener que parar
  la API de desarrollo un minuto.
- **Dejarlas fuera de `check.sh`**, para que no tarde tanto: unas pruebas que
  hay que acordarse de correr no se corren.

## Lo que cuesta

- **`check.sh` tarda bastante más**, y ahora necesita Docker **y** las
  dependencias de `backend/` instaladas.
- **La API de desarrollo tiene que estar parada** mientras se corren.
- **Prueban la API por fuera**, así que dicen que algo falla, no en qué línea:
  para eso está el registro de la API, que el guion enseña cuando algo va mal.
- **No prueban el simulador ni el panel.**

## Dónde vive en el código

- [`backend/check_api.sh`](../../backend/check_api.sh) — levanta el entorno y
  lo destruye
- `backend/test/` — el ayudante (`api.js`) y las pruebas de sensores, lecturas
  y errores
- [`check.sh`](../../check.sh) — la línea que las mete en la lista

## Fuentes

La documentación de Node 24 sobre
[su corredor de pruebas](https://nodejs.org/docs/latest-v24.x/api/test.html) y
sus [opciones](https://nodejs.org/docs/latest-v24.x/api/cli.html), consultada
el 16 de septiembre de 2026: cada fichero corre en su propio proceso, la
concurrencia por defecto es `os.availableParallelism() - 1`, y
`--test-global-setup` está en «early development».

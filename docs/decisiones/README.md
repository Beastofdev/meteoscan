# Decisiones

Una por fichero. El problema, lo que se decidió, **qué se descartó y por qué**, y
lo que cuesta.

El apartado que hace que esto no se pudra es **«Dónde vive en el código»**: si
lo que dice la decisión ya no está en el fichero que nombra, una de las dos
cosas está mal, y se ve enseguida.

## Índice

| # | Decisión | De qué va |
|---|---|---|
| [0001](0001-de-donde-salen-las-reglas.md) | De dónde salen las normas | Cada norma, con el problema que evita aquí; ninguna herramienta antes de hacer falta |
| [0002](0002-la-base-de-datos-impone.md) | La base de datos impone, no confía | La postura de la que sale el esquema |
| [0003](0003-el-vocabulario-no-se-inventa.md) | El vocabulario no se inventa | De dónde salen los valores de una lista cerrada, y de dónde no |
| [0004](0004-toda-comprobacion-sobre-entorno-limpio.md) | Toda comprobación, sobre un entorno limpio | Por qué el esquema se prueba en un contenedor que se destruye al acabar |
| [0005](0005-comprobaciones-en-local-y-en-ci.md) | Comprobaciones en local y en GitHub Actions | Por qué aquí sí hay CI, y por qué el hook y el workflow llaman al mismo guion |
| [0006](0006-el-diseno-de-la-base-de-datos.md) | El diseño de la base de datos | Tres tablas, la unidad en el tipo de sensor, y baja lógica en vez de borrado |
| [0007](0007-la-base-de-desarrollo-en-docker.md) | La base de desarrollo, en Docker | PostgreSQL 18 en un contenedor, abierto solo a este ordenador, y por qué no la 17 ni la 19 |
| [0008](0008-la-api-con-express.md) | La API con Express | Express 5, la conexión con la base por variables de entorno, y las rutas en castellano con los campos como las columnas |
| [0009](0009-los-errores-de-la-api.md) | Los errores de la API | Un formato propio con código estable y mensaje, el 404 y el 500 en JSON, y por qué no la RFC 9457 |
| [0010](0010-el-simulador.md) | El simulador | Escribe por `POST /lecturas`, simula los sensores en servicio y genera un paseo aleatorio por tipo |
| [0011](0011-las-pruebas-de-la-api.md) | Las pruebas de la API | `node --test` sin librerías, sobre un PostgreSQL de usar y tirar y la API en marcha |

## Qué merece una decisión aquí

Lo que **alguien podría querer deshacer sin saber lo que costó**. Si al leer el
código la pregunta natural es «¿y por qué no lo hicieron de la forma obvia?»,
eso es una decisión.

Lo que **no** va aquí:

- **Cómo funciona una tabla** — eso es un comentario en `db/schema.sql`, pegado
  a lo que explica.
- **Lo que hay que hacer más adelante** — eso es
  [`../pendiente.md`](../pendiente.md).

## La plantilla

```markdown
# NNNN · Título en una línea

**Estado:** vigente | sustituida por NNNN | revocada
**Fecha:** AAAA-MM-DD · **Decide:** quién

## El problema
Qué había delante. Sin esto, la decisión parece arbitraria.

## Lo que se decidió
En dos o tres frases. Lo concreto, no la intención.

## Lo que se descartó, y por qué
Lo más importante del documento. Una decisión sin alternativas es un decreto,
y un decreto no se puede revisar: no se sabe qué habría que volver a mirar.

## Lo que cuesta
Toda decisión tiene precio. Escribirlo evita que alguien lo descubra solo y
crea que fue un descuido.

## Dónde vive en el código
Ficheros y líneas. Es lo que permite comprobar que la decisión sigue siendo
verdad.
```

**El número no se reutiliza nunca.** Una decisión que deja de valer no se
borra: se marca `revocada` o `sustituida por`, y se queda. Saber que algo se
probó y se descartó vale tanto como saber lo que se hace hoy.

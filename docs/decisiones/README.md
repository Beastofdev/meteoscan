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
| [0012](0012-el-panel-con-react.md) | El panel con React y Vite | React 19 con Vite en el 5177, y un proxy al 8005 en vez de abrir CORS en la API |
| [0013](0013-la-lista-de-sensores.md) | La lista de sensores | Tarjetas, las llamadas a la API en un solo fichero, y los códigos del tipo y la unidad traducidos en el panel |
| [0014](0014-el-formulario-de-alta.md) | El formulario de alta | Los tipos salen de la lista del panel, campos controlados, y el panel no valida: cada error de la API, bajo su campo |
| [0015](0015-la-baja-desde-el-panel.md) | La baja desde el panel | Entra aunque no está en las vistas; se confirma en la tarjeta, y un `404` cuenta como baja hecha |
| [0016](0016-el-detalle-de-un-sensor.md) | El detalle de un sensor | Una pantalla con su dirección y React Router, las llamadas a la API por `/api`, y el gráfico con recharts |
| [0017](0017-los-umbrales-de-alerta.md) | Los umbrales de alerta | 35 °C y 35 µg/m³ con su fuente, la humedad sin umbral, y el umbral en el tipo de sensor |
| [0018](0018-el-ultimo-valor-en-la-lista.md) | El último valor en la lista de sensores | `GET /sensores` trae el umbral y la última lectura de cada sensor, en una consulta |
| [0019](0019-la-alerta-y-el-refresco.md) | La alerta en el panel, y el refresco | Borde, valor y texto en rojo al pasar del umbral, la línea del umbral en el gráfico, y la pantalla al día cada cinco segundos |
| [0020](0020-las-pruebas-del-panel.md) | Las pruebas del panel | Playwright contra la aplicación entera, solo Chromium, y los fallos que no se pueden provocar, simulados |
| [0021](0021-docker-para-levantarlo-todo.md) | Docker para levantarlo todo | Un perfil levanta base, API, panel y simulador; nginx sirve el panel y reenvía `/api` |

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

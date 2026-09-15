# 0008 · La API con Express

**Estado:** vigente
**Fecha:** 2026-09-13 y 2026-09-15 · **Decide:** Carlos

## El problema

Los [requisitos](../especificacion.md) piden la API en Node.js con Express y
dan sus cinco rutas, pero dejan abierto todo lo demás:

- qué versión de Express;
- de dónde saca la API los datos de la base;
- qué hace si la base no contesta;
- en qué idioma van las rutas y los campos;
- qué devuelve cada ruta;
- cómo se reparte el código.

Dos de esas preguntas chocan con otras decisiones. Los requisitos dan las rutas
en castellano, y el esquema está en inglés
([0006](0006-el-diseno-de-la-base-de-datos.md)). Y piden «listar todos los
sensores», pero un sensor eliminado no se borra: se da de baja.

## Lo que se decidió

**El servidor:**

1. **Express 5.** Si una ruta `async` falla, el error llega solo al manejador
   de errores de Express.
2. **Módulos de JavaScript (`import`)**, con `"type": "module"` en
   `package.json`.
3. **Escucha solo en `127.0.0.1:8005`**, como la base
   ([0007](0007-la-base-de-desarrollo-en-docker.md)).
4. **`node --watch` para desarrollar** (`npm run dev`): reinicia la API al
   guardar un fichero.

**La conexión con la base:**

5. **Node lee el `.env`** con `--env-file=../.env`, en los scripts de
   `package.json`.
6. **Una variable por dato**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y
   `DB_NAME`. En [`.env.example`](../../.env.example) van rellenas, salvo la
   clave.
7. **La base, en `127.0.0.1`, no en `localhost`.**
8. **Si falta una variable, la API no arranca**, y dice cuál.
9. **Un pool de conexiones de `pg`**, que espera como mucho 2 segundos al
   conectar y escucha su evento `error`.
10. **`GET /health`**, aunque no está en los requisitos, para vigilar el
    servicio: `200` si la API llega a la base, y `503` si no, con el detalle
    del error solo en el registro del servidor.

**Las rutas:**

11. **Las rutas, en castellano, como en los requisitos** (`/sensores`,
    `/lecturas`). El código sigue en inglés.
12. **Los campos del JSON, con el nombre de su columna** (`sensor_id`, `name`,
    `created_at`): cada dato tiene un solo nombre en la base, en la API y en el
    panel.
13. **`GET /sensores` devuelve solo los sensores en servicio**, ordenados por
    nombre y con la unidad de su tipo, sin `retired_at`. Es una lista a secas,
    y si no hay ninguno, `[]` con `200`.
14. **Un router de Express por recurso**, en `backend/src/routes/`, que
    `server.js` monta con `app.use`.

## Lo que se descartó, y por qué

- **Express 4**, la versión de la mayoría de los tutoriales. El error de una
  ruta `async` se escapa de Express, y desde Node 15 una promesa rechazada que
  nadie captura tumba el proceso: un fallo de la base dejaría la API caída.
  Evitarlo pide un `try/catch` en cada ruta —y basta uno olvidado— o una
  librería más.
- **`require` (CommonJS)**, la forma original de Node. El panel, con React y
  Vite, usará `import`, y mezclar las dos formas en un proyecto es fuente de
  errores.
- **Escuchar en todas las direcciones**, que es lo que hace Node si no se le
  da una: la API quedaría al alcance de la red local, y todo lo que la usa
  corre en el mismo ordenador.
- **`nodemon`** y **`dotenv`**: dos librerías más para lo que Node ya hace
  ([0001](0001-de-donde-salen-las-reglas.md)). `--watch` es estable desde Node
  22, y `--env-file` dejó de ser experimental en Node 24.10. Además, si falta
  el `.env`, Node no arranca.
- **Una sola `DATABASE_URL`** (`postgres://usuario:clave@host:puerto/base`),
  habitual en los servicios de alojamiento: mete la contraseña dentro de una
  dirección, y la duplica, porque Compose ya lee `DB_PASSWORD`.
- **`localhost`**: Windows lo resuelve primero a `::1`, la dirección de IPv6,
  y la base solo escucha en `127.0.0.1`. Conectar dependería de que el cliente
  pruebe también la segunda dirección.
- **No comprobar las variables al arrancar**: el fallo llegaría con la primera
  consulta, y con un error que no dice qué variable falta.
- **Abrir una conexión por consulta**: PostgreSQL arranca un proceso por cada
  conexión, y hacerlo en cada petición cuesta.
- **El tiempo de espera por defecto de `pg`**, que es sin límite: con la base
  colgada, cada petición se quedaría esperando.
- **El pool sin escuchar `error`**: si una conexión en reposo se cae —porque
  la base se reinicia, por ejemplo— y nadie escucha el evento, puede tumbar la
  API. Lo advierte la documentación de `pg`.
- **Que `/health` diga `200` aunque la base no conteste**, con el fallo solo en
  el cuerpo: quien vigila un servicio mira el código de la respuesta.
- **Las rutas en inglés** (`/sensors`), como el código: un cliente escrito
  según los requisitos no funcionaría.
- **Los campos en castellano** (`nombre`), como los requisitos, o **en
  camelCase** (`sensorId`), el estilo habitual en JavaScript: en los dos casos
  habría que traducir cada columna, y cada dato tendría dos nombres.
- **Todos los sensores, también los dados de baja**, como dicen los requisitos:
  después de un `DELETE /sensores/:id` el sensor seguiría en la lista, y para
  quien usa la API eliminar no habría hecho nada. La 0006 ya dice que el sensor
  dado de baja deja de salir en el panel.
- **La lista dentro de un objeto** (`{ "sensors": [...] }`): deja sitio para
  añadir datos, como la paginación, que con un puñado de sensores no hace falta.
- **Un `404` cuando no hay sensores**: una lista vacía es una respuesta válida,
  no algo que no existe.
- **Todo en `server.js`**: es lo más simple con una ruta, pero con cinco, la
  validación y los errores sería un fichero largo que lo mezcla todo. **Por
  capas** (rutas, controladores, servicios, repositorios), lo habitual en
  proyectos grandes, es demasiado para cinco rutas (0001): el SQL se queda en
  cada ruta, y si crece, se separa entonces.

## Lo que cuesta

- **Muchos ejemplos de Express 4 no funcionan tal cual en la 5.** Cambia, por
  ejemplo, la sintaxis de los comodines: `/*` se escribe `/*splat`.
- **Quien usa la API ve dos idiomas**: `GET /sensores` devuelve `name`, no
  `nombre`. Y en el panel se escribe `sensor.sensor_id`, en vez del
  `sensor.sensorId` habitual en JavaScript.
- **Los sensores dados de baja no se ven desde la API**, solo en la base.
- **La API no se alcanza desde otro dispositivo**, como un móvil en la misma
  red, sin cambiar la dirección en la que escucha.
- **Una variable que ya exista en la terminal gana a la del `.env`.** Así se
  apunta la API a otra base para probarla sin tocar el fichero; pero una
  `DB_PORT` olvidada en la terminal cambia de base sin avisar.
- **Sin `npm start` o `npm run dev`, hay que pasar `--env-file` a mano**: si
  no, la API no arranca, porque le faltan las variables.
- **Una base que tarde más de 2 segundos en aceptar una conexión se da por
  caída.** En este ordenador sobra; con una base remota habría que revisarlo.
- **`/health` dice si la API llega a la base, no si cada ruta funciona.**

## Dónde vive en el código

- [`backend/package.json`](../../backend/package.json) — `"type": "module"`,
  los scripts con `--env-file` y `--watch`, y Node 24
- [`backend/src/server.js`](../../backend/src/server.js) — `/health`, el router
  de `/sensores` y la escucha en `127.0.0.1:8005`
- [`backend/src/db.js`](../../backend/src/db.js) — la comprobación de las
  variables y el pool
- [`backend/src/routes/sensors.js`](../../backend/src/routes/sensors.js) —
  `GET /sensores`
- [`.env.example`](../../.env.example) — las variables de la conexión

## Fuentes

Consultadas el 15 de septiembre de 2026: la documentación de Express sobre
[el manejo de errores](https://expressjs.com/en/guide/error-handling.html) y
[el paso a la 5](https://expressjs.com/en/guide/migrating-5.html); la de las
[opciones de Node 24](https://nodejs.org/docs/latest-v24.x/api/cli.html)
(`--env-file`, `--watch` y `--unhandled-rejections`) y la de su
[`server.listen`](https://nodejs.org/docs/latest-v24.x/api/net.html); y la del
[pool de `pg`](https://node-postgres.com/apis/pool).

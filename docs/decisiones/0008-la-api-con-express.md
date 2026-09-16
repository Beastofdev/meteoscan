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
15. **`POST /sensores` acepta un objeto JSON con tres campos de texto —`name`,
    `sensor_type` y `location`— y ninguno más.** Les quita los espacios de los
    extremos, cuenta los caracteres como PostgreSQL (un emoji, uno) y comprueba
    las longitudes de sus columnas. Responde `201` con el sensor creado, con la
    misma forma que `GET /sensores`, sacado con una sola orden: el `INSERT ...
    RETURNING`, dentro de un `WITH`, y el `JOIN` de la unidad.
16. **La validación, a mano**, en el fichero de cada recurso: una función que
    comprueba y limpia el cuerpo, y lanza el primer error que encuentra. Lo que
    comparten los routers —el formato del uuid, que el cuerpo sea un objeto y
    que no sobre ningún campo— está en `validation.js`. Los errores, en la
    [0009](0009-los-errores-de-la-api.md).
17. **`DELETE /sensores/:id` da de baja el sensor**, con
    `UPDATE sensors SET retired_at = now() WHERE sensor_id = $1 AND retired_at IS NULL`.
    El `AND retired_at IS NULL` impide que una segunda baja mueva la fecha, y
    hace que, con dos bajas a la vez, la segunda no cambie nada. Responde
    `204`, sin cuerpo; y `404` si el sensor no existe, si ya estaba dado de
    baja o si el id no es un uuid, cuyo formato se comprueba antes de tocar la
    base.
18. **`POST /lecturas` acepta un objeto JSON con tres campos —`sensor_id`,
    `value` y `recorded_at`— y ninguno más.**
    - `value` es un número JSON finito, sin límites por tipo de sensor.
    - `recorded_at` es un texto con la forma de la
      [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339): con la zona
      obligatoria (`Z` o `+hh:mm`, hasta 14 horas), una fecha que exista de
      verdad y como mucho milisegundos. La API lo comprueba pieza a pieza, sin
      `Date.parse`, y pasa el mismo texto a PostgreSQL.
    - Un `sensor_id` que no es un uuid no lleva a ningún sensor.

    Responde `201` con la lectura guardada: `reading_id` va como texto, como
    lo da `pg`, y `recorded_at`, en UTC.

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
- **Ignorar los campos de más en un alta**: quien mandara `retired_at` creería
  haberlo puesto.
- **Rechazar los espacios de los extremos, o guardarlos tal cual**: lo primero
  es demasiado estricto para un formulario; lo segundo deja datos sucios, y si
  lo que sobra de un `VARCHAR` son espacios, PostgreSQL los recorta sin avisar.
- **Contar con `.length`**: cuenta un emoji como dos, y rechazaría nombres que
  la base acepta.
- **Devolver solo el id del sensor creado, o sacarlo con dos consultas**: el
  panel necesitaría otra petición para pintarlo, o serían dos viajes a la base.
- **La cabecera `Location`**, lo típico de un `201`: apuntaría a
  `GET /sensores/:id`, que no está en los requisitos.
- **Una librería de validación**, como `zod` o `express-validator`: sería una
  dependencia para tres campos (0001).
- **Un `200` con el sensor dado de baja**: el panel solo tiene que quitarlo de
  su lista, y `retired_at` es algo que la API no enseña. Para un `DELETE` hecho
  sin nada más que decir, el estándar recomienda `204`
  ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)).
- **Otro `204` para un sensor que ya estaba de baja**, porque `DELETE` es
  idempotente: eso habla del efecto, que es el mismo, no de la respuesta. **Un
  `409` o un `410` (Gone)**: revelarían que ese sensor existió, y para la API
  un sensor dado de baja ya no existe.
- **Un `400` para un id que no es un uuid**: el diagnóstico sería más preciso,
  pero solo lo provoca una dirección escrita a mano, y el panel tendría un caso
  más que atender.
- **`Date.parse` para validar la hora de una lectura**: se inventa fechas —el
  30 de febrero lo convierte en el 2 de marzo— y toma una hora sin zona como
  hora del ordenador.
- **Aceptar una hora sin zona y suponer UTC**, como hace PostgreSQL: con un
  sensor en hora local, se guardaría mal sin avisar.
- **Cualquier número de decimales**: PostgreSQL guarda microsegundos, pero
  JavaScript solo milisegundos, así que la API devolvería otra hora que la
  guardada.
- **Límites por tipo de sensor**, como los que da la propia definición
  (humedad relativa de 0 a 100, PM2.5 no negativo): un sensor real mal
  calibrado manda valores algo fuera de rango, y se perderían. Quedan en
  [`pendiente.md`](../pendiente.md).
- **Tratar la lectura repetida como un éxito**, para que un sensor que
  reintenta no reciba un error: habría que comparar el valor y decidir qué
  cuenta como «la misma lectura».
- **`reading_id` como número**: sería una conversión que un día podría ir mal,
  al pasar de 2⁵³. **No devolverlo**: la lectura ya se identifica por su
  sensor y su instante, pero lo normal es que un alta devuelva lo que guardó.

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
- **La validación repite las longitudes de las columnas de `schema.sql`.** Si
  una columna cambia y la API no, o sale un `500` —la base rechaza lo que la
  API dejó pasar— o la API rechaza lo que la base aceptaría. Las pruebas de la
  API tendrán que vigilarlo.
- **La API solo acepta el uuid en su forma normal**, 8-4-4-4-12 con guiones,
  aunque PostgreSQL acepte también la que va sin guiones o entre llaves: con
  esas, la API contesta `404`.
- **La hora de una lectura llega como mucho a milisegundos**, aunque
  PostgreSQL guarde microsegundos: un sensor que mande más precisión recibe un
  `400`.
- **La forma de la hora es estricta**: con `T` entre la fecha y la hora, y con
  la zona. Un texto como `2026-09-15 13:06:07+02:00`, que PostgreSQL
  entendería, se rechaza.
- **Las zonas llegan como mucho a 14 horas**: es la mayor que existe, la de
  Kiribati, y PostgreSQL rechaza a partir de 16.

## Dónde vive en el código

- [`backend/package.json`](../../backend/package.json) — `"type": "module"`,
  los scripts con `--env-file` y `--watch`, y Node 24
- [`backend/src/server.js`](../../backend/src/server.js) — `/health`, el router
  de `/sensores` y la escucha en `127.0.0.1:8005`
- [`backend/src/db.js`](../../backend/src/db.js) — la comprobación de las
  variables y el pool
- [`backend/src/routes/sensors.js`](../../backend/src/routes/sensors.js) —
  `GET /sensores`, `POST /sensores` con la validación del alta, y
  `DELETE /sensores/:id`
- [`backend/src/routes/readings.js`](../../backend/src/routes/readings.js) —
  `POST /lecturas`, con la validación de la hora
- [`backend/src/validation.js`](../../backend/src/validation.js) — lo que
  comparten los routers
- [`.env.example`](../../.env.example) — las variables de la conexión

## Fuentes

Consultadas el 15 de septiembre de 2026: la documentación de Express sobre
[el manejo de errores](https://expressjs.com/en/guide/error-handling.html) y
[el paso a la 5](https://expressjs.com/en/guide/migrating-5.html); la de las
[opciones de Node 24](https://nodejs.org/docs/latest-v24.x/api/cli.html)
(`--env-file`, `--watch` y `--unhandled-rejections`) y la de su
[`server.listen`](https://nodejs.org/docs/latest-v24.x/api/net.html); y la del
[pool de `pg`](https://node-postgres.com/apis/pool).

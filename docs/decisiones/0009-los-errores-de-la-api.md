# 0009 · Los errores de la API

**Estado:** vigente
**Fecha:** 2026-09-15 · **Decide:** Carlos

## El problema

[CONTRIBUTING](../../CONTRIBUTING.md) pide que cada error lleve un código
estable además del mensaje —el mensaje, para las personas; el código, para los
programas—, y deja la forma exacta para cuando se construya la API.

Lo que hace Express si no se le dice otra cosa no sirve:

- una ruta que no existe responde `404` con una página HTML («Cannot GET
  /nada»);
- un fallo inesperado responde `500` con otra página HTML que, fuera de
  producción, lleva la traza del error: las funciones por las que pasó, con las
  rutas de los ficheros en el servidor;
- ninguna de las dos lleva un código que un programa pueda comparar;
- y cada respuesta anuncia `X-Powered-By: Express`.

## Lo que se decidió

1. **Todos los errores tienen la misma forma:**

   ```json
   { "error": { "code": "not_found", "message": "No existe la ruta GET /nada." } }
   ```

   Van dentro de `error`, para que un error se distinga de un dato de un
   vistazo. Si el error es de un campo, lleva también `field`, con su nombre:

   ```json
   { "error": { "code": "invalid_field", "field": "name", "message": "El nombre no puede pasar de 100 caracteres." } }
   ```

   Se da un error cada vez: el primero que se encuentra.
2. **El código, en inglés y en `snake_case`; el mensaje, en castellano y con sus
   tildes.** El código es un identificador y no cambia; el mensaje se puede
   reescribir sin romper a nadie. El JSON viaja en UTF-8, y la norma de quitar
   los acentos es para los `.sql` y lo que sale por terminal.
3. **Las rutas lanzan un `HttpError(status, code, message, field)`, y una sola
   función, `errorHandler`, escribe todas las respuestas de error.** Es la única
   que conoce el formato.
4. **Los códigos HTTP:** `400` para lo que está mal en lo que se manda, `404`
   para lo que no existe, `409` para lo que choca con lo que ya hay, `413` para
   un cuerpo demasiado grande y `500` para un fallo de la API.
5. **Lo que ninguna ruta contesta responde `404` en JSON**, desde `notFound`,
   que va detrás de todas las rutas.
6. **Los errores de PostgreSQL se traducen por su código y el nombre de su
   restricción**, y solo los que una ruta puede provocar con datos válidos.
   Hace falta el código porque la misma restricción da otro en otra operación:
   la clave ajena del tipo da `23503` al crear un sensor, y `23001` al borrar un
   tipo en uso. Lo demás, como un `22001` o un `CHECK`, no debería llegar a la
   base, porque la validación lo para antes: si llega, es un fallo de la API, y
   sale como `500`. Tampoco se traduce el `22P02`, un texto que no se puede
   convertir, como un id que no es un uuid: no dice de qué campo es, y sale
   igual con un número o una fecha mal escritos. El formato se comprueba antes,
   en la ruta.

   | Código | Restricción | Respuesta |
   |---|---|---|
   | `23505` | `uq_sensors_name_in_service` | `409`, `sensor_name_taken`, campo `name` |
   | `23503` | `fk_sensors_sensor_type` | `400`, `unknown_sensor_type`, campo `sensor_type` |
   | `23503` | `fk_readings_sensor_id` | `400`, `unknown_sensor`, campo `sensor_id` |
   | `23514` | `readings_sensor_in_service`, el disparador | `409`, `sensor_retired` |
   | `23505` | `uq_readings_sensor_recorded` | `409`, `reading_already_exists`, campo `recorded_at` |

7. **Los errores de `express.json()`** traen su código HTTP y un tipo:
   `entity.parse.failed` sale como `invalid_json`; `entity.too.large`, como
   `body_too_large`; y cualquier otro 4xx, como `invalid_body`. Sus 5xx son
   fallos del servidor, y siguen al `500`. Y el del router de Express con un
   `%` que no se puede descifrar en la dirección —un `URIError` con `status`
   400— sale como `invalid_url`.
8. **Un fallo inesperado responde `500` con `internal_error` y un mensaje
   genérico.** El error completo, con su traza, va solo al registro del
   servidor.
9. **Sin la cabecera `X-Powered-By`.**
10. **`/health` es la excepción.** Con la base caída responde `503` con la
    misma forma que cuando va bien (`{"status": ..., "database": ...}`),
    porque esa es la respuesta a lo que se le pregunta, no un fallo de la
    petición. Quien vigila el servicio lee esos campos.

### Los códigos

Fuente: Carlos, 2026-09-15 ([0003](0003-el-vocabulario-no-se-inventa.md)).
Cada error nuevo añade aquí su fila.

| code | HTTP | Cuándo |
|---|---|---|
| `invalid_json` | 400 | El cuerpo no es JSON válido |
| `invalid_body` | 400 | El cuerpo no es un objeto JSON, lleva un campo que no existe, o `express.json()` no lo ha podido leer (entonces, con el 4xx que traiga ese error) |
| `invalid_field` | 400 | Un campo falta, no es texto, está en blanco o es demasiado largo |
| `unknown_sensor_type` | 400 | El tipo de sensor no existe |
| `unknown_sensor` | 400 | No existe ese sensor, o el `sensor_id` no es un uuid |
| `invalid_url` | 400 | La dirección tiene un `%` que no se puede descifrar |
| `not_found` | 404 | Ninguna ruta contesta a ese método y esa ruta |
| `sensor_not_found` | 404 | No hay ningún sensor en servicio con ese id, o el id no es un uuid |
| `sensor_name_taken` | 409 | Ya hay un sensor en servicio con ese nombre |
| `sensor_retired` | 409 | El sensor estaba dado de baja cuando se midió la lectura |
| `reading_already_exists` | 409 | Ya hay una lectura de ese sensor en ese instante |
| `body_too_large` | 413 | El cuerpo pasa del límite de `express.json()`, 100 KB |
| `internal_error` | 500 | Un fallo que la API no esperaba |

## Lo que se descartó, y por qué

- **El estándar, la [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)**
  («Problem Details», que sustituye a la 7807). Su identificador del problema
  es `type`, y tiene que ser una URI:
  - la RFC recomienda que sea absoluta, con dominio, y avisa de que las
    relativas pueden causar confusión; MeteoScan no tiene dominio;
  - una URI `tag:` también pide un dominio o un correo propios, y pasar
    después a una que se pueda abrir cambiaría el identificador;
  - `about:blank` significa que no hay más que el código HTTP, y no
    distinguiría dos errores con el mismo código.

  Además, para un solo cliente, el panel, son cinco campos donde hacen falta
  dos. Con una API pública y muchos clientes, sería la buena elección.
- **Solo un mensaje** (`{ "error": "..." }`): el panel tendría que comparar
  textos, y cambiar una coma lo rompería.
- **Los dos campos sueltos** (`{ "code": ..., "message": ... }`), sin `error`
  alrededor: un error se confundiría con un recurso, que también es un objeto.
- **Todos los errores a la vez, en una lista**: es más cómodo en un formulario
  grande. Con tres campos, y con el formulario comprobando antes de enviar,
  basta uno, y el formato sigue siendo simple.
- **Que cada ruta escriba su propio error** con `res.status(...).json(...)`: el
  formato quedaría copiado en cada ruta, y bastaría con que una copia se
  desviara.
- **`422` para la validación**, que la [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)
  define para un contenido bien escrito que no se puede procesar. Lo usan
  algunas API, pero `400` es más simple, y cubre todo lo que está mal en lo que
  se manda.
- **`415` para un cuerpo que no es JSON**: es más preciso, pero sería un caso
  aparte para una petición que el panel no hace.
- **Traducir cualquier `23514` o `22001` como `400`**: disfrazaría un fallo de
  la validación de culpa de quien manda los datos.
- **Comprobar antes con un `SELECT` si el nombre ya existe**: dos altas iguales
  a la vez pasarían las dos el `SELECT`. Solo el índice único para a la
  segunda, así que es su error el que se traduce.
- **`NODE_ENV=production` con el manejador de serie de Express**: quitaría la
  traza, pero seguiría respondiendo en HTML, sin código, y dependería de no
  olvidar la variable.

## Lo que cuesta

- **El formato es propio**: quien use la API tiene que conocerlo, y ninguna
  herramienta lo reconoce sola.
- **Un código publicado es un compromiso.** Cambiarle el nombre rompe al panel:
  se añaden códigos, no se renombran.
- **Cada caso de error nuevo necesita su código**, decidido y apuntado en la
  tabla.
- **Cada restricción que una ruta pueda provocar necesita su fila en la
  traducción.** Si falta, su error sale como `500`: se ve, pero con el código
  equivocado.
- **Los mensajes llevan tildes**, así que el código tiene texto fuera de ASCII,
  aunque solo en los mensajes.
- **Un error traducido no lleva los datos del motor.** `sensor_retired` no dice
  desde cuándo está de baja el sensor: esa fecha va en el mensaje de
  PostgreSQL, que no se enseña.
- **Quitar `X-Powered-By` no detiene a un atacante preparado**, como avisa la
  propia guía de seguridad de Express: hay otras formas de saber que una
  aplicación es Express. Lo que evita es anunciarlo en cada respuesta.
- **`errorHandler` tiene que declarar `next` aunque casi nunca lo use.** Express
  reconoce un manejador de errores por sus cuatro parámetros; sin `next`, los
  errores vuelven a la página de serie, con la traza.

## Dónde vive en el código

- [`backend/src/errors.js`](../../backend/src/errors.js) — `HttpError`, las
  traducciones, `notFound` y `errorHandler`
- [`backend/src/routes/sensors.js`](../../backend/src/routes/sensors.js) — los
  errores de la validación del alta, y el `404` de la baja
- [`backend/src/routes/readings.js`](../../backend/src/routes/readings.js) —
  los errores de la validación de una lectura
- [`backend/src/validation.js`](../../backend/src/validation.js) — el
  `invalid_body` que comparten los dos routers
- [`backend/src/server.js`](../../backend/src/server.js) — `express.json()`, la
  cabecera, y el orden: las rutas, `notFound` y `errorHandler`

## Fuentes

Consultadas el 15 de septiembre de 2026: la documentación de Express sobre
[el manejo de errores](https://expressjs.com/en/guide/error-handling.html),
[el 404](https://expressjs.com/en/starter/faq.html) y
[la seguridad](https://expressjs.com/en/advanced/best-practice-security.html);
la de [`body-parser`](https://github.com/expressjs/body-parser), la librería de
`express.json()`, sobre sus errores; las RFC
[9457](https://www.rfc-editor.org/rfc/rfc9457) y
[9110](https://www.rfc-editor.org/rfc/rfc9110); y el código de los paquetes que
usa Express 5: `router`, que distingue un manejador de errores por su número de
parámetros, y `finalhandler`, el manejador de serie.

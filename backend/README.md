# La API y el simulador

La API que guarda y sirve los sensores y sus lecturas, y el simulador que hace
de red de sensores. **Cómo arrancarlos**, en el [README de la raíz](../README.md);
**las rutas**, también.

## Qué hay aquí

| | |
|---|---|
| `src/server.js` | Monta la aplicación en orden: el JSON, `/health`, las rutas y los errores |
| `src/db.js` | El pool de conexiones, y comprueba al arrancar que están las variables del `.env` |
| `src/routes/sensors.js` | `/sensores`: la lista, el alta, la baja y el histórico de un sensor |
| `src/routes/readings.js` | `/lecturas`: guardar una lectura, con su hora en RFC 3339 |
| `src/errors.js` | Un solo formato de error, y la traducción de los de PostgreSQL a respuestas HTTP |
| `src/validation.js` | Lo que comparten los dos routers |
| `src/simulator.js` | Manda una lectura de cada sensor cada pocos segundos, por `POST /lecturas` |
| `test/` | Las 25 pruebas, con `node --test`, y el ayudante que usan |
| `check_api.sh` | Las levanta contra un PostgreSQL de usar y tirar, y lo destruye al acabar |
| `Dockerfile` | La imagen de la API, que el simulador comparte |

En total, unas 600 líneas.

## Por dónde empezar a leer

1. **`src/server.js`** (57 líneas): en qué orden se monta todo, y por qué ese
   orden importa.
2. **`src/routes/sensors.js`** (169): el fichero que más enseña. Las consultas
   van parametrizadas, y la validación está en la frontera.
3. **`src/errors.js`** (98): cómo un `23505` de PostgreSQL acaba siendo un `409`
   con un código estable.

El porqué de la forma de la API está en la
[0008](../docs/decisiones/0008-la-api-con-express.md); el de sus errores, en la
[0009](../docs/decisiones/0009-los-errores-de-la-api.md); y el del simulador, en
la [0010](../docs/decisiones/0010-el-simulador.md).

## Los errores

Todos tienen la misma forma. El **código** es para los programas y no cambia
nunca; el **mensaje**, para las personas, se puede reescribir. Si el error es de
un campo, dice cuál:

```json
{ "error": { "code": "invalid_field", "field": "name", "message": "El nombre no puede pasar de 100 caracteres." } }
```

Se da un error cada vez: el primero que se encuentra.

| code | HTTP | Cuándo |
|---|---|---|
| `invalid_json` | 400 | El cuerpo no es JSON válido |
| `invalid_body` | 400 | El cuerpo no es un objeto JSON, lleva un campo que no existe, o `express.json()` no lo ha podido leer |
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

Un error nuevo añade aquí su fila. Por qué la forma es esta, y no la de la RFC
9457, en la [0009](../docs/decisiones/0009-los-errores-de-la-api.md).

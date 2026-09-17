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

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
   vistazo.
2. **El código, en inglés y en `snake_case`; el mensaje, en castellano.** El
   código es un identificador y no cambia; el mensaje se puede reescribir sin
   romper a nadie.
3. **Las rutas lanzan un `HttpError(status, code, message)`, y una sola
   función, `errorHandler`, escribe todas las respuestas de error.** Es la única
   que conoce el formato.
4. **Lo que ninguna ruta contesta responde `404` en JSON**, desde `notFound`,
   que va detrás de todas las rutas.
5. **Un fallo inesperado responde `500` con `internal_error` y un mensaje
   genérico.** El error completo, con su traza, va solo al registro del
   servidor.
6. **Sin la cabecera `X-Powered-By`.**
7. **`/health` es la excepción.** Con la base caída responde `503` con la misma
   forma que cuando va bien (`{"status": ..., "database": ...}`), porque esa es
   la respuesta a lo que se le pregunta, no un fallo de la petición. Quien
   vigila el servicio lee esos campos.

### Los códigos

Fuente: Carlos, 2026-09-15 ([0003](0003-el-vocabulario-no-se-inventa.md)).
Cada error nuevo añade aquí su fila.

| code | HTTP | Cuándo |
|---|---|---|
| `not_found` | 404 | Ninguna ruta contesta a ese método y esa ruta |
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
- **Que cada ruta escriba su propio error** con `res.status(...).json(...)`: el
  formato quedaría copiado en cada ruta, y bastaría con que una copia se
  desviara.
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
- **Quitar `X-Powered-By` no detiene a un atacante preparado**, como avisa la
  propia guía de seguridad de Express: hay otras formas de saber que una
  aplicación es Express. Lo que evita es anunciarlo en cada respuesta.
- **`errorHandler` tiene que declarar `next` aunque casi nunca lo use.** Express
  reconoce un manejador de errores por sus cuatro parámetros; sin `next`, los
  errores vuelven a la página de serie, con la traza.

## Dónde vive en el código

- [`backend/src/errors.js`](../../backend/src/errors.js) — `HttpError`,
  `notFound` y `errorHandler`
- [`backend/src/server.js`](../../backend/src/server.js) — la cabecera, y el
  orden: las rutas, `notFound` y `errorHandler`

## Fuentes

Consultadas el 15 de septiembre de 2026: la documentación de Express sobre
[el manejo de errores](https://expressjs.com/en/guide/error-handling.html),
[el 404](https://expressjs.com/en/starter/faq.html) y
[la seguridad](https://expressjs.com/en/advanced/best-practice-security.html);
la [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457); y el código de los
paquetes que usa Express 5: `router`, que distingue un manejador de errores por
su número de parámetros, y `finalhandler`, el manejador de serie.

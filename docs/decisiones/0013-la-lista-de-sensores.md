# 0013 · La lista de sensores

**Estado:** vigente
**Fecha:** 2026-09-17 · **Decide:** Carlos

## El problema

Los requisitos piden una «lista de sensores (tarjetas o tabla)». `GET /sensores`
da, de cada sensor en servicio, su nombre, su tipo, su unidad, su ubicación, su
identificador y su fecha de alta. El tipo y la unidad llegan como códigos
pensados para guardar datos, no para leerlos: `temperature` y `Cel`
([0006](0006-el-diseno-de-la-base-de-datos.md)).

Es además la primera pantalla que enseña datos de la API, y las siguientes
—el alta, la baja, el detalle— también hablarán con ella. Hay que decidir dónde
vive esa conversación antes de que haya tres copias.

## Lo que se decidió

- **Tarjetas**, en una rejilla con tantas columnas como quepan.
- **Cada tarjeta, con el nombre, el tipo con su unidad y la ubicación.**
- **Todas las llamadas a la API, en `src/api.js`.** Cualquier fallo llega a la
  pantalla como un `ApiError` con un mensaje que se puede enseñar tal cual: el
  de la API, si lo explica con su formato
  ([0009](0009-los-errores-de-la-api.md)); uno genérico con el código HTTP, si
  no; y «No se pudo conectar con la API», si no hubo respuesta.
- **Los nombres legibles, en `src/sensorTypes.js`**: `temperature` se lee
  «Temperatura» y `Cel`, «°C». Un código que no está en la lista se enseña tal
  cual.
- **Un componente por fichero, en `src/components/`**, con su CSS al lado y las
  clases con el nombre del componente delante (`.sensor-card-name`).

## Lo que se descartó, y por qué

- **Una tabla.** Es más compacta, y sería mejor con cientos de sensores. Pero la
  alerta del umbral se lee de un vistazo en una tarjeta con el borde rojo, y en
  una tabla habría que colorear filas.
- **Un `fetch` en cada componente.** La comprobación de la respuesta y la
  traducción de los errores se repetirían en cada pantalla, y acabarían siendo
  distintas.
- **axios o TanStack Query.** `fetch` viene con el navegador, igual que en el
  simulador y en las pruebas de la API. Una librería de caché y reintentos
  resuelve problemas que este panel no tiene.
- **Una columna con el nombre legible en `sensor_types`**, devuelta por la API.
  Es cambiar el esquema y una ruta por algo que es de presentación, y no está en
  los requisitos.
- **Enseñar los códigos.** `Cel` o `ug/m3` no le dicen nada a quien mira el
  panel.
- **Un objeto literal para las traducciones, en vez de `Map`.** En un objeto, un
  código como `constructor` —que cumple la regla de los códigos del esquema—
  encontraría una función heredada en lugar de caer en «enséñalo tal cual».
- **CSS Modules**, que dan a cada clase un nombre único. Evitan los choques, a
  cambio de escribir `styles.name` en cada elemento. Con un puñado de
  componentes, el prefijo basta.
- **El identificador y la fecha de alta en la tarjeta.** Un uuid no ayuda a
  reconocer un sensor, y la fecha no la piden los requisitos.

## Lo que cuesta

- **Los tipos están en dos sitios**: en la base y en `sensorTypes.js`. Un tipo
  nuevo necesita su traducción; sin ella se ve su código, pero el panel no se
  rompe. De dónde saca el formulario de alta la lista de tipos sigue abierto en
  [`pendiente.md`](../pendiente.md).
- **La lista no se actualiza sola**: se pide al abrir el panel. Un sensor dado de
  alta desde otro sitio no aparece hasta recargar.
- **El prefijo de las clases es una costumbre, no una garantía**: nada impide que
  dos componentes usen la misma.

## Dónde vive en el código

- `frontend/src/api.js` — `getSensors`, `ApiError` y la traducción de los
  errores.
- `frontend/src/sensorTypes.js` — `typeLabel` y `unitSymbol`.
- `frontend/src/components/SensorList.jsx` y `SensorCard.jsx`, con su CSS.
- `frontend/src/App.jsx` — `Content`: consultando, error, lista vacía, y la
  lista.

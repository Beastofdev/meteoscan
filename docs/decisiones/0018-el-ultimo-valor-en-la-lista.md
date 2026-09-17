# 0018 · El último valor en la lista de sensores

**Estado:** vigente
**Fecha:** 2026-09-17 · **Decide:** Carlos

## El problema

El panel tiene que avisar cuando un valor pasa del umbral de su tipo
([0017](0017-los-umbrales-de-alerta.md)), y tiene que verse en la lista, que es
la vista de conjunto. Para eso hacen falta dos datos que `GET /sensores` no
daba: **el umbral del tipo** y **la última lectura de cada sensor**.

El histórico existe —`GET /sensores/:id/lecturas`—, pero devuelve hasta mil
lecturas de un solo sensor: pedirlo una vez por sensor, cada vez que la pantalla
se refresca, es traer miles de filas para quedarse con una de cada.

## Lo que se decidió

- **`GET /sensores` devuelve también `alert_threshold` y `last_reading`.** Nada
  de lo que ya devolvía cambia.
- **`alert_threshold` va suelto**, como `unit`: las dos son columnas del tipo.
  Vale `null` en los tipos sin umbral.
- **`last_reading` va agrupado**, con `value` y `recorded_at`, los mismos
  nombres que en el histórico, y vale `null` entero si el sensor no tiene
  lecturas.
- **Una sola consulta**, con `LEFT JOIN LATERAL`: para cada sensor en servicio,
  un `SELECT` que mira su propia fila y coge su última lectura por el índice del
  `UNIQUE (sensor_id, recorded_at)`.
- **`POST /sensores` devuelve la misma forma**: su umbral, y `last_reading` en
  `null`, porque un sensor recién creado no tiene lecturas.

## Lo que se descartó, y por qué

- **Que el panel pida el histórico de cada sensor.** Con tres sensores serían
  tres peticiones de hasta mil lecturas cada una, **en cada refresco**, para
  usar tres valores.
- **Una ruta nueva** que diera solo los últimos valores. Es una ruta fuera de los
  requisitos para algo que cabe en la que ya hay.
- **`last_value` y `last_recorded_at` sueltos.** Se parecen más a las columnas,
  pero «no tiene lecturas» habría que decirlo dos veces, y un día vendría uno
  con valor y el otro vacío.
- **Dos consultas**, una para los sensores y otra para los últimos valores,
  unidas en JavaScript. Son dos viajes a la base y dos resultados que cuadrar.
- **`DISTINCT ON (sensor_id)` sobre todas las lecturas.** Resuelve lo mismo, pero
  mira las lecturas de todos los sensores, incluidos los dados de baja, y
  después se queda con las de los que están en servicio.

## Lo que cuesta

- **Cada consulta de la lista toca la tabla de lecturas**, aunque quien llame
  solo quiera los nombres. Medido con 300 000 lecturas: `Index Scan Backward`
  sobre el índice, 12 bloques leídos y 0,25 ms.
- **La última lectura puede ser vieja** —un sensor que dejó de enviar—, y la
  alerta se calcularía sobre ella. Por eso viaja con su hora, y el panel la
  enseña.
- **El JSON de la lista crece** para todos los clientes, aunque solo el panel
  use los campos nuevos.

## Dónde vive en el código

- `backend/src/routes/sensors.js` — la consulta con `LEFT JOIN LATERAL` y
  `toSensor`, que agrupa la última lectura.
- `backend/test/sensores.test.js` — el umbral, la última lectura en desorden, el
  sensor sin lecturas, que cada uno trae la suya, y la forma del alta.

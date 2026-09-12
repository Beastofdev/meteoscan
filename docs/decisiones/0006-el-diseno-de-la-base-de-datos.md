# 0006 · El diseño de la base de datos

**Estado:** vigente
**Fecha:** 2026-09-11 · **Decide:** Carlos

## El problema

Los [requisitos](../especificacion.md) dan una estructura de partida:

- `sensores`: id, nombre, tipo, ubicación
- `lecturas`: id, sensor_id, valor, unidad, timestamp

y dejan cinco preguntas abiertas: en qué idioma van los nombres, dónde vive la
unidad, qué mide el sensor de «calidad del aire», qué pasa con las lecturas al
eliminar un sensor, y qué reglas cumplen el nombre y la ubicación.

## Lo que se decidió

**Tres tablas, con los nombres en inglés:**

```
sensor_types 1 ──< sensors 1 ──< readings
```

| Tabla | Qué guarda |
|---|---|
| `sensor_types` | Los tipos de sensor, y la unidad en que mide cada uno |
| `sensors` | Los sensores instalados: nombre, tipo, ubicación y, si la tiene, su fecha de baja |
| `readings` | Una fila por medida: de qué sensor, qué valor y cuándo se midió |

1. **Nombres en inglés**, como el resto del código. `ubicación`, con tilde,
   habría que entrecomillarlo en cada consulta.
2. **La unidad vive en el tipo, no en cada lectura.** Depende de qué mide el
   sensor, no de la medida: en cada lectura se repetiría millones de veces, y
   nada impediría una lectura en `%RH` de un sensor de temperatura. Tampoco en
   cada sensor: dos de temperatura podrían medir uno en °C y otro en °F, y un
   mismo umbral dejaría de significar lo mismo.
3. **La calidad del aire se mide como PM2.5**, partículas finas, en
   microgramos por metro cúbico. Es uno de los contaminantes que miden las
   redes de calidad del aire, y para el panel es un valor más con su unidad.
4. **Un sensor no se borra: se da de baja.** `DELETE /sensores/:id` rellena
   `retired_at`; el sensor deja de salir en el panel y sus lecturas se quedan.
   La clave ajena en `RESTRICT` impide borrarlo de verdad aunque se intente por
   fuera de la API, y un disparador rechaza las lecturas medidas después de la
   baja, también si a una ya guardada se le cambia la hora o el sensor. Las
   medidas antes sí entran: un registrador que estuvo sin conexión envía tarde
   lo que guardó.
5. **Nombre y ubicación, obligatorios y sin quedar en blanco.** El nombre, de
   hasta 100 caracteres y único entre los sensores en servicio —el de uno dado
   de baja queda libre—, sin distinguir mayúsculas ni los espacios de los
   extremos: «Sensor tejado» y «sensor tejado » son el mismo nombre. La
   ubicación, de hasta 200.

Y lo que se sigue de ahí:

- **Dos instantes por lectura.** `recorded_at` es cuándo se midió: lo manda el
  sensor y no tiene valor por defecto. `created_at` es cuándo llegó. El
  histórico se dibuja con el primero. Los dos son `TIMESTAMPTZ`, porque una
  hora sin zona horaria no dice cuándo pasó; y ninguno se llama `timestamp`,
  que es el nombre de un tipo de SQL.
- **`value` es `DOUBLE PRECISION`**, con una restricción que deja fuera `NaN`,
  `Infinity` y `-Infinity`: son valores válidos del tipo, y un sensor averiado
  los manda.
- **`UNIQUE (sensor_id, recorded_at)`.** Un sensor no mide dos veces en el mismo
  instante, así que un envío repetido no duplica la lectura. El mismo índice
  sirve a la clave ajena, que PostgreSQL no indexa por su cuenta.
- **Las claves:** `uuid` para el sensor, porque va en la URL, y un id mal
  tecleado no cae en otro sensor que exista; `BIGINT` para la lectura, porque
  son muchas filas que solo se añaden; y el propio código (`'temperature'`)
  para el tipo.

### Los valores de `sensor_types`

Fuente: los tipos salen de los requisitos —temperatura, humedad y calidad del
aire— y de la decisión de medir la última como PM2.5 (Carlos, 2026-09-11). Las
unidades son símbolos de SenML, comprobados en el
[registro de IANA](https://www.iana.org/assignments/senml/senml.xhtml) el 11 de
septiembre de 2026: `Cel` y `%RH` son unidades de la
[RFC 8428](https://www.rfc-editor.org/rfc/rfc8428), y `ug/m3` es una unidad
secundaria de la [RFC 8798](https://www.rfc-editor.org/rfc/rfc8798), que se pasa
a la principal, `kg/m3`, multiplicando por 10⁻⁹. Un mensaje SenML solo admite
unidades principales; MeteoScan no envía mensajes SenML, sino que toma de él los
símbolos, y en microgramos una lectura de PM2.5 es 12 y no 0,000000012. SenML
desaconseja `%` a secas: allí significa una proporción, no un porcentaje.

| code | unit | Qué es |
|---|---|---|
| `temperature` | `Cel` | Grados Celsius |
| `humidity` | `%RH` | Humedad relativa, en porcentaje |
| `pm25` | `ug/m3` | Partículas PM2.5, en microgramos por metro cúbico |

### El DDL

Está en [`db/schema.sql`](../../db/schema.sql), con un comentario pegado a cada
cosa que no se explica sola. No se copia aquí: dos copias del mismo DDL acaban
siendo distintas.

### Probado

Sobre un PostgreSQL 17 de usar y tirar, destruido al acabar: nueve rechazos,
cada uno por la restricción que dice su etiqueta, y ninguna sentencia saltada
por transacción abortada.

El 12 de septiembre de 2026 se repitió a mano sobre PostgreSQL 18, tabla a
tabla, con las reglas que se añadieron al escribirlas. El guion que lo repite
solo, `db/check_all.sh`, está por llegar.

| Se rechaza | Por |
|---|---|
| Un valor `NaN`, `Infinity` o `-Infinity` (tres casos) | `chk_readings_value` |
| La misma lectura dos veces | `uq_readings_sensor_recorded` |
| Un sensor de un tipo que no existe | `fk_sensors_sensor_type` |
| Un nombre en blanco | `chk_sensors_name` |
| Dos sensores en servicio con el mismo nombre | `uq_sensors_name_in_service` |
| Borrar un sensor con lecturas | `fk_readings_sensor_id` |
| Una lectura medida después de la baja | `readings_sensor_in_service` |

Y entran las tres cosas que deben entrar: una lectura normal, una medida antes
de la baja que llega después, y un sensor nuevo con el nombre de uno dado de
baja.

## Lo que se descartó, y por qué

- **Los nombres en castellano** de los requisitos: mezclarían dos idiomas en el
  código, y la tilde de `ubicación` obliga a entrecomillar.
- **La unidad en cada lectura**, como en los requisitos, y **la unidad en cada
  sensor**: por lo del punto 2.
- **`ON DELETE CASCADE`**: borrar un sensor se llevaría todo su histórico, sin
  aviso.
- **`RESTRICT` sin baja lógica**: seguro, pero con el simulador en marcha todos
  los sensores tienen lecturas, y no se podría eliminar ninguno.
- **Una sola columna de hora**: con un registrador que envía tarde, el gráfico
  dibujaría la hora de llegada como si fuera la de la medida.
- **`NUMERIC` para el valor**: es exacto, pero esto es una medida y no dinero, y
  el controlador de PostgreSQL para Node lo devuelve como texto. **`REAL`**:
  ahorra poco y pierde precisión.
- **`INTEGER` para la lectura**: con mil sensores a una lectura por segundo se
  agota en menos de un mes. **`uuid`**: ocupa el doble y no tiene orden.
- **Un `uuid` como clave de `sensor_types`**, como en las otras tablas: con tres
  filas, obligaría a buscar el identificador antes de cada alta, y `sensors` no
  se leería sin un JOIN.

## Lo que cuesta

- Una tabla más que en los requisitos.
- La baja lógica obliga a que cada consulta de sensores en servicio filtre
  `retired_at IS NULL`, y añade un disparador.
- El controlador de PostgreSQL para Node (`pg`) devuelve un `BIGINT` como texto,
  para no perder precisión: el id de una lectura llega a JavaScript como
  `"123"`, no como `123`.

## Dónde vive en el código

- [`db/schema.sql`](../../db/schema.sql) — las tres tablas, sus reglas y el
  disparador
- [`db/README.md`](../../db/README.md) — los nombres, y cómo se carga el esquema

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
   baja. Las medidas antes sí entran: un registrador que estuvo sin conexión
   envía tarde lo que guardó.
5. **Nombre y ubicación, obligatorios y sin quedar en blanco.** El nombre, de
   hasta 100 caracteres y único entre los sensores en servicio —el de uno dado
   de baja queda libre—; la ubicación, de hasta 200.

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
- **Las claves:** `uuid` para el sensor, porque va en la URL y no se puede
  adivinar ni recorrer; `BIGINT` para la lectura, porque son muchas filas que
  solo se añaden; y el propio código (`'temperature'`) para el tipo.

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

Cuando exista `db/schema.sql`, este bloque se sustituye por un enlace a él: dos
copias del mismo DDL acaban siendo distintas.

```sql
-- =====================================================
-- SENSOR_TYPES
-- =====================================================
-- Los tipos de sensor, y la unidad en que mide cada uno.
-- Fuente: los tipos, los requisitos y la decision de medir la calidad del aire
-- como PM2.5 (Carlos, 2026-09-11); las unidades, SenML: RFC 8428 y RFC 8798.
DROP TABLE IF EXISTS sensor_types CASCADE;
CREATE TABLE sensor_types (
    code        VARCHAR(30)  NOT NULL,
    unit        VARCHAR(20)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

    PRIMARY KEY (code),
    CONSTRAINT chk_sensor_types_code CHECK (code ~ '^[a-z][a-z0-9_]*$'),
    CONSTRAINT chk_sensor_types_unit CHECK (btrim(unit) <> '')
);

-- =====================================================
-- SENSORS
-- =====================================================
DROP TABLE IF EXISTS sensors CASCADE;
CREATE TABLE sensors (
    sensor_id    uuid          DEFAULT gen_random_uuid(),
    name         VARCHAR(100)  NOT NULL,
    sensor_type  VARCHAR(30)   NOT NULL,
    location     VARCHAR(200)  NOT NULL,
    retired_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),

    PRIMARY KEY (sensor_id),
    CONSTRAINT fk_sensors_sensor_type FOREIGN KEY (sensor_type)
        REFERENCES sensor_types (code) ON DELETE RESTRICT,
    CONSTRAINT chk_sensors_name CHECK (btrim(name) <> ''),
    CONSTRAINT chk_sensors_location CHECK (btrim(location) <> ''),
    CONSTRAINT chk_sensors_retired_at CHECK (retired_at IS NULL OR retired_at >= created_at)
);

CREATE UNIQUE INDEX uq_sensors_name_in_service ON sensors (name) WHERE retired_at IS NULL;
CREATE INDEX idx_sensors_sensor_type ON sensors (sensor_type);

-- =====================================================
-- READINGS
-- =====================================================
DROP TABLE IF EXISTS readings CASCADE;
CREATE TABLE readings (
    reading_id   BIGINT            GENERATED ALWAYS AS IDENTITY,
    sensor_id    uuid              NOT NULL,
    value        DOUBLE PRECISION  NOT NULL,
    recorded_at  TIMESTAMPTZ       NOT NULL,
    created_at   TIMESTAMPTZ       NOT NULL DEFAULT now(),

    PRIMARY KEY (reading_id),
    CONSTRAINT fk_readings_sensor_id FOREIGN KEY (sensor_id)
        REFERENCES sensors (sensor_id) ON DELETE RESTRICT,
    -- NaN es mayor que cualquier numero en PostgreSQL, asi que esto deja
    -- fuera NaN, Infinity y -Infinity.
    CONSTRAINT chk_readings_value CHECK (value > '-Infinity' AND value < 'Infinity'),
    CONSTRAINT uq_readings_sensor_recorded UNIQUE (sensor_id, recorded_at)
);

-- Rechaza una lectura medida despues de la baja de su sensor. Una medida ANTES
-- si entra: un registrador que estuvo sin conexion envia tarde lo que guardo.
-- FOR SHARE: que nadie de de baja el sensor mientras entra la lectura.
CREATE OR REPLACE FUNCTION trigger_readings_sensor_in_service() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    baja TIMESTAMPTZ;
BEGIN
    SELECT retired_at INTO baja FROM sensors WHERE sensor_id = NEW.sensor_id FOR SHARE;
    IF baja IS NOT NULL AND NEW.recorded_at > baja THEN
        RAISE EXCEPTION 'readings_sensor_in_service: el sensor % esta dado de baja desde %',
            NEW.sensor_id, baja
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER readings_sensor_in_service
    BEFORE INSERT ON readings
    FOR EACH ROW EXECUTE FUNCTION trigger_readings_sensor_in_service();

INSERT INTO sensor_types (code, unit) VALUES
    ('temperature', 'Cel'),
    ('humidity',    '%RH'),
    ('pm25',        'ug/m3');
```

### Probado

Sobre un PostgreSQL 17 de usar y tirar, destruido al acabar: nueve rechazos,
cada uno por la restricción que dice su etiqueta, y ninguna sentencia saltada
por transacción abortada.

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

- `db/schema.sql` — todavía no existe: se escribe tabla a tabla desde este
  diseño

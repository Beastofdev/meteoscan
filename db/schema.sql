-- El esquema de la base de datos de MeteoScan (decision 0006).
--
-- Se carga de cero: tira cada tabla y la vuelve a crear, asi que VACIA lo que
-- hubiera. Con datos simulados es lo que se quiere; antes de guardar datos de
-- verdad hacen falta migraciones (docs/pendiente.md).

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

    -- La clave es el propio codigo ('temperature'), no un numero: un sensor se
    -- lee sin ir a buscar su tipo a esta tabla (decision 0006).
    PRIMARY KEY (code),
    -- En minusculas: la clave distingue mayusculas, y sin esto 'Temperature' y
    -- 'temperature' serian dos tipos distintos.
    CONSTRAINT chk_sensor_types_code CHECK (code ~ '^[a-z][a-z0-9_]*$'),
    CONSTRAINT chk_sensor_types_unit CHECK (btrim(unit) <> '')
);

INSERT INTO sensor_types (code, unit) VALUES
    ('temperature', 'Cel'),
    ('humidity',    '%RH'),
    ('pm25',        'ug/m3');

-- =====================================================
-- SENSORS
-- =====================================================
-- Los sensores instalados. Un sensor no se borra: se da de baja rellenando
-- retired_at, y sus lecturas se quedan (decision 0006).
DROP TABLE IF EXISTS sensors CASCADE;
CREATE TABLE sensors (
    sensor_id    uuid          DEFAULT gen_random_uuid(),
    name         VARCHAR(100)  NOT NULL,
    sensor_type  VARCHAR(30)   NOT NULL,
    location     VARCHAR(200)  NOT NULL,
    -- Vacio: en servicio. Con fecha: dado de baja desde entonces.
    retired_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),

    -- Un uuid y no un numero: va en la URL (DELETE /sensores/:id), y un id
    -- mal tecleado no cae en otro sensor que exista.
    PRIMARY KEY (sensor_id),
    -- RESTRICT: no se puede borrar un tipo mientras lo use algun sensor.
    CONSTRAINT fk_sensors_sensor_type FOREIGN KEY (sensor_type)
        REFERENCES sensor_types (code) ON DELETE RESTRICT,
    CONSTRAINT chk_sensors_name CHECK (btrim(name) <> ''),
    CONSTRAINT chk_sensors_location CHECK (btrim(location) <> ''),
    CONSTRAINT chk_sensors_retired_at CHECK (retired_at IS NULL OR retired_at >= created_at)
);

-- El nombre es unico solo entre los sensores en servicio, sin distinguir
-- mayusculas ni espacios en los extremos: 'Sensor tejado' y 'sensor tejado '
-- son el mismo. El de uno dado de baja queda libre para otro.
CREATE UNIQUE INDEX uq_sensors_name_in_service ON sensors (lower(btrim(name))) WHERE retired_at IS NULL;
-- PostgreSQL no indexa por su cuenta la columna de una clave ajena.
CREATE INDEX idx_sensors_sensor_type ON sensors (sensor_type);

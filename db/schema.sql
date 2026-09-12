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

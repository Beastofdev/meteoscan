-- Las pruebas del esquema. Las pasa db/check_all.sh sobre un PostgreSQL de
-- usar y tirar, recien creado y con db/schema.sql ya cargado (decision 0004).
--
-- Cada prueba es una llamada: o la sentencia tiene que entrar (expect_ok), o
-- tiene que saltar con un codigo y una regla concretos (expect_rejection). El
-- codigo y la regla se leen de los campos del error, no de su texto: una frase
-- puede cambiar de una version a otra, el nombre de una regla no.
--
-- Cada sentencia se ejecuta dentro de un bloque con EXCEPTION, que PostgreSQL
-- trata como un SAVEPOINT: si falla, se deshace lo que hizo y las demas
-- pruebas siguen igual. Ninguna puede arrastrar a las de detras.
--
-- Las fechas van escritas a proposito: un sensor dado de alta hace un dia y de
-- baja hace una hora da el mismo resultado corra el guion rapido o despacio.

CREATE TEMP TABLE results (
    n       integer  GENERATED ALWAYS AS IDENTITY,
    label   text     NOT NULL,
    ok      boolean  NOT NULL,
    detail  text
);

-- La sentencia tiene que entrar, y lo que hace se queda: las pruebas de
-- detras cuentan con ello.
CREATE FUNCTION pg_temp.expect_ok(test_label text, test_sql text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    got_state   text;
    got_rule    text;
    got_column  text;
BEGIN
    EXECUTE test_sql;
    INSERT INTO results (label, ok) VALUES (test_label, true);
EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS got_state  = RETURNED_SQLSTATE,
                            got_rule   = CONSTRAINT_NAME,
                            got_column = COLUMN_NAME;
    INSERT INTO results (label, ok, detail) VALUES (test_label, false,
        format('tenia que entrar, y salto %s %s', got_state,
               coalesce(nullif(got_rule, ''), nullif(got_column, ''), '-')));
END;
$$;

-- La sentencia tiene que saltar con expected_state y expected_rule. La regla
-- es el nombre de la restriccion; si el error no trae ninguno (NOT NULL), la
-- columna; y si tampoco trae columna, NULL.
CREATE FUNCTION pg_temp.expect_rejection(test_label text, test_sql text,
                                         expected_state text, expected_rule text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    got_state   text;
    got_rule    text;
    got_column  text;
BEGIN
    BEGIN
        EXECUTE test_sql;
        -- Si entra, se deshace igual: una regla rota no deja filas que
        -- confundan a las pruebas de detras.
        RAISE EXCEPTION USING ERRCODE = 'MS001';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS got_state  = RETURNED_SQLSTATE,
                                got_rule   = CONSTRAINT_NAME,
                                got_column = COLUMN_NAME;
    END;
    IF got_state = 'MS001' THEN
        INSERT INTO results (label, ok, detail) VALUES (test_label, false,
            format('entro, y tenia que saltar con %s %s',
                   expected_state, coalesce(expected_rule, '-')));
        RETURN;
    END IF;
    got_rule := coalesce(nullif(got_rule, ''), nullif(got_column, ''));
    INSERT INTO results (label, ok, detail) VALUES (test_label,
        got_state = expected_state AND got_rule IS NOT DISTINCT FROM expected_rule,
        format('esperaba %s %s, salto %s %s',
               expected_state, coalesce(expected_rule, '-'),
               got_state, coalesce(got_rule, '-')));
END;
$$;

-- Las pruebas no imprimen nada; al final se imprime la lista.
\o /dev/null

-- =====================================================
-- SENSOR_TYPES
-- =====================================================
SELECT pg_temp.expect_rejection('sensor_types: codigo en mayusculas',
    $$INSERT INTO sensor_types (code, unit) VALUES ('Temperature', 'Cel')$$,
    '23514', 'chk_sensor_types_code');
SELECT pg_temp.expect_rejection('sensor_types: codigo repetido',
    $$INSERT INTO sensor_types (code, unit) VALUES ('pm25', 'ug/m3')$$,
    '23505', 'sensor_types_pkey');
SELECT pg_temp.expect_rejection('sensor_types: sin unidad',
    $$INSERT INTO sensor_types (code) VALUES ('noise')$$,
    '23502', 'unit');
SELECT pg_temp.expect_rejection('sensor_types: unidad en blanco',
    $$INSERT INTO sensor_types (code, unit) VALUES ('noise', '   ')$$,
    '23514', 'chk_sensor_types_unit');
SELECT pg_temp.expect_rejection('sensor_types: codigo de 31 caracteres',
    $$INSERT INTO sensor_types (code, unit) VALUES (repeat('a', 31), 'x')$$,
    '22001', NULL);
SELECT pg_temp.expect_ok('sensor_types: codigo con cifras y guion bajo',
    $$INSERT INTO sensor_types (code, unit) VALUES ('wind_speed_2', 'm/s')$$);

-- =====================================================
-- SENSORS
-- =====================================================
SELECT pg_temp.expect_ok('sensors: un sensor normal',
    $$INSERT INTO sensors (name, sensor_type, location)
      VALUES ('Sensor nave 2', 'temperature', 'Nave 2, pared norte')$$);
SELECT pg_temp.expect_rejection('sensors: tipo que no existe',
    $$INSERT INTO sensors (name, sensor_type, location) VALUES ('Sensor B', 'wind', 'Nave 1')$$,
    '23503', 'fk_sensors_sensor_type');
SELECT pg_temp.expect_rejection('sensors: sin tipo',
    $$INSERT INTO sensors (name, location) VALUES ('Sensor B', 'Nave 1')$$,
    '23502', 'sensor_type');
SELECT pg_temp.expect_rejection('sensors: nombre en blanco',
    $$INSERT INTO sensors (name, sensor_type, location) VALUES ('   ', 'temperature', 'Nave 1')$$,
    '23514', 'chk_sensors_name');
SELECT pg_temp.expect_rejection('sensors: ubicacion en blanco',
    $$INSERT INTO sensors (name, sensor_type, location) VALUES ('Sensor B', 'temperature', '')$$,
    '23514', 'chk_sensors_location');
SELECT pg_temp.expect_rejection('sensors: nombre de 101 caracteres',
    $$INSERT INTO sensors (name, sensor_type, location) VALUES (repeat('a', 101), 'temperature', 'Nave 1')$$,
    '22001', NULL);
SELECT pg_temp.expect_rejection('sensors: nombre repetido en servicio',
    $$INSERT INTO sensors (name, sensor_type, location) VALUES ('Sensor nave 2', 'temperature', 'Nave 1')$$,
    '23505', 'uq_sensors_name_in_service');
SELECT pg_temp.expect_rejection('sensors: el mismo nombre, con otras mayusculas y un espacio',
    $$INSERT INTO sensors (name, sensor_type, location) VALUES ('sensor NAVE 2 ', 'temperature', 'Nave 1')$$,
    '23505', 'uq_sensors_name_in_service');
SELECT pg_temp.expect_rejection('sensors: baja anterior al alta',
    $$UPDATE sensors SET retired_at = created_at - interval '1 day' WHERE name = 'Sensor nave 2'$$,
    '23514', 'chk_sensors_retired_at');
SELECT pg_temp.expect_rejection('sensors: borrar un tipo en uso',
    $$DELETE FROM sensor_types WHERE code = 'temperature'$$,
    '23001', 'fk_sensors_sensor_type');
-- El unico sensor dado de baja: alta hace un dia, baja hace una hora. Lo usan
-- las pruebas del disparador.
SELECT pg_temp.expect_ok('sensors: uno dado de baja',
    $$INSERT INTO sensors (name, sensor_type, location, created_at, retired_at)
      VALUES ('Sensor tejado', 'pm25', 'Tejado, esquina sur',
              now() - interval '1 day', now() - interval '1 hour')$$);
SELECT pg_temp.expect_ok('sensors: el nombre de uno dado de baja queda libre',
    $$INSERT INTO sensors (name, sensor_type, location) VALUES ('sensor tejado', 'pm25', 'Tejado, esquina norte')$$);

-- =====================================================
-- READINGS
-- =====================================================
SELECT pg_temp.expect_ok('readings: una lectura normal',
    $$INSERT INTO readings (sensor_id, value, recorded_at)
      SELECT sensor_id, 23.4, '2026-01-01 10:00:00+00' FROM sensors WHERE name = 'Sensor nave 2'$$);
SELECT pg_temp.expect_ok('readings: el mismo sensor, otro instante',
    $$INSERT INTO readings (sensor_id, value, recorded_at)
      SELECT sensor_id, 23.6, '2026-01-01 10:00:05+00' FROM sensors WHERE name = 'Sensor nave 2'$$);
SELECT pg_temp.expect_ok('readings: otro sensor, el mismo instante',
    $$INSERT INTO readings (sensor_id, value, recorded_at)
      SELECT sensor_id, 12.0, '2026-01-01 10:00:00+00' FROM sensors
       WHERE name = 'sensor tejado' AND retired_at IS NULL$$);
SELECT pg_temp.expect_ok('readings: una tardia, medida dos horas antes de llegar',
    $$INSERT INTO readings (sensor_id, value, recorded_at)
      SELECT sensor_id, 22.9, now() - interval '2 hours' FROM sensors WHERE name = 'Sensor nave 2'$$);
SELECT pg_temp.expect_rejection('readings: NaN',
    $$INSERT INTO readings (sensor_id, value, recorded_at)
      SELECT sensor_id, 'NaN', '2026-01-01 10:00:10+00' FROM sensors WHERE name = 'Sensor nave 2'$$,
    '23514', 'chk_readings_value');
SELECT pg_temp.expect_rejection('readings: Infinity',
    $$INSERT INTO readings (sensor_id, value, recorded_at)
      SELECT sensor_id, 'Infinity', '2026-01-01 10:00:10+00' FROM sensors WHERE name = 'Sensor nave 2'$$,
    '23514', 'chk_readings_value');
SELECT pg_temp.expect_rejection('readings: -Infinity',
    $$INSERT INTO readings (sensor_id, value, recorded_at)
      SELECT sensor_id, '-Infinity', '2026-01-01 10:00:10+00' FROM sensors WHERE name = 'Sensor nave 2'$$,
    '23514', 'chk_readings_value');
SELECT pg_temp.expect_rejection('readings: la misma lectura dos veces',
    $$INSERT INTO readings (sensor_id, value, recorded_at)
      SELECT sensor_id, 23.4, '2026-01-01 10:00:00+00' FROM sensors WHERE name = 'Sensor nave 2'$$,
    '23505', 'uq_readings_sensor_recorded');
SELECT pg_temp.expect_rejection('readings: un sensor que no existe',
    $$INSERT INTO readings (sensor_id, value, recorded_at)
      VALUES (gen_random_uuid(), 20.0, '2026-01-01 10:00:10+00')$$,
    '23503', 'fk_readings_sensor_id');
SELECT pg_temp.expect_rejection('readings: sin recorded_at',
    $$INSERT INTO readings (sensor_id, value)
      SELECT sensor_id, 20.0 FROM sensors WHERE name = 'Sensor nave 2'$$,
    '23502', 'recorded_at');
SELECT pg_temp.expect_rejection('readings: reading_id puesto a mano',
    $$INSERT INTO readings (reading_id, sensor_id, value, recorded_at)
      SELECT 99, sensor_id, 20.0, '2026-01-01 10:00:10+00' FROM sensors WHERE name = 'Sensor nave 2'$$,
    '428C9', NULL);
SELECT pg_temp.expect_rejection('readings: borrar un sensor con lecturas',
    $$DELETE FROM sensors WHERE name = 'Sensor nave 2'$$,
    '23001', 'fk_readings_sensor_id');

-- =====================================================
-- READINGS_SENSOR_IN_SERVICE, el disparador de la baja
-- =====================================================
-- El sensor dado de baja es el unico con retired_at: baja hace una hora.
SELECT pg_temp.expect_rejection('baja: una lectura medida despues de la baja',
    $$INSERT INTO readings (sensor_id, value, recorded_at)
      SELECT sensor_id, 13.0, now() - interval '30 minutes' FROM sensors WHERE retired_at IS NOT NULL$$,
    '23514', 'readings_sensor_in_service');
SELECT pg_temp.expect_ok('baja: una medida antes de la baja, que llega tarde',
    $$INSERT INTO readings (sensor_id, value, recorded_at)
      SELECT sensor_id, 12.5, now() - interval '2 hours' FROM sensors WHERE retired_at IS NOT NULL$$);
-- Para mover una lectura al sensor dado de baja, tiene que estar medida
-- DESPUES de la baja; si no, entraria por eso y la prueba no probaria nada.
SELECT pg_temp.expect_ok('baja: una lectura reciente de un sensor en servicio',
    $$INSERT INTO readings (sensor_id, value, recorded_at)
      SELECT sensor_id, 24.0, now() - interval '10 minutes' FROM sensors WHERE name = 'Sensor nave 2'$$);
SELECT pg_temp.expect_rejection('baja: pasar esa lectura al sensor dado de baja',
    $$UPDATE readings SET sensor_id = (SELECT sensor_id FROM sensors WHERE retired_at IS NOT NULL)
       WHERE value = 24.0$$,
    '23514', 'readings_sensor_in_service');
SELECT pg_temp.expect_rejection('baja: llevar la hora de una suya a despues de la baja',
    $$UPDATE readings SET recorded_at = now() - interval '30 minutes' WHERE value = 12.5$$,
    '23514', 'readings_sensor_in_service');
SELECT pg_temp.expect_ok('baja: cambiar solo el valor de una suya',
    $$UPDATE readings SET value = 12.6 WHERE value = 12.5$$);

-- =====================================================
-- El resultado
-- =====================================================
\o
SELECT CASE WHEN ok THEN 'ok     ' || label
            ELSE 'FALLO  ' || label || ' -- ' || detail END
  FROM results ORDER BY n;
SELECT format('%s pruebas, %s bien', count(*), count(*) FILTER (WHERE ok)) FROM results;

-- Falla si alguna prueba fallo, y tambien si no se corrio ninguna: con cero,
-- "todo bien" seria verdad y no diria nada.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM results) THEN
        RAISE EXCEPTION 'no se ha corrido ninguna prueba';
    END IF;
    IF EXISTS (SELECT 1 FROM results WHERE NOT ok) THEN
        RAISE EXCEPTION 'hay pruebas del esquema que fallan';
    END IF;
END;
$$;

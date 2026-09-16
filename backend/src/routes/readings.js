// Las rutas de /lecturas.
import express from 'express';
import { pool } from '../db.js';
import { HttpError } from '../errors.js';
import { UUID_PATTERN, checkBody } from '../validation.js';

const router = express.Router();

// POST /lecturas: guarda una lectura, y la devuelve tal como quedo.
router.post('/', async (req, res) => {
  const reading = parseNewReading(req.body);
  // Lo que solo sabe la base (que el sensor exista, que no estuviera dado de
  // baja al medir, que es el disparador, y que la lectura no este repetida) lo
  // rechaza ella, y lo traduce errorHandler (decision 0009).
  const result = await pool.query(`
    INSERT INTO readings (sensor_id, value, recorded_at)
    VALUES ($1, $2, $3)
    RETURNING reading_id, sensor_id, value, recorded_at, created_at
  `, [reading.sensor_id, reading.value, reading.recorded_at]);
  res.status(201).json(result.rows[0]);
});

// Comprueba y limpia el cuerpo de una lectura antes de tocar la base, y lanza
// el primer error que encuentra. La base vuelve a comprobarlo todo debajo.
function parseNewReading(body) {
  checkBody(body, ['sensor_id', 'value', 'recorded_at']);
  return {
    sensor_id: requiredSensorId(body.sensor_id),
    value: requiredValue(body.value),
    recorded_at: requiredTimestamp(body.recorded_at),
  };
}

// Un id que no es un uuid no lleva a ningun sensor, como en
// DELETE /sensores/:id.
function requiredSensorId(value) {
  if (value === undefined || value === null) {
    throw new HttpError(400, 'invalid_field', 'Falta el sensor.', 'sensor_id');
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, 'invalid_field', 'El sensor tiene que ser un texto.', 'sensor_id');
  }
  if (!UUID_PATTERN.test(value)) {
    throw new HttpError(400, 'unknown_sensor', 'No existe ese sensor.', 'sensor_id');
  }
  return value;
}

// Un numero JSON finito. JSON no admite NaN, pero 1e400 si es JSON valido, y
// JavaScript lo convierte en Infinity. Un texto como "20.5" no se convierte.
function requiredValue(value) {
  if (value === undefined || value === null) {
    throw new HttpError(400, 'invalid_field', 'Falta el valor.', 'value');
  }
  if (typeof value !== 'number') {
    throw new HttpError(400, 'invalid_field', 'El valor tiene que ser un número.', 'value');
  }
  if (!Number.isFinite(value)) {
    throw new HttpError(400, 'invalid_field', 'El valor está fuera de rango.', 'value');
  }
  return value;
}

// Una fecha y hora como las de la RFC 3339, con la zona obligatoria y como mucho
// milisegundos: 2026-09-15T13:06:07.922+02:00. Sin zona, la hora no dice
// cuando paso: PostgreSQL la tomaria como UTC, y JavaScript, como hora local.
// Con milisegundos, lo que se guarda es lo que JavaScript devuelve.
const TIMESTAMP_PATTERN =
  /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})T(?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2})(\.\d{1,3})?(Z|[+-](?<offsetHour>\d{2}):(?<offsetMinute>\d{2}))$/i;

function requiredTimestamp(value) {
  if (value === undefined || value === null) {
    throw new HttpError(400, 'invalid_field', 'Falta la hora de la lectura.', 'recorded_at');
  }
  const match = typeof value === 'string' ? TIMESTAMP_PATTERN.exec(value) : null;
  if (!match) {
    throw new HttpError(400, 'invalid_field',
      'La hora tiene que ir con su zona, como 2026-09-15T13:06:07+02:00, y como mucho con milisegundos.',
      'recorded_at');
  }
  if (!isRealTimestamp(match.groups)) {
    throw new HttpError(400, 'invalid_field', 'Esa fecha u hora no existe.', 'recorded_at');
  }
  // El mismo texto va a PostgreSQL, que lo lee con su zona.
  return value;
}

// Que la fecha exista de verdad, porque Date.parse se la inventa: el 30 de
// febrero lo convierte en el 2 de marzo. Sin segundo 60, que PostgreSQL pasaria
// al minuto siguiente, y desde 0001, porque el 0000 lo rechaza. Las zonas, hasta
// 14 horas: no hay ninguna mayor, y PostgreSQL rechaza a partir de 16.
function isRealTimestamp({ year, month, day, hour, minute, second, offsetHour = '0', offsetMinute = '0' }) {
  const [y, m, d] = [year, month, day].map(Number);
  return y >= 1 && m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m)
    && Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59
    && Number(offsetHour) <= 14 && Number(offsetMinute) <= 59;
}

// Bisiesto: divisible por 4, salvo los siglos que no lo son por 400 (el 2000
// lo fue; el 1900, no).
function daysInMonth(year, month) {
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

export default router;

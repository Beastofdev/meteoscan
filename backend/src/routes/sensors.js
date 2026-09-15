// Las rutas de /sensores. Las rutas siguen la especificacion (en castellano);
// el codigo y los campos del JSON, en ingles, como las columnas.
import express from 'express';
import { pool } from '../db.js';
import { HttpError } from '../errors.js';

const router = express.Router();

// GET /sensores: los sensores en servicio, por nombre, con la unidad de su
// tipo. Los dados de baja no salen: para quien usa la API, estan eliminados.
router.get('/', async (req, res) => {
  const result = await pool.query(`
    SELECT s.sensor_id, s.name, s.sensor_type, t.unit, s.location, s.created_at
      FROM sensors s
      JOIN sensor_types t ON t.code = s.sensor_type
     WHERE s.retired_at IS NULL
     ORDER BY s.name
  `);
  res.json(result.rows);
});

// Los campos de un alta: su nombre en los mensajes, y su longitud maxima, la
// de su columna en db/schema.sql.
const NEW_SENSOR_FIELDS = {
  name: { label: 'El nombre', maxLength: 100 },
  sensor_type: { label: 'El tipo', maxLength: 30 },
  location: { label: 'La ubicación', maxLength: 200 },
};

// POST /sensores: da de alta un sensor, y lo devuelve con la misma forma que
// GET /sensores.
router.post('/', async (req, res) => {
  const sensor = parseNewSensor(req.body);
  // Una sola orden, y una sola transaccion: el alta, y la unidad de su tipo
  // para la respuesta. El nombre repetido y el tipo que no existe los rechaza
  // la base, y los traduce errorHandler: comprobarlos antes con un SELECT no
  // pararia dos altas iguales a la vez.
  const result = await pool.query(`
    WITH inserted AS (
      INSERT INTO sensors (name, sensor_type, location)
      VALUES ($1, $2, $3)
      RETURNING sensor_id, name, sensor_type, location, created_at
    )
    SELECT i.sensor_id, i.name, i.sensor_type, t.unit, i.location, i.created_at
      FROM inserted i
      JOIN sensor_types t ON t.code = i.sensor_type
  `, [sensor.name, sensor.sensor_type, sensor.location]);
  res.status(201).json(result.rows[0]);
});

// Comprueba y limpia el cuerpo de un alta antes de tocar la base, y lanza el
// primer error que encuentra. La base vuelve a comprobarlo todo debajo (0002).
function parseNewSensor(body) {
  // Sin Content-Type JSON, express.json() deja el cuerpo en undefined; y una
  // lista tambien es JSON, pero no un sensor.
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HttpError(400, 'invalid_body', 'El cuerpo tiene que ser un objeto JSON.');
  }
  // Solo entran los campos de un alta: un retired_at, por ejemplo, no se cuela.
  for (const field of Object.keys(body)) {
    if (!Object.hasOwn(NEW_SENSOR_FIELDS, field)) {
      throw new HttpError(400, 'invalid_body', `Un alta no lleva el campo ${field}.`, field);
    }
  }
  const sensor = {};
  for (const [field, rules] of Object.entries(NEW_SENSOR_FIELDS)) {
    sensor[field] = requiredText(body[field], field, rules);
  }
  return sensor;
}

// Un texto obligatorio, sin los espacios de los extremos, y de hasta maxLength
// caracteres contados como PostgreSQL: con [...text], un emoji cuenta uno; con
// text.length, dos.
function requiredText(value, field, { label, maxLength }) {
  if (value === undefined || value === null) {
    throw new HttpError(400, 'invalid_field', `Falta ${label.toLowerCase()}.`, field);
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, 'invalid_field', `${label} tiene que ser un texto.`, field);
  }
  const text = value.trim();
  if (text === '') {
    throw new HttpError(400, 'invalid_field', `${label} está en blanco.`, field);
  }
  if ([...text].length > maxLength) {
    throw new HttpError(400, 'invalid_field', `${label} no puede pasar de ${maxLength} caracteres.`, field);
  }
  return text;
}

export default router;

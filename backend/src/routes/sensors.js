// Las rutas de /sensores. Las rutas siguen la especificacion (en castellano);
// el codigo y los campos del JSON, en ingles, como las columnas.
import express from 'express';
import { pool } from '../db.js';
import { HttpError } from '../errors.js';
import { UUID_PATTERN, checkBody } from '../validation.js';

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
  checkBody(body, Object.keys(NEW_SENSOR_FIELDS));
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

// DELETE /sensores/:id: da de baja un sensor. No lo borra: le pone fecha de
// baja, y sus lecturas se quedan (decision 0006).
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  // Un id que no es un uuid no lleva a ningun sensor. Se mira aqui porque
  // PostgreSQL lo rechazaria con un 22P02, un error que no dice de que campo
  // es, y que tambien sale con numeros o fechas mal escritos.
  if (!UUID_PATTERN.test(id)) throw sensorNotFound();
  // Con retired_at IS NULL, la fecha de baja no se mueve. Con dos bajas a la
  // vez, PostgreSQL hace esperar a la segunda y vuelve a mirar el WHERE: ya no
  // hay fila que cambiar, y sale el 404.
  const result = await pool.query(`
    UPDATE sensors SET retired_at = now()
     WHERE sensor_id = $1 AND retired_at IS NULL
  `, [id]);
  if (result.rowCount === 0) throw sensorNotFound();
  res.status(204).end();
});

// Que no exista, que este dado de baja o que el id no sea un uuid: para quien
// usa la API, las tres cosas son lo mismo.
function sensorNotFound() {
  return new HttpError(404, 'sensor_not_found', 'No hay ningún sensor con ese id.');
}

export default router;

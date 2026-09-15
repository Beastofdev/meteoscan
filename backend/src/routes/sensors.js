// Las rutas de /sensores. Las rutas siguen la especificacion (en castellano);
// el codigo y los campos del JSON, en ingles, como las columnas.
import express from 'express';
import { pool } from '../db.js';

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

export default router;

// La API de MeteoScan.
import express from 'express';
import { pool } from './db.js';
import { errorHandler, notFound } from './errors.js';
import sensorsRouter from './routes/sensors.js';

// El puerto de la API (CONTRIBUTING).
const PORT = 8005;

const app = express();

// Que las respuestas no anuncien que la API es Express (decision 0009).
app.disable('x-powered-by');

// Lee el cuerpo de las peticiones que dicen traer JSON (Content-Type) y lo deja
// en req.body. Sus errores, como un JSON mal escrito, los traduce errorHandler.
app.use(express.json());

// Contesta si la API esta viva y llega a la base. No es de los requisitos:
// sirve para vigilar el propio servicio.
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'ok' });
  } catch (error) {
    // Un fallo que se espera y se contesta aqui mismo. El detalle, solo en el
    // registro del servidor: los errores del motor no son para el usuario.
    console.error('La base no contesta:', error.message);
    // La misma forma que con 200, no la de los errores: es la respuesta a lo
    // que se pregunta, no un fallo de la peticion (decision 0009).
    res.status(503).json({ status: 'error', database: 'error' });
  }
});

// Cada recurso, con sus rutas en su fichero de routes/.
app.use('/sensores', sensorsRouter);

// Detras de todas las rutas, y en este orden: lo que nadie ha contestado, y
// despues los errores (decision 0009).
app.use(notFound);
app.use(errorHandler);

// Solo desde este ordenador, como la base de datos (decision 0007).
app.listen(PORT, '127.0.0.1', (error) => {
  // Si no puede escuchar (el puerto ocupado, por ejemplo), Express 5 pasa aqui
  // el error. Sin esta linea diria que escucha sin estar escuchando.
  if (error) throw error;
  console.log(`API escuchando en http://127.0.0.1:${PORT}`);
});

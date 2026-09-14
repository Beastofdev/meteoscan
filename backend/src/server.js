// La API de MeteoScan.
import express from 'express';

// El puerto de la API (CONTRIBUTING).
const PORT = 8005;

const app = express();

// Contesta si la API esta viva. No es de los requisitos: sirve para vigilar
// el propio servicio.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Solo desde este ordenador, como la base de datos (decision 0007).
app.listen(PORT, '127.0.0.1', (error) => {
  // Si no puede escuchar (el puerto ocupado, por ejemplo), Express 5 pasa aqui
  // el error. Sin esta linea diria que escucha sin estar escuchando.
  if (error) throw error;
  console.log(`API escuchando en http://127.0.0.1:${PORT}`);
});

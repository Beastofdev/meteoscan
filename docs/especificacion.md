# Los requisitos

Los requisitos de partida del proyecto, fijados el 11 de septiembre de 2026.
**Son la fuente de lo que entra:** lo que no está aquí se propone antes de
hacerlo, y no se añade porque un SCADA de verdad lo tenga.

La estructura de datos de abajo es **el punto de partida**, no el diseño final.
Lo que el diseño cambió está en la
[0006](decisiones/0006-el-diseno-de-la-base-de-datos.md), con el motivo.

---

PROYECTO: "Panel de Monitorización de Sensores" (mini SCADA web)

Simula una red de sensores (temperatura, humedad, calidad del aire) que envían
lecturas periódicas, visualizadas y gestionadas desde un panel web.

### STACK

- Backend: Node.js + Express
- Base de datos: PostgreSQL
- Frontend: React (con Vite)
- Control de versiones: Git/GitHub

### ESTRUCTURA DE DATOS

- Tabla `sensores`: id, nombre, tipo, ubicación
- Tabla `lecturas`: id, sensor_id (FK a sensores), valor, unidad, timestamp

### BACKEND — Endpoints REST necesarios

- GET /sensores — listar todos los sensores
- POST /sensores — crear un sensor nuevo
- DELETE /sensores/:id — eliminar un sensor
- GET /sensores/:id/lecturas — histórico de lecturas de un sensor
- POST /lecturas — insertar una nueva lectura
- Un script que simule sensores enviando datos automáticamente cada X segundos
  (setInterval), generando lecturas aleatorias e insertándolas en la BD

### FRONTEND — Vistas necesarias

- Lista de sensores (tarjetas o tabla)
- Vista de detalle de un sensor con gráfico de evolución de sus lecturas (usar
  recharts o chart.js)
- Formulario para dar de alta un sensor nuevo
- Indicador visual de alerta si un valor supera un umbral (ej. temperatura >
  35°C en rojo)

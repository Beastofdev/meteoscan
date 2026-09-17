import { Link, Route, Routes } from 'react-router'
import SensorDetailPage from './pages/SensorDetailPage.jsx'
import SensorsPage from './pages/SensorsPage.jsx'
import './App.css'

// Cada pantalla, con su direccion. El detalle se llama como en la API,
// /sensores/:sensorId, y no chocan: lo que el panel pide a la API va por /api
// (0016).
export default function App() {
  return (
    <main className="app">
      <h1>MeteoScan</h1>
      <Routes>
        <Route path="/" element={<SensorsPage />} />
        <Route path="/sensores/:sensorId" element={<SensorDetailPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  )
}

// Una direccion que no es de ninguna pantalla.
function NotFound() {
  return (
    <>
      <p className="status status-error">Esta página no existe.</p>
      <Link className="back-link" to="/">
        ← Volver a la lista
      </Link>
    </>
  )
}

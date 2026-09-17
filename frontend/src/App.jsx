import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router'
import SensorsPage from './pages/SensorsPage.jsx'
import './App.css'

// El detalle es la unica pantalla que usa la libreria del grafico, y esa
// libreria pesa mas que todo lo demas junto. Con lazy, su codigo se pide al
// abrir el detalle: quien solo mira la lista no lo descarga (0016).
const SensorDetailPage = lazy(() => import('./pages/SensorDetailPage.jsx'))

// Cada pantalla, con su direccion. El detalle se llama como en la API,
// /sensores/:sensorId, y no chocan: lo que el panel pide a la API va por /api
// (0016).
export default function App() {
  return (
    <main className="app">
      <h1>MeteoScan</h1>
      {/* Lo que se ve mientras llega el codigo de una pantalla que se carga
          aparte. En una red rapida no se llega a ver. */}
      <Suspense fallback={<p className="status">Cargando…</p>}>
        <Routes>
          <Route path="/" element={<SensorsPage />} />
          <Route path="/sensores/:sensorId" element={<SensorDetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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

import { useEffect, useState } from 'react'
import './App.css'

// La API contesta en /sensores gracias al proxy del servidor de desarrollo
// (vite.config.js): para el navegador, el panel y la API son el mismo sitio.
const SENSORS_PATH = '/sensores'

export default function App() {
  // null mientras no hay respuesta; un array en cuanto la API contesta.
  const [sensors, setSensors] = useState(null)
  const [error, setError] = useState(null)

  // Se consulta una sola vez, al aparecer el panel: la lista vacia de
  // dependencias es lo que dice "no lo repitas".
  useEffect(() => {
    fetch(SENSORS_PATH)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`la API respondió ${response.status}`)
        }
        return response.json()
      })
      .then(setSensors)
      .catch((failure) => setError(failure.message))
  }, [])

  return (
    <main>
      <h1>MeteoScan</h1>
      <p className={error ? 'status status-error' : 'status'}>
        {summary(sensors, error)}
      </p>
    </main>
  )
}

// Los tres momentos de cualquier pantalla que depende de un servidor: no ha
// contestado, ha fallado, o ha contestado.
function summary(sensors, error) {
  if (error) return `No se pudo consultar la API: ${error}.`
  if (sensors === null) return 'Consultando la API…'
  if (sensors.length === 0) return 'La API responde. No hay ningún sensor en servicio.'
  if (sensors.length === 1) return 'La API responde. Hay 1 sensor en servicio.'
  return `La API responde. Hay ${sensors.length} sensores en servicio.`
}

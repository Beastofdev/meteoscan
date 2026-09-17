import { useEffect, useState } from 'react'
import { getSensors } from './api.js'
import SensorForm from './components/SensorForm.jsx'
import SensorList from './components/SensorList.jsx'
import './App.css'

export default function App() {
  // null mientras no hay respuesta; un array en cuanto la API contesta.
  const [sensors, setSensors] = useState(null)
  const [error, setError] = useState(null)
  // Cada vez que sube, la lista se vuelve a pedir: es lo que hace el alta.
  const [listVersion, setListVersion] = useState(0)

  useEffect(() => {
    // Si el componente desaparece antes de que llegue la respuesta, se
    // descarta. En desarrollo pasa siempre una vez: React monta, desmonta y
    // vuelve a montar cada componente para destapar efectos sin limpiar.
    let ignore = false
    getSensors()
      .then((data) => {
        if (ignore) return
        setSensors(data)
        setError(null)
      })
      .catch((failure) => {
        if (!ignore) setError(failure.message)
      })
    return () => {
      ignore = true
    }
  }, [listVersion])

  return (
    <main className="app">
      <h1>MeteoScan</h1>
      <SensorForm onCreated={() => setListVersion((version) => version + 1)} />
      <Content sensors={sensors} error={error} />
    </main>
  )
}

// Los tres momentos de cualquier pantalla que depende de un servidor —no ha
// contestado, ha fallado, o ha contestado—, y un cuarto: ha contestado que no
// hay nada.
function Content({ sensors, error }) {
  if (error) return <p className="status status-error">{error}</p>
  if (sensors === null) return <p className="status">Consultando la API…</p>
  if (sensors.length === 0) {
    return <p className="status">No hay ningún sensor en servicio.</p>
  }
  return <SensorList sensors={sensors} />
}

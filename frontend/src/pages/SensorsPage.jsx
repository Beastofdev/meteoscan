import { useEffect, useState } from 'react'
import { getSensors } from '../api.js'
import SensorForm from '../components/SensorForm.jsx'
import SensorList from '../components/SensorList.jsx'

// La pantalla principal: el alta y la lista de sensores en servicio.
export default function SensorsPage() {
  // null mientras no hay respuesta; un array en cuanto la API contesta.
  const [sensors, setSensors] = useState(null)
  const [error, setError] = useState(null)
  // Cada vez que sube, la lista se vuelve a pedir: tras un alta o una baja.
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

  const refreshList = () => setListVersion((version) => version + 1)

  return (
    <>
      <SensorForm onCreated={refreshList} />
      <Content sensors={sensors} error={error} onRetired={refreshList} />
    </>
  )
}

// Los tres momentos de cualquier pantalla que depende de un servidor —no ha
// contestado, ha fallado, o ha contestado—, y un cuarto: ha contestado que no
// hay nada.
function Content({ sensors, error, onRetired }) {
  if (error) return <p className="status status-error">{error}</p>
  if (sensors === null) return <p className="status">Consultando la API…</p>
  if (sensors.length === 0) {
    return <p className="status">No hay ningún sensor en servicio.</p>
  }
  return <SensorList sensors={sensors} onRetired={onRetired} />
}

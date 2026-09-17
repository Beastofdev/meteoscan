import { useEffect, useState } from 'react'
import { getSensors } from '../api.js'
import SensorForm from '../components/SensorForm.jsx'
import SensorList from '../components/SensorList.jsx'

// Cada cuanto se vuelven a pedir los datos. El simulador manda una lectura de
// cada sensor cada cinco segundos (0010): preguntar mas a menudo no traeria
// nada nuevo.
const REFRESH_MS = 5000

// La pantalla principal: el alta y la lista de sensores en servicio, que se
// refresca sola para que la alerta avise sin tener que recargar (0019).
export default function SensorsPage() {
  // null mientras no hay respuesta; un array en cuanto la API contesta.
  const [sensors, setSensors] = useState(null)
  const [error, setError] = useState(null)
  // Cada vez que sube, se vuelve a pedir en el acto: tras un alta o una baja.
  const [listVersion, setListVersion] = useState(0)

  useEffect(() => {
    let stopped = false
    let timer

    async function load() {
      try {
        const data = await getSensors()
        if (stopped) return
        setSensors(data)
        setError(null)
      } catch (failure) {
        if (stopped) return
        setError(failure.message)
      }
      // El siguiente viaje sale cuando ha vuelto este, no cada cinco segundos
      // pase lo que pase: asi no se amontonan si la API tarda.
      if (!stopped) timer = setTimeout(load, REFRESH_MS)
    }

    load()
    // Al salir de la pantalla: ni se guarda lo que llegue tarde, ni queda un
    // reloj pidiendo datos que ya no mira nadie.
    return () => {
      stopped = true
      clearTimeout(timer)
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

function Content({ sensors, error, onRetired }) {
  // Todavia sin datos: o lo que fallo, o que se esta consultando.
  if (sensors === null) {
    if (error) return <p className="status status-error">{error}</p>
    return <p className="status">Consultando la API…</p>
  }
  return (
    <>
      {/* Con datos ya en pantalla, un refresco fallido no la vacia: avisa y
          deja lo ultimo que llego. */}
      {error && <p className="status status-error">No se pudo actualizar: {error}</p>}
      {sensors.length === 0 ? (
        <p className="status">No hay ningún sensor en servicio.</p>
      ) : (
        <SensorList sensors={sensors} onRetired={onRetired} />
      )}
    </>
  )
}

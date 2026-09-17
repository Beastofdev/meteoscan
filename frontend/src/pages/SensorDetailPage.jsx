import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getReadings, getSensors } from '../api.js'
import ReadingsChart from '../components/ReadingsChart.jsx'
import { typeLabel, unitSymbol } from '../sensorTypes.js'
import './SensorDetailPage.css'

// El detalle de un sensor: sus datos y la evolucion de sus ultimas lecturas.
// La API no tiene GET /sensores/:id, asi que el sensor se busca en la lista:
// funciona igual al recargar o al abrir un enlace (0016).
export default function SensorDetailPage() {
  const { sensorId } = useParams()
  // { sensorId, sensor, readings } o { sensorId, error }. Guardar el id permite
  // saber si la respuesta es del sensor que se esta mirando.
  const [result, setResult] = useState(null)

  useEffect(() => {
    let ignore = false
    Promise.all([getSensors(), getReadings(sensorId)])
      .then(([sensors, readings]) => {
        if (ignore) return
        const sensor = sensors.find((candidate) => candidate.sensor_id === sensorId)
        setResult(
          sensor
            ? { sensorId, sensor, readings }
            : { sensorId, error: 'No hay ningún sensor con ese id.' },
        )
      })
      .catch((failure) => {
        if (!ignore) setResult({ sensorId, error: failure.message })
      })
    return () => {
      ignore = true
    }
  }, [sensorId])

  // Si la direccion ha cambiado a otro sensor y su respuesta aun no ha llegado,
  // la que hay es de otro: cuenta como que no hay respuesta.
  const current = result?.sensorId === sensorId ? result : null

  return (
    <>
      <Link className="back-link" to="/">
        ← Volver a la lista
      </Link>
      <Detail current={current} />
    </>
  )
}

function Detail({ current }) {
  if (current === null) return <p className="status">Consultando la API…</p>
  if (current.error) return <p className="status status-error">{current.error}</p>

  const { sensor, readings } = current
  return (
    <section className="sensor-detail">
      <h2 className="sensor-detail-name">{sensor.name}</h2>
      <p className="sensor-detail-meta">
        {typeLabel(sensor.sensor_type)} · {unitSymbol(sensor.unit)} · {sensor.location}
      </p>
      {readings.length === 0 ? (
        <p className="sensor-detail-empty">Este sensor aún no tiene lecturas.</p>
      ) : (
        <ReadingsChart readings={readings} unit={unitSymbol(sensor.unit)} />
      )}
    </section>
  )
}

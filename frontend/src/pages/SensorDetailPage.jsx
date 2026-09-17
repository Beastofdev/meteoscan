import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getReadings, getSensors } from '../api.js'
import ReadingsChart from '../components/ReadingsChart.jsx'
import { formatNumber, formatTime, isOverThreshold } from '../format.js'
import { typeLabel, unitSymbol } from '../sensorTypes.js'
import './SensorDetailPage.css'

// El mismo ritmo que la lista (0019).
const REFRESH_MS = 5000

// El detalle de un sensor: sus datos, su ultima lectura y la evolucion de las
// ultimas. La API no tiene GET /sensores/:id, asi que el sensor se busca en la
// lista: funciona igual al recargar o al abrir un enlace (0016).
export default function SensorDetailPage() {
  const { sensorId } = useParams()
  // { sensorId, sensor, readings } y { sensorId, message }. Guardar el id
  // permite saber si lo que hay es del sensor que se esta mirando.
  const [result, setResult] = useState(null)
  const [failed, setFailed] = useState(null)

  useEffect(() => {
    let stopped = false
    let timer

    async function load() {
      try {
        const [sensors, readings] = await Promise.all([getSensors(), getReadings(sensorId)])
        if (stopped) return
        const sensor = sensors.find((candidate) => candidate.sensor_id === sensorId)
        if (sensor) {
          setResult({ sensorId, sensor, readings })
          setFailed(null)
        } else {
          setFailed({ sensorId, message: 'No hay ningún sensor con ese id.' })
        }
      } catch (failure) {
        if (!stopped) setFailed({ sensorId, message: failure.message })
      }
      if (!stopped) timer = setTimeout(load, REFRESH_MS)
    }

    load()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [sensorId])

  // Si la direccion ha cambiado a otro sensor y su respuesta aun no ha llegado,
  // lo que hay es de otro: cuenta como que no hay respuesta.
  const current = result?.sensorId === sensorId ? result : null
  const error = failed?.sensorId === sensorId ? failed.message : null

  return (
    <>
      <Link className="back-link" to="/">
        ← Volver a la lista
      </Link>
      <Detail current={current} error={error} />
    </>
  )
}

function Detail({ current, error }) {
  if (current === null) {
    if (error) return <p className="status status-error">{error}</p>
    return <p className="status">Consultando la API…</p>
  }

  const { sensor, readings } = current
  const unit = unitSymbol(sensor.unit)
  const threshold = typeof sensor.alert_threshold === 'number' ? sensor.alert_threshold : null
  const overThreshold = isOverThreshold(sensor)

  return (
    <>
      {error && <p className="status status-error">No se pudo actualizar: {error}</p>}
      <section className={overThreshold ? 'sensor-detail sensor-detail-over' : 'sensor-detail'}>
        <h2 className="sensor-detail-name">{sensor.name}</h2>
        <p className="sensor-detail-meta">
          {typeLabel(sensor.sensor_type)} · {unit} · {sensor.location}
        </p>

        <p className="sensor-detail-reading">
          {sensor.last_reading === null ? (
            <span className="sensor-detail-no-reading">Sin lecturas</span>
          ) : (
            <>
              <span className="sensor-detail-value">
                {formatNumber(sensor.last_reading.value)} {unit}
              </span>
              <span className="sensor-detail-time">
                {formatTime(sensor.last_reading.recorded_at)}
              </span>
            </>
          )}
        </p>
        {overThreshold && (
          <p className="sensor-detail-over-text">
            Por encima de {formatNumber(sensor.alert_threshold)} {unit}
          </p>
        )}

        {readings.length === 0 ? (
          <p className="sensor-detail-empty">Este sensor aún no tiene lecturas.</p>
        ) : (
          <ReadingsChart readings={readings} unit={unit} threshold={threshold} />
        )}
      </section>
    </>
  )
}

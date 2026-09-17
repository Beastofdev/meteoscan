import { useState } from 'react'
import { Link } from 'react-router'
import { retireSensor } from '../api.js'
import { formatNumber, formatTime, isOverThreshold } from '../format.js'
import { typeLabel, unitSymbol } from '../sensorTypes.js'
import './SensorCard.css'

// Lo necesario para reconocer un sensor, su ultima lectura, el enlace a su
// detalle y su baja. Ni el sensor_id, que a quien mira el panel no le dice
// nada, ni la fecha de alta, que los requisitos no piden. onRetired avisa de
// que el sensor ya no esta en servicio.
export default function SensorCard({ sensor, onRetired }) {
  // Cada tarjeta lleva su propia pregunta: confirmar en una no toca las demas.
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const unit = unitSymbol(sensor.unit)
  const overThreshold = isOverThreshold(sensor)

  async function retire() {
    setSending(true)
    setError(null)
    try {
      await retireSensor(sensor.sensor_id)
      onRetired()
    } catch (failure) {
      // Un 404 es que ya estaba de baja, desde otra pestana o con un doble
      // clic: lo que se queria ya ha pasado (0015).
      if (failure.status === 404) {
        onRetired()
        return
      }
      setError(failure.message)
      setSending(false)
    }
    // Si todo va bien, sending no vuelve a false: la tarjeta sigue bloqueada
    // hasta que la lista nueva la quite.
  }

  function cancel() {
    setConfirming(false)
    setError(null)
  }

  return (
    <article className={overThreshold ? 'sensor-card sensor-card-over' : 'sensor-card'}>
      <h2 className="sensor-card-name">
        <Link to={`/sensores/${sensor.sensor_id}`}>{sensor.name}</Link>
      </h2>
      <p className="sensor-card-type">
        {typeLabel(sensor.sensor_type)} · {unit}
      </p>
      <p className="sensor-card-location">{sensor.location}</p>

      <p className="sensor-card-reading">
        {sensor.last_reading === null ? (
          <span className="sensor-card-no-reading">Sin lecturas</span>
        ) : (
          <>
            <span className="sensor-card-value">
              {formatNumber(sensor.last_reading.value)} {unit}
            </span>
            <span className="sensor-card-time">
              {formatTime(sensor.last_reading.recorded_at)}
            </span>
          </>
        )}
      </p>
      {/* El texto, ademas del color: una alerta que solo se ve por el color no
          la ve todo el mundo. */}
      {overThreshold && (
        <p className="sensor-card-over-text">
          Por encima de {formatNumber(sensor.alert_threshold)} {unit}
        </p>
      )}

      {error && <p className="sensor-card-error">{error}</p>}

      <div className="sensor-card-actions">
        {confirming ? (
          <>
            <p className="sensor-card-question">
              ¿Dar de baja? Dejará de aceptar lecturas; las que tiene se conservan.
            </p>
            <button
              type="button"
              className="sensor-card-confirm"
              onClick={retire}
              disabled={sending}
            >
              {sending ? 'Dando de baja…' : 'Sí'}
            </button>
            <button type="button" onClick={cancel} disabled={sending}>
              No
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)}>
            Dar de baja
          </button>
        )}
      </div>
    </article>
  )
}

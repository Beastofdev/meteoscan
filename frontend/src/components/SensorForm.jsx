import { useState } from 'react'
import { createSensor } from '../api.js'
import { SENSOR_TYPE_CODES, typeLabel } from '../sensorTypes.js'
import './SensorForm.css'

const FIELDS = ['name', 'sensor_type', 'location']

// El alta de un sensor. No valida nada: manda lo escrito y muestra lo que
// conteste la API, cada error bajo su campo (0014). onCreated avisa a quien lo
// usa de que hay un sensor nuevo.
export default function SensorForm({ onCreated }) {
  const [name, setName] = useState('')
  const [sensorType, setSensorType] = useState('')
  const [location, setLocation] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [createdName, setCreatedName] = useState(null)

  async function handleSubmit(event) {
    // Sin esto, el navegador recarga la pagina con los campos en la direccion.
    event.preventDefault()
    setSending(true)
    setError(null)
    setCreatedName(null)
    try {
      const sensor = await createSensor({ name, sensor_type: sensorType, location })
      setName('')
      setSensorType('')
      setLocation('')
      setCreatedName(sensor.name)
      onCreated()
    } catch (failure) {
      // Lo escrito se queda donde estaba, para corregirlo.
      setError(failure)
    } finally {
      setSending(false)
    }
  }

  const errorFor = (field) => (error?.field === field ? error.message : null)
  const generalError = error && !FIELDS.includes(error.field) ? error.message : null

  return (
    <form className="sensor-form" onSubmit={handleSubmit}>
      <h2 className="sensor-form-title">Dar de alta un sensor</h2>

      {generalError && <p className="sensor-form-error">{generalError}</p>}

      <label htmlFor="sensor-name">Nombre</label>
      <div>
        <input
          id="sensor-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <FieldError message={errorFor('name')} />
      </div>

      <label htmlFor="sensor-type">Tipo</label>
      <div>
        <select
          id="sensor-type"
          value={sensorType}
          onChange={(event) => setSensorType(event.target.value)}
        >
          <option value="">Elige un tipo</option>
          {SENSOR_TYPE_CODES.map((code) => (
            <option key={code} value={code}>
              {typeLabel(code)}
            </option>
          ))}
        </select>
        <FieldError message={errorFor('sensor_type')} />
      </div>

      <label htmlFor="sensor-location">Ubicación</label>
      <div>
        <input
          id="sensor-location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />
        <FieldError message={errorFor('location')} />
      </div>

      <div className="sensor-form-footer">
        {createdName && (
          <p className="sensor-form-created">Sensor «{createdName}» dado de alta.</p>
        )}
        <button type="submit" disabled={sending}>
          {sending ? 'Dando de alta…' : 'Dar de alta'}
        </button>
      </div>
    </form>
  )
}

function FieldError({ message }) {
  if (!message) return null
  return <p className="sensor-form-error">{message}</p>
}

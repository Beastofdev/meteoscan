import { useEffect, useRef, useState } from 'react'
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

  // Para poder llevar el foco al campo que la API senale.
  const nameRef = useRef(null)
  const typeRef = useRef(null)
  const locationRef = useRef(null)

  // Al fallar el alta, el foco se va al campo que hay que corregir. Va en un
  // efecto y no dentro del envio para que llegue cuando el mensaje ya esta
  // puesto: asi el lector de pantalla lee el motivo junto al campo (0023). Si
  // el error no es de ningun campo --la API que no contesta-- el foco se queda
  // donde estaba: no hay adonde llevarlo, y el mensaje ya se anuncia solo.
  useEffect(() => {
    if (error === null) return
    // Un Map y no un objeto: en un objeto, un campo como 'constructor'
    // encontraria algo que no es una referencia.
    const fields = new Map([
      ['name', nameRef],
      ['sensor_type', typeRef],
      ['location', locationRef],
    ])
    fields.get(error.field)?.current?.focus()
  }, [error])

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
  // El error de cada campo se usa tres veces: para pintarlo de rojo, para
  // anunciarlo al lector de pantalla y para escribirlo debajo.
  const nameError = errorFor('name')
  const typeError = errorFor('sensor_type')
  const locationError = errorFor('location')

  return (
    <form className="sensor-form" onSubmit={handleSubmit}>
      <h2 className="sensor-form-title">Dar de alta un sensor</h2>

      {generalError && (
        <p className="sensor-form-error" role="alert">
          {generalError}
        </p>
      )}

      <label htmlFor="sensor-name">Nombre</label>
      <div>
        <input
          id="sensor-name"
          ref={nameRef}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? 'sensor-name-error' : undefined}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <FieldError id="sensor-name-error" message={nameError} />
      </div>

      <label htmlFor="sensor-type">Tipo</label>
      <div>
        <select
          id="sensor-type"
          ref={typeRef}
          aria-invalid={typeError ? true : undefined}
          aria-describedby={typeError ? 'sensor-type-error' : undefined}
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
        <FieldError id="sensor-type-error" message={typeError} />
      </div>

      <label htmlFor="sensor-location">Ubicación</label>
      <div>
        <input
          id="sensor-location"
          ref={locationRef}
          aria-invalid={locationError ? true : undefined}
          aria-describedby={locationError ? 'sensor-location-error' : undefined}
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />
        <FieldError id="sensor-location-error" message={locationError} />
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

// El mensaje lleva id para que su campo pueda apuntarlo con aria-describedby:
// asi un lector de pantalla lo lee al entrar en el campo, y no solo quien pueda
// verlo debajo. Y role="alert" para que lo cante en cuanto aparece: llega
// despues de enviar, cuando el foco esta en el boton y nadie esta mirando el
// campo.
function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p className="sensor-form-error" id={id} role="alert">
      {message}
    </p>
  )
}

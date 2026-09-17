// Todas las llamadas a la API pasan por aqui. Es el unico sitio que sabe como
// explica la API lo que ha ido mal, y lo convierte en un ApiError.

// El proxy del servidor de desarrollo quita este prefijo antes de pasar la
// peticion a la API (vite.config.js, 0016).
const API = '/api'

// Un error con un mensaje que se puede mostrar tal cual. status es el codigo
// HTTP (0 si no hubo respuesta); code, el codigo estable de la API (0009); y
// field, el campo al que se refiere, si la API lo dice.
export class ApiError extends Error {
  constructor(status, code, message, field) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.field = field
  }
}

export function getSensors() {
  return request(`${API}/sensores`)
}

// Devuelve el sensor creado, con la misma forma que los de getSensors.
export function createSensor({ name, sensor_type, location }) {
  return request(`${API}/sensores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, sensor_type, location }),
  })
}

// Da de baja un sensor. Un 404 llega como ApiError: el sensor no existe o ya
// estaba de baja.
export function retireSensor(sensorId) {
  return request(`${API}/sensores/${encodeURIComponent(sensorId)}`, { method: 'DELETE' })
}

// Las ultimas lecturas de un sensor, de la mas antigua a la mas nueva. Un 404
// llega como ApiError: el sensor no existe o esta de baja.
export function getReadings(sensorId) {
  return request(`${API}/sensores/${encodeURIComponent(sensorId)}/lecturas`)
}

async function request(path, options) {
  let response
  try {
    response = await fetch(path, options)
  } catch {
    // fetch solo falla sin respuesta: el servidor del panel no esta, o no hay red.
    throw new ApiError(0, 'network_error', 'No se pudo conectar con la API.')
  }
  // 204 No Content: no hay cuerpo, y response.json() fallaria aunque todo
  // haya ido bien.
  if (response.status === 204) return null
  if (response.ok) return response.json()
  throw await toApiError(response)
}

// La API explica sus errores con { "error": { "code", "message", "field" } }.
// Lo que no venga asi —el proxy contesta 502, sin cuerpo, cuando la API esta
// parada— recibe un mensaje generico con el codigo HTTP.
async function toApiError(response) {
  const body = await response.json().catch(() => null)
  const error = body?.error
  if (typeof error?.message === 'string') {
    return new ApiError(response.status, error.code, error.message, error.field)
  }
  return new ApiError(
    response.status,
    'unexpected_response',
    `La API no ha respondido bien (código ${response.status}).`,
  )
}

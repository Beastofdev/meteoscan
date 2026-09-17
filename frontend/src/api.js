// Todas las llamadas a la API pasan por aqui. Es el unico sitio que sabe como
// explica la API lo que ha ido mal, y lo convierte en un ApiError.

// Un error con un mensaje que se puede mostrar tal cual. status es el codigo
// HTTP (0 si no hubo respuesta) y code, el codigo estable de la API (0009).
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function getSensors() {
  return request('/sensores')
}

async function request(path) {
  let response
  try {
    response = await fetch(path)
  } catch {
    // fetch solo falla sin respuesta: el servidor del panel no esta, o no hay red.
    throw new ApiError(0, 'network_error', 'No se pudo conectar con la API.')
  }
  if (response.ok) return response.json()
  throw await toApiError(response)
}

// La API explica sus errores con { "error": { "code", "message" } }. Lo que no
// venga asi —el proxy contesta 502, sin cuerpo, cuando la API esta parada—
// recibe un mensaje generico con el codigo HTTP.
async function toApiError(response) {
  const body = await response.json().catch(() => null)
  const error = body?.error
  if (typeof error?.message === 'string') {
    return new ApiError(response.status, error.code, error.message)
  }
  return new ApiError(
    response.status,
    'unexpected_response',
    `La API no ha respondido bien (código ${response.status}).`,
  )
}

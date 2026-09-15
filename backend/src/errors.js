// Los errores de la API. Todos salen con la misma forma (decision 0009):
//   { "error": { "code": "not_found", "message": "No existe la ruta GET /nada." } }
// El codigo es para los programas y no cambia; el mensaje, para las personas.

// Un error que la API espera y sabe contestar. Una ruta lo lanza con throw, y
// errorHandler lo convierte en la respuesta.
export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// La forma de un error, escrita una sola vez.
function errorBody(code, message) {
  return { error: { code, message } };
}

// Si una peticion llega hasta aqui, ninguna ruta la ha contestado. Para Express
// eso no es un error, asi que se atiende como un middleware normal, detras de
// todas las rutas. No contesta: pasa el error, para que todas las respuestas
// de error salgan de errorHandler.
export function notFound(req, res, next) {
  next(new HttpError(404, 'not_found', `No existe la ruta ${req.method} ${req.path}.`));
}

// El unico sitio que escribe respuestas de error. Express lo reconoce por sus
// cuatro parametros: sin next, lo tomaria por un middleware normal, y el error
// acabaria en su pagina de serie, con la traza.
export function errorHandler(error, req, res, next) {
  // Si la respuesta ya empezo a salir, ya no se puede cambiar: se le pasa al
  // manejador de serie, que cierra la conexion (documentacion de Express).
  if (res.headersSent) return next(error);

  if (error instanceof HttpError) {
    return res.status(error.status).json(errorBody(error.code, error.message));
  }

  // Un fallo inesperado. El detalle, con la traza, solo en el registro del
  // servidor: los errores del motor no son para el usuario.
  console.error(error);
  res.status(500).json(errorBody('internal_error', 'Error interno del servidor.'));
}

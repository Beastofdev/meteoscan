// Los errores de la API. Todos salen con la misma forma (decision 0009):
//   { "error": { "code": "not_found", "message": "No existe la ruta GET /nada." } }
// El codigo es para los programas y no cambia; el mensaje, para las personas.
// Si el error es de un campo, lleva tambien "field", con su nombre.

// Un error que la API espera y sabe contestar. Una ruta lo lanza con throw, y
// errorHandler lo convierte en la respuesta. field, solo si es de un campo.
export class HttpError extends Error {
  constructor(status, code, message, field) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

// Los errores de PostgreSQL que una ruta puede provocar con datos validos, por
// su codigo y el nombre de su restriccion: la misma restriccion da otro codigo
// en otra operacion (una clave ajena, 23503 al insertar y 23001 al borrar). Los
// demas no deberian llegar a la base, porque la validacion los para antes: si
// llegan, son un fallo nuestro, y salen como 500.
const DATABASE_ERRORS = new Map([
  ['23505 uq_sensors_name_in_service',
    new HttpError(409, 'sensor_name_taken', 'Ya hay un sensor en servicio con ese nombre.', 'name')],
  ['23503 fk_sensors_sensor_type',
    new HttpError(400, 'unknown_sensor_type', 'No existe ese tipo de sensor.', 'sensor_type')],
]);

// Los errores de express.json() traen su codigo HTTP y un tipo (documentacion
// de body-parser). Los dos que se esperan tienen codigo propio; el resto de los
// 4xx, invalid_body.
const BODY_ERRORS = new Map([
  ['entity.parse.failed', ['invalid_json', 'El cuerpo no es JSON válido.']],
  ['entity.too.large', ['body_too_large', 'El cuerpo es demasiado grande.']],
]);

// La forma de un error, escrita una sola vez.
function errorBody(code, message, field) {
  const error = { code };
  if (field !== undefined) error.field = field;
  error.message = message;
  return { error };
}

// Convierte en HttpError lo que la API sabe contestar. Lo demas da null: es un
// fallo inesperado.
function toHttpError(error) {
  if (error instanceof HttpError) return error;

  const fromDatabase = DATABASE_ERRORS.get(`${error.code} ${error.constraint}`);
  if (fromDatabase) return fromDatabase;

  if (typeof error.type === 'string' && error.status >= 400 && error.status < 500) {
    const [code, message] = BODY_ERRORS.get(error.type) ?? ['invalid_body', 'No se ha podido leer el cuerpo.'];
    return new HttpError(error.status, code, message);
  }

  // Un % mal escrito en la direccion: el router de Express no puede descifrar
  // el parametro, y lanza un URIError con status 400 (su codigo).
  if (error instanceof URIError && error.status === 400) {
    return new HttpError(400, 'invalid_url', 'La dirección no es válida.');
  }

  return null;
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

  const known = toHttpError(error);
  if (known) {
    return res.status(known.status).json(errorBody(known.code, known.message, known.field));
  }

  // Un fallo inesperado. El detalle, con la traza, solo en el registro del
  // servidor: los errores del motor no son para el usuario.
  console.error(error);
  res.status(500).json(errorBody('internal_error', 'Error interno del servidor.'));
}

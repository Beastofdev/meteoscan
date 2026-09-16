// Las comprobaciones que comparten los routers. Cada ruta valida su cuerpo en
// un solo sitio; lo que se repetia entre las de sensores y lecturas vive aqui.
import { HttpError } from './errors.js';

// Un uuid en su forma normal, la que devuelve la API: 8-4-4-4-12 cifras
// hexadecimales, en mayusculas o en minusculas.
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// El cuerpo tiene que ser un objeto JSON, y sin campos de mas: un retired_at,
// por ejemplo, no se cuela. Sin Content-Type JSON, express.json() deja el
// cuerpo en undefined; y una lista tambien es JSON, pero no un objeto.
export function checkBody(body, fields) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HttpError(400, 'invalid_body', 'El cuerpo tiene que ser un objeto JSON.');
  }
  for (const field of Object.keys(body)) {
    if (!fields.includes(field)) {
      throw new HttpError(400, 'invalid_body', `Sobra el campo ${field}.`, field);
    }
  }
}

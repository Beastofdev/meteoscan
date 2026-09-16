// Lo que comparten las pruebas: hablar con la API, y nombres que no choquen.
// La direccion se puede cambiar con API_URL; por defecto, la de siempre.
import assert from 'node:assert/strict';

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:8005';

// Una peticion a la API, con el codigo, las cabeceras y el cuerpo ya leidos.
// Un 204 no trae cuerpo, y entonces el cuerpo es null.
export async function api(method, path, body) {
  return apiRaw(
    method,
    path,
    body === undefined ? undefined : JSON.stringify(body),
    'application/json',
  );
}

// Igual, pero con el cuerpo tal cual: para mandar un JSON mal escrito, algo
// que no es JSON, o un cuerpo enorme.
export async function apiRaw(method, path, body, contentType = 'application/json') {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': contentType },
    body,
  });
  const text = await response.text();
  return {
    status: response.status,
    headers: response.headers,
    body: text === '' ? null : JSON.parse(text),
  };
}

// Un nombre que no ha usado ninguna otra prueba: el nombre de un sensor en
// servicio es unico, y dos pruebas con el mismo chocarian con un 409. Cada
// fichero de pruebas corre en su propio proceso, de ahi el process.pid.
let counter = 0;
export function uniqueName(prefix) {
  counter += 1;
  return `${prefix} ${process.pid}-${counter}`;
}

// Crea un sensor y devuelve el que contesta la API. Con fields se cambia solo
// lo que le importa a cada prueba.
export async function createSensor(fields = {}) {
  const { status, body } = await api('POST', '/sensores', {
    name: uniqueName('Sensor'),
    sensor_type: 'temperature',
    location: 'Nave 1',
    ...fields,
  });
  assert.equal(status, 201, `no se pudo crear el sensor: ${JSON.stringify(body)}`);
  return body;
}

// Una hora en la forma que acepta la API, movida los segundos que se pidan.
export function isoTime(secondsFromNow = 0) {
  return new Date(Date.now() + secondsFromNow * 1000).toISOString();
}

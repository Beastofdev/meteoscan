// Las pruebas de lo que no depende de una ruta: la salud, el 404 y los
// errores del cuerpo (decision 0009).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, apiRaw } from './api.js';

test('/health contesta 200 con la base viva', async () => {
  const { status, body } = await api('GET', '/health');
  assert.equal(status, 200);
  assert.deepEqual(body, { status: 'ok', database: 'ok' });
});

test('una ruta que no existe da un 404 en JSON, no una pagina', async () => {
  const { status, headers, body } = await api('GET', '/nada');
  assert.equal(status, 404);
  assert.ok(headers.get('content-type').startsWith('application/json'));
  assert.equal(body.error.code, 'not_found');
});

test('las respuestas no anuncian que la API es Express', async () => {
  const { headers } = await api('GET', '/sensores');
  assert.equal(headers.get('x-powered-by'), null);
});

test('un JSON mal escrito da 400 invalid_json', async () => {
  const { status, body } = await apiRaw('POST', '/sensores', '{"name":');
  assert.equal(status, 400);
  assert.equal(body.error.code, 'invalid_json');
});

test('un cuerpo que no es un objeto da 400 invalid_body', async () => {
  const lista = await apiRaw('POST', '/sensores', '[]');
  assert.equal(lista.status, 400);
  assert.equal(lista.body.error.code, 'invalid_body');

  const textoPlano = await apiRaw('POST', '/sensores', 'hola', 'text/plain');
  assert.equal(textoPlano.status, 400);
  assert.equal(textoPlano.body.error.code, 'invalid_body');
});

test('un cuerpo de mas de 100 KB da 413 body_too_large', async () => {
  const enorme = JSON.stringify({ name: 'a'.repeat(200000) });
  const { status, body } = await apiRaw('POST', '/sensores', enorme);
  assert.equal(status, 413);
  assert.equal(body.error.code, 'body_too_large');
});

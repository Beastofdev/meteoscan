// Las pruebas de /sensores: el contrato que ve el panel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, createSensor, uniqueName } from './api.js';

test('GET /sensores trae el sensor recien creado, con la unidad de su tipo', async () => {
  const sensor = await createSensor({ sensor_type: 'humidity' });
  const { status, body } = await api('GET', '/sensores');
  assert.equal(status, 200);
  const found = body.find((s) => s.sensor_id === sensor.sensor_id);
  assert.ok(found, 'el sensor creado no sale en la lista');
  assert.equal(found.unit, '%RH');
  assert.equal(found.retired_at, undefined, 'la lista no debe traer retired_at');
});

test('POST /sensores quita los espacios de los extremos', async () => {
  const name = uniqueName('Sensor');
  const { status, body } = await api('POST', '/sensores', {
    name: `  ${name}  `,
    sensor_type: 'temperature',
    location: '  Nave 2  ',
  });
  assert.equal(status, 201);
  assert.equal(body.name, name);
  assert.equal(body.location, 'Nave 2');
});

test('POST /sensores rechaza el nombre repetido con un 409', async () => {
  const sensor = await createSensor();
  const { status, body } = await api('POST', '/sensores', {
    name: sensor.name.toUpperCase(),
    sensor_type: 'temperature',
    location: 'Nave 2',
  });
  assert.equal(status, 409);
  assert.equal(body.error.code, 'sensor_name_taken');
  assert.equal(body.error.field, 'name');
});

test('POST /sensores rechaza un tipo que no existe con un 400', async () => {
  const { status, body } = await api('POST', '/sensores', {
    name: uniqueName('Sensor'),
    sensor_type: 'wind',
    location: 'Nave 1',
  });
  assert.equal(status, 400);
  assert.equal(body.error.code, 'unknown_sensor_type');
  assert.equal(body.error.field, 'sensor_type');
});

test('POST /sensores rechaza un campo que sobra, y uno en blanco', async () => {
  const sobra = await api('POST', '/sensores', {
    name: uniqueName('Sensor'),
    sensor_type: 'temperature',
    location: 'Nave 1',
    retired_at: '2020-01-01T00:00:00Z',
  });
  assert.equal(sobra.status, 400);
  assert.equal(sobra.body.error.code, 'invalid_body');
  assert.equal(sobra.body.error.field, 'retired_at');

  const enBlanco = await api('POST', '/sensores', {
    name: '   ',
    sensor_type: 'temperature',
    location: 'Nave 1',
  });
  assert.equal(enBlanco.status, 400);
  assert.equal(enBlanco.body.error.code, 'invalid_field');
  assert.equal(enBlanco.body.error.field, 'name');
});

test('DELETE /sensores/:id da de baja, y el sensor desaparece de la lista', async () => {
  const sensor = await createSensor();
  const baja = await api('DELETE', `/sensores/${sensor.sensor_id}`);
  assert.equal(baja.status, 204);
  assert.equal(baja.body, null, 'un 204 no lleva cuerpo');

  const { body } = await api('GET', '/sensores');
  assert.ok(!body.some((s) => s.sensor_id === sensor.sensor_id), 'sigue en la lista');

  const otraVez = await api('DELETE', `/sensores/${sensor.sensor_id}`);
  assert.equal(otraVez.status, 404);
  assert.equal(otraVez.body.error.code, 'sensor_not_found');
});

test('DELETE /sensores/:id con un id que no es un uuid da 404', async () => {
  const { status, body } = await api('DELETE', '/sensores/abc');
  assert.equal(status, 404);
  assert.equal(body.error.code, 'sensor_not_found');
});

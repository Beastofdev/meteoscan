// Las pruebas de /lecturas y del historico de un sensor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, createSensor, isoTime } from './api.js';

test('POST /lecturas guarda la lectura y la devuelve en UTC', async () => {
  const sensor = await createSensor();
  const { status, body } = await api('POST', '/lecturas', {
    sensor_id: sensor.sensor_id,
    value: 21.4,
    recorded_at: '2026-09-16T13:06:07.922+02:00',
  });
  assert.equal(status, 201);
  assert.equal(body.value, 21.4);
  assert.equal(body.recorded_at, '2026-09-16T11:06:07.922Z');
  assert.equal(typeof body.reading_id, 'string', 'reading_id viaja como texto');
});

test('POST /lecturas rechaza la misma lectura dos veces con un 409', async () => {
  const sensor = await createSensor();
  const lectura = { sensor_id: sensor.sensor_id, value: 20, recorded_at: isoTime() };
  assert.equal((await api('POST', '/lecturas', lectura)).status, 201);
  const repetida = await api('POST', '/lecturas', lectura);
  assert.equal(repetida.status, 409);
  assert.equal(repetida.body.error.code, 'reading_already_exists');
});

test('POST /lecturas rechaza un sensor que no existe, y uno mal escrito', async () => {
  const inventado = await api('POST', '/lecturas', {
    sensor_id: '00000000-0000-4000-8000-000000000000',
    value: 20,
    recorded_at: isoTime(),
  });
  assert.equal(inventado.status, 400);
  assert.equal(inventado.body.error.code, 'unknown_sensor');

  const malEscrito = await api('POST', '/lecturas', {
    sensor_id: 'abc',
    value: 20,
    recorded_at: isoTime(),
  });
  assert.equal(malEscrito.status, 400);
  assert.equal(malEscrito.body.error.code, 'unknown_sensor');
});

test('un sensor dado de baja acepta lo medido antes, y rechaza lo de despues', async () => {
  const sensor = await createSensor();
  assert.equal((await api('DELETE', `/sensores/${sensor.sensor_id}`)).status, 204);

  const antes = await api('POST', '/lecturas', {
    sensor_id: sensor.sensor_id,
    value: 20,
    recorded_at: isoTime(-3600),
  });
  assert.equal(antes.status, 201, 'lo medido antes de la baja si entra');

  const despues = await api('POST', '/lecturas', {
    sensor_id: sensor.sensor_id,
    value: 20,
    recorded_at: isoTime(3600),
  });
  assert.equal(despues.status, 409);
  assert.equal(despues.body.error.code, 'sensor_retired');
});

test('POST /lecturas rechaza las horas y los valores malos', async () => {
  const sensor = await createSensor();
  const casos = [
    { recorded_at: '2026-09-16T13:06:07', que: 'sin zona horaria' },
    { recorded_at: '2026-02-30T00:00:00Z', que: 'el 30 de febrero' },
    { recorded_at: '2026-09-16T13:06:07.1234Z', que: 'con cuatro decimales' },
  ];
  for (const caso of casos) {
    const { status, body } = await api('POST', '/lecturas', {
      sensor_id: sensor.sensor_id,
      value: 20,
      recorded_at: caso.recorded_at,
    });
    assert.equal(status, 400, `deberia rechazar una hora ${caso.que}`);
    assert.equal(body.error.field, 'recorded_at');
  }

  const texto = await api('POST', '/lecturas', {
    sensor_id: sensor.sensor_id,
    value: '20.5',
    recorded_at: isoTime(),
  });
  assert.equal(texto.status, 400);
  assert.equal(texto.body.error.field, 'value');
});

test('el historico va de la mas antigua a la mas nueva, aunque lleguen en desorden', async () => {
  const sensor = await createSensor();
  const base = Date.now();
  for (const segundos of [2, 0, 1]) {
    const { status } = await api('POST', '/lecturas', {
      sensor_id: sensor.sensor_id,
      value: 20 + segundos,
      recorded_at: new Date(base + segundos * 1000).toISOString(),
    });
    assert.equal(status, 201);
  }
  const { status, body } = await api('GET', `/sensores/${sensor.sensor_id}/lecturas`);
  assert.equal(status, 200);
  assert.deepEqual(body.map((lectura) => lectura.value), [20, 21, 22]);
  assert.equal(body[0].sensor_id, undefined, 'el historico no repite el sensor_id');
});

test('el historico: vacio si no tiene lecturas, y 404 si el sensor esta de baja', async () => {
  const sensor = await createSensor();
  const vacio = await api('GET', `/sensores/${sensor.sensor_id}/lecturas`);
  assert.equal(vacio.status, 200);
  assert.deepEqual(vacio.body, []);

  assert.equal((await api('DELETE', `/sensores/${sensor.sensor_id}`)).status, 204);
  const deBaja = await api('GET', `/sensores/${sensor.sensor_id}/lecturas`);
  assert.equal(deBaja.status, 404);
  assert.equal(deBaja.body.error.code, 'sensor_not_found');
});

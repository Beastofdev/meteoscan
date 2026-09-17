// Las pruebas del panel: lo que ve y hace quien lo usa.
//
// Corren contra la aplicacion de verdad --- la API y un PostgreSQL de usar y
// tirar que levanta check_panel.sh ---, no contra una API inventada: asi se
// prueba tambien el proxy y el contrato real (decision 0020). Los unicos
// fallos simulados son los que no se pueden provocar de verdad, como la API
// caida.
//
// Cada prueba crea sus propios sensores, con un nombre que no usa ninguna
// otra: la base es la misma para todas.
import { expect, test } from '@playwright/test';

const API = process.env.API_URL ?? 'http://127.0.0.1:8005';

let counter = 0;
function uniqueName(prefix) {
  counter += 1;
  return `${prefix} ${process.pid}-${counter}`;
}

async function createSensor(request, fields = {}) {
  const response = await request.post(`${API}/sensores`, {
    data: {
      name: uniqueName('Panel'),
      sensor_type: 'temperature',
      location: 'Nave 1',
      ...fields,
    },
  });
  expect(response.status(), 'no se pudo crear el sensor').toBe(201);
  return response.json();
}

async function sendReading(request, sensor, value, secondsAgo = 0) {
  const response = await request.post(`${API}/lecturas`, {
    data: {
      sensor_id: sensor.sensor_id,
      value,
      recorded_at: new Date(Date.now() - secondsAgo * 1000).toISOString(),
    },
  });
  expect(response.status(), 'no se pudo guardar la lectura').toBe(201);
}

const card = (page, name) =>
  page.locator('article.sensor-card', { has: page.getByRole('heading', { name, exact: true }) });

test('la lista enseña cada sensor con su tipo, su unidad y su ultima lectura', async ({ page, request }) => {
  const sensor = await createSensor(request, { sensor_type: 'pm25', location: 'Patio norte' });
  await sendReading(request, sensor, 12.5);

  await page.goto('/');
  const tarjeta = card(page, sensor.name);
  await expect(tarjeta).toContainText('Partículas PM2.5 · µg/m³');
  await expect(tarjeta).toContainText('Patio norte');
  await expect(tarjeta.locator('.sensor-card-value')).toHaveText('12,5 µg/m³');
});

test('el alta crea el sensor, y el nombre repetido da su error bajo el campo', async ({ page }) => {
  const nombre = uniqueName('Panel alta');
  await page.goto('/');
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Tipo').selectOption('humidity');
  await page.getByLabel('Ubicación').fill('Azotea');
  await page.locator('.sensor-form button').click();

  await expect(card(page, nombre)).toBeVisible();
  await expect(page.getByLabel('Nombre')).toHaveValue('');

  // El mismo nombre otra vez: la API contesta 409 y el panel lo pone donde toca.
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Tipo').selectOption('humidity');
  await page.getByLabel('Ubicación').fill('Otro sitio');
  await page.locator('.sensor-form button').click();

  await expect(page.locator('#sensor-name ~ .sensor-form-error'))
    .toHaveText('Ya hay un sensor en servicio con ese nombre.');
  await expect(page.getByLabel('Nombre'), 'lo escrito se conserva para corregirlo')
    .toHaveValue(nombre);
});

test('la baja pregunta antes, y la tarjeta desaparece', async ({ page, request }) => {
  const sensor = await createSensor(request);
  await page.goto('/');
  const tarjeta = card(page, sensor.name);

  await tarjeta.getByRole('button', { name: 'Dar de baja' }).click();
  await expect(tarjeta.locator('.sensor-card-question')).toContainText('¿Dar de baja?');
  await tarjeta.getByRole('button', { name: 'No' }).click();
  await expect(tarjeta).toBeVisible();

  await tarjeta.getByRole('button', { name: 'Dar de baja' }).click();
  await tarjeta.getByRole('button', { name: 'Sí' }).click();
  await expect(tarjeta).toHaveCount(0);
});

test('una lectura por encima del umbral avisa, y la humedad no avisa nunca', async ({ page, request }) => {
  const caliente = await createSensor(request, { sensor_type: 'temperature' });
  await sendReading(request, caliente, 41);
  const humedo = await createSensor(request, { sensor_type: 'humidity' });
  await sendReading(request, humedo, 95);

  await page.goto('/');
  const enAlerta = card(page, caliente.name);
  await expect(enAlerta).toHaveClass(/sensor-card-over/);
  await expect(enAlerta.locator('.sensor-card-over-text')).toHaveText('Por encima de 35 °C');

  const sinUmbral = card(page, humedo.name);
  await expect(sinUmbral, 'la humedad no tiene umbral').not.toHaveClass(/sensor-card-over/);
  await expect(sinUmbral.locator('.sensor-card-over-text')).toHaveCount(0);
});

test('el detalle dibuja el grafico con la linea del umbral, y se vuelve a la lista', async ({ page, request }) => {
  const sensor = await createSensor(request, { sensor_type: 'temperature' });
  for (const [value, segundos] of [[20, 30], [25, 20], [38, 10]]) {
    await sendReading(request, sensor, value, segundos);
  }

  await page.goto('/');
  await card(page, sensor.name).getByRole('link', { name: sensor.name }).click();

  await expect(page).toHaveURL(new RegExp(`/sensores/${sensor.sensor_id}$`));
  await expect(page.locator('.recharts-line-curve')).toBeVisible();
  await expect(page.locator('.readings-chart-threshold')).toHaveCount(1);
  await expect(page.locator('.sensor-detail-value')).toHaveText('38 °C');

  await page.goBack();
  await expect(card(page, sensor.name)).toBeVisible();
});

test('una lectura nueva aparece sola, sin recargar la pagina', async ({ page, request }) => {
  const sensor = await createSensor(request);
  await sendReading(request, sensor, 20);
  await page.goto('/');
  const valor = card(page, sensor.name).locator('.sensor-card-value');
  await expect(valor).toHaveText('20 °C');

  // Por fuera del navegador, como haria el simulador.
  await sendReading(request, sensor, 31.5);
  await expect(valor, 'el panel se refresca solo').toHaveText('31,5 °C', { timeout: 15_000 });
});

test('si la API deja de contestar, avisa y no vacia la pantalla', async ({ page, request }) => {
  const sensor = await createSensor(request);
  await sendReading(request, sensor, 22);
  await page.goto('/');
  await expect(card(page, sensor.name)).toBeVisible();

  await page.route('**/api/sensores', (route) => route.fulfill({ status: 502, body: '' }));
  await expect(page.locator('.status-error')).toContainText('No se pudo actualizar', { timeout: 15_000 });
  await expect(card(page, sensor.name), 'lo ultimo que llego se queda').toBeVisible();

  await page.unroute('**/api/sensores');
  await expect(page.locator('.status-error')).toHaveCount(0, { timeout: 15_000 });
});

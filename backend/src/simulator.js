// El simulador de sensores (decision 0010). Cada X segundos manda una lectura
// de cada sensor en servicio, por la misma puerta que usaria un sensor de
// verdad: POST /lecturas.
//
//   npm run simular
//
// Se para con Ctrl+C. Necesita la API en marcha.

// Donde esta la API y cada cuanto va una vuelta. Con valores por defecto: el
// simulador no obliga a tener un .env.
const API_URL = process.env.API_URL ?? 'http://127.0.0.1:8005';
const INTERVAL_MS = Number(process.env.SIM_INTERVAL_MS ?? 5000);
// Si la API no contesta en 4 segundos, se deja esa vuelta: esperar mas, con 5
// segundos de intervalo, seria amontonar peticiones.
const TIMEOUT_MS = 4000;

// El rango de cada tipo y cuanto se mueve el valor de una vuelta a la
// siguiente. Un paseo aleatorio se parece mas a un sensor que un numero al
// azar cada vez. La temperatura llega a 40 a proposito: la alerta del panel
// salta a partir de 35 (requisitos).
// Fuente: Carlos, 2026-09-16 (decision 0003).
const RANGES = {
  temperature: { min: 15, max: 40, step: 0.4 },
  humidity: { min: 30, max: 90, step: 1.5 },
  pm25: { min: 5, max: 50, step: 1.2 },
};

// El ultimo valor de cada sensor, para que el siguiente salga de ahi.
const lastValues = new Map();
// Los tipos sin rango, para avisar de cada uno una sola vez.
const warnedTypes = new Set();

// Una peticion a la API que no se queda colgada esperando.
function request(path, options = {}) {
  return fetch(`${API_URL}${path}`, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
}

// El valor siguiente de un sensor: el anterior, movido un poco, sin salirse
// del rango de su tipo. El primero sale del centro del rango.
function nextValue(sensor) {
  const range = RANGES[sensor.sensor_type];
  // Un tipo sin rango no se simula: el simulador no se inventa valores (0003).
  if (!range) {
    if (!warnedTypes.has(sensor.sensor_type)) {
      warnedTypes.add(sensor.sensor_type);
      console.error(`Sin rango para el tipo ${sensor.sensor_type}: esos sensores se saltan.`);
    }
    return null;
  }
  const previous = lastValues.get(sensor.sensor_id) ?? (range.min + range.max) / 2;
  const step = (Math.random() * 2 - 1) * range.step;
  const value = Math.min(range.max, Math.max(range.min, previous + step));
  // Un decimal, como el que da un sensor normal.
  const rounded = Math.round(value * 10) / 10;
  lastValues.set(sensor.sensor_id, rounded);
  return rounded;
}

// Una vuelta: la lista de sensores en servicio, y una lectura de cada uno. Asi
// un sensor nuevo entra solo, y uno dado de baja deja de recibir lecturas.
async function tick() {
  let sensors;
  try {
    const response = await request('/sensores');
    if (!response.ok) {
      console.error(`La API contesto ${response.status} al pedir los sensores.`);
      return;
    }
    sensors = await response.json();
  } catch (error) {
    console.error(`No se puede hablar con la API (${error.message}). Se reintenta en la vuelta siguiente.`);
    return;
  }
  if (sensors.length === 0) {
    console.log('No hay sensores en servicio: nada que simular.');
    return;
  }

  const recordedAt = new Date().toISOString();
  let sent = 0;
  for (const sensor of sensors) {
    const value = nextValue(sensor);
    if (value === null) continue;
    try {
      const response = await request('/lecturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensor_id: sensor.sensor_id, value, recorded_at: recordedAt }),
      });
      if (response.ok) {
        sent++;
        continue;
      }
      // Un error de la API no para el simulador: se cuenta y se sigue. Un 409
      // es, por ejemplo, un sensor dado de baja entre la lista y el envio.
      const body = await response.json().catch(() => null);
      console.error(`${sensor.name}: la API contesto ${response.status} (${body?.error?.code ?? 'sin codigo'}).`);
    } catch (error) {
      console.error(`${sensor.name}: no se pudo enviar (${error.message}).`);
    }
  }
  console.log(`${recordedAt}  ${sent} de ${sensors.length} lecturas enviadas.`);
}

// Si una vuelta tarda mas que el intervalo, se salta la siguiente en vez de
// amontonarlas.
let running = false;
async function safeTick() {
  if (running) {
    console.error('La vuelta anterior no ha acabado: me salto esta.');
    return;
  }
  running = true;
  try {
    await tick();
  } finally {
    running = false;
  }
}

console.log(`Simulador en marcha: una lectura de cada sensor cada ${INTERVAL_MS / 1000} s, por ${API_URL}.`);
console.log('Ctrl+C para parar.');
const timer = setInterval(safeTick, INTERVAL_MS);
safeTick();

// Ctrl+C: se apaga el reloj y se despide, para no dejar nada a medias.
process.on('SIGINT', () => {
  clearInterval(timer);
  console.log('Simulador parado.');
  process.exit(0);
});

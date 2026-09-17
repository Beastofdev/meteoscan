import { defineConfig, devices } from '@playwright/test';

// Las pruebas del panel, contra la aplicacion de verdad (decision 0020): la
// base y la API las levanta check_panel.sh; el panel, compilado, lo levanta
// este fichero.
//
//   bash frontend/check_panel.sh
const PANEL_PORT = 5177;   // el del panel (CONTRIBUTING)
const BASE_URL = `http://localhost:${PANEL_PORT}`;

export default defineConfig({
  testDir: './test',
  // En serie: todas las pruebas comparten una sola base y una sola API, igual
  // que las de la API con --test-concurrency=1.
  workers: 1,
  fullyParallel: false,
  // En GitHub se reintenta una vez: una prueba de navegador puede fallar por
  // una casualidad de tiempos. En local no, para que un fallo se vea entero.
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    // Cuando algo falla, la captura y el rastro de lo que hizo el navegador:
    // sin eso, un fallo en GitHub es una frase sin contexto.
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // El panel COMPILADO, servido como se publicaria. vite preview hereda el
  // proxy del servidor de desarrollo, asi que /api sigue llegando a la API.
  webServer: {
    command: `npm run build && npx vite preview --port ${PANEL_PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

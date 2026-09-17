# 0020 · Las pruebas del panel

**Estado:** vigente
**Fecha:** 2026-09-17 · **Decide:** Carlos

## El problema

La API tiene 25 pruebas y el esquema 42; el panel no tenía ninguna. Todo lo que
ve quien usa MeteoScan —que la alerta se encienda, que un alta repetida ponga el
error bajo su campo, que la pantalla se refresque sola— se comprobaba a mano, y
lo que se comprueba a mano se deja de comprobar.

No está en los requisitos: entra porque un panel sin pruebas es la parte más
fácil de romper sin enterarse.

## Lo que se decidió

- **Playwright 1.63**, que abre un navegador de verdad y usa la pantalla como la
  usaría una persona.
- **Contra la aplicación entera**: un PostgreSQL de usar y tirar en el 5439, la
  API en el 8005 y **el panel compilado** servido en el 5177. Se prueba también
  el proxy y el contrato real de la API.
- **Los fallos que no se pueden provocar, simulados**: la API que deja de
  contestar se finge desde el navegador, interceptando la petición.
- **Solo Chromium.**
- **Siete pruebas**: la lista, el alta con su error repetido, la baja con su
  confirmación, la alerta —y que la humedad no avisa nunca—, el detalle con el
  gráfico y la vuelta atrás, el refresco solo, y la API caída.
  *(La octava, la de la línea plana, entró con la
  [0024](0024-el-tramo-en-alerta-del-grafico.md); la novena, la del foco, con la
  [0025](0025-el-foco-va-al-campo-que-falla.md).)*
- **De una en una** (`workers: 1`), porque comparten una base y una API, igual
  que las de la API con `--test-concurrency=1`.
- **Al fallar, captura y rastro**; y **un reintento solo en GitHub**, donde una
  prueba de navegador puede fallar por una casualidad de tiempos.
- **`frontend/check_panel.sh`**, hermano de `backend/check_api.sh`, y **una
  línea en `check.sh`**: la lista pasa a cinco.

## Lo que se descartó, y por qué

- **Simular toda la API** desde el navegador. Las pruebas correrían sin Docker y
  en un instante, pero el panel podría pasarlas todas y fallar contra la API de
  verdad: no se probarían ni el proxy ni la forma real de las respuestas.
- **Pruebas de unidad de los componentes** (con jsdom y una librería de
  pruebas de React). Comprueban piezas sueltas en un navegador fingido; aquí lo
  que importa es que el conjunto funcione, y para eso ya está el navegador de
  verdad.
- **El servidor de desarrollo en vez del panel compilado.** La recarga en
  caliente y la transformación al vuelo no aportan nada a una prueba, y lo que
  se publica es lo compilado.
- **Probar también en Firefox y WebKit.** Triplicaría la descarga y el tiempo
  para ver lo mismo: el panel no usa nada que dependa del navegador.
- **En paralelo.** Con una sola base, dos pruebas a la vez se pisan.

## Lo que cuesta

- **El navegador ocupa unos 700 MB** en el ordenador de quien las corra, y se
  baja con `npx playwright install chromium`.
- **`check.sh` tarda más** —unos 20 segundos más— y ahora exige también que el
  **5177 esté libre**: el panel de desarrollo tiene que estar parado.
- **En GitHub**, un paso más que descarga el navegador, cerca de un minuto. No
  cuesta dinero: el repositorio es público.
- **Las pruebas que esperan al refresco tardan lo que tarda el refresco**: cinco
  segundos cada una.

## Dónde vive en el código

- `frontend/playwright.config.js` — el navegador, el panel compilado y qué se
  guarda cuando algo falla.
- `frontend/test/panel.spec.js` — las pruebas.
- `frontend/check_panel.sh` — levanta la base, la API y el panel, y lo destruye
  todo al acabar.
- `check.sh` y `.github/workflows/checks.yml` — la línea que las mete en la
  lista, y la descarga del navegador en GitHub.

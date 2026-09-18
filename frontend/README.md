# El panel

El panel web: lista los sensores con su último valor, da de alta y de baja,
dibuja el histórico de cada uno y avisa cuando un valor pasa de su umbral.
**Cómo arrancarlo**, en el [README de la raíz](../README.md).

## Qué hay aquí

| | |
|---|---|
| `src/main.jsx` | Arranca React sobre `index.html` |
| `src/App.jsx` | Las rutas: la lista, el detalle y «esta página no existe» |
| `src/pages/SensorsPage.jsx` | La pantalla principal: el alta y la lista, que se refresca sola |
| `src/pages/SensorDetailPage.jsx` | El detalle de un sensor, con su gráfico |
| `src/components/` | La tarjeta, la lista, el formulario y el gráfico |
| `src/api.js` | Las llamadas a la API, y la traducción de sus errores |
| `src/format.js` | Números, horas y cuándo un sensor está en alerta |
| `src/sensorTypes.js` | Los códigos de la API traducidos: `temperature` → «Temperatura» |
| `src/index.css` | Las variables del sistema visual: color, letra, espaciado y radios. Cada pieza tiene además su propio fichero de estilos |
| `vite.config.js` | El puerto 5177 y el proxy: lo que el panel pide a `/api` acaba en la API |
| `test/panel.spec.js` | Las 9 pruebas, en un navegador de verdad |
| `playwright.config.js` | Cómo se compila y se sirve el panel para probarlo |
| `check_panel.sh` | Las levanta contra la API y el panel compilado |
| `check_types.mjs` | Comprueba que los tipos de aquí son los de la base |
| `public/favicon.svg` | El icono de la pestaña. Lo que hay en `public/` se copia tal cual al compilar |
| `Dockerfile`, `nginx.conf` | La imagen del panel, y el nginx que lo sirve |

En total, unas 800 líneas de código y 500 de estilos.

## Por dónde empezar a leer

1. **`src/App.jsx`** (41 líneas): qué pantallas hay y en qué dirección vive cada
   una.
2. **`src/pages/SensorsPage.jsx`** (76): el patrón que se repite en todo el
   panel —pedir a la API, los tres estados, y el refresco encadenado—.
3. **`src/api.js`** (75): el único sitio que habla con la API.

El porqué está en la [0012](../docs/decisiones/0012-el-panel-con-react.md) y en
las cuatro que le siguen, hasta la
[0019](../docs/decisiones/0019-la-alerta-y-el-refresco.md); el aspecto, en la
[0022](../docs/decisiones/0022-el-sistema-visual-del-panel.md).

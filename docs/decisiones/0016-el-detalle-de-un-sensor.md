# 0016 · El detalle de un sensor

**Estado:** vigente
**Fecha:** 2026-09-17 · **Decide:** Carlos

## El problema

Los requisitos piden una «vista de detalle de un sensor con gráfico de evolución
de sus lecturas (usar recharts o chart.js)». Es la segunda pantalla del panel,
y trae varias preguntas a la vez: cómo se pasa de una pantalla a otra, con qué
se dibuja el gráfico, de dónde salen los datos del sensor —la API no tiene
`GET /sensores/:id`— y cómo se enseñan las horas, que la API da en UTC.

Y una que apareció al probar: la dirección natural del detalle,
`/sensores/<id>`, empieza como las rutas de la API. El proxy del servidor de
desarrollo ([0012](0012-el-panel-con-react.md)) reenviaba a la API todo lo que
empezaba por `/sensores`, así que navegar al detalle funcionaba, pero **al
recargar la página la contestaba la API**, con un `404` en JSON en lugar del
panel.

## Lo que se decidió

- **Una pantalla propia, no un modal**, con su dirección: `/sensores/<id>`. El
  nombre de cada tarjeta es un enlace, y el detalle tiene «← Volver a la
  lista».
- **React Router 8, en su modo declarativo**: `<BrowserRouter>`, `<Routes>`,
  `<Route>`, `<Link>` y `useParams`. Una dirección que no es de ninguna pantalla
  dice «Esta página no existe».
- **Lo que el panel pide a la API va por `/api`**, y el proxy quita el prefijo
  al reenviarlo: `/api/sensores` llega a la API como `/sensores`. Todo lo demás
  es del panel. La API no cambia.
- **El gráfico, con recharts**: una línea de las últimas lecturas, con la hora
  en el eje X repartida según el tiempo real entre lecturas.
- **Los datos del sensor salen de `GET /sensores`**, buscando su id, y las
  lecturas de `GET /sensores/:id/lecturas`, a la vez.
- **Las horas, en la zona del navegador y en formato español.** Las marcas del
  eje llevan segundos si las lecturas cubren media hora o menos, solo horas y
  minutos si cubren un día o menos, y también el día si cubren más.
- **Sin refresco automático**: el detalle pide las lecturas al abrirse. Cada
  cuánto se refresca la pantalla se decide con la alerta del umbral.

## Lo que se descartó, y por qué

- **Un modal sobre la lista.** El gráfico es lo principal del detalle y
  necesita espacio; y un modal obliga a resolver lo que una pantalla ya trae —la
  tecla Escape, el foco, que la lista de detrás no se desplace—, y aún más si
  debe tener dirección propia.
- **Guardar en el estado qué sensor se está mirando, sin rutas.** Sin
  dependencia, pero al recargar se vuelve a la lista, el botón de atrás sale del
  panel y no hay enlace que compartir.
- **Rutas hechas a mano** con `#/…`. Código propio para lo que resuelve una
  librería que cualquiera reconoce.
- **Llamar `/sensor/<id>` al detalle**, sin tocar el proxy. Evita el choque hoy,
  pero deja una regla escondida: ninguna dirección del panel podría empezar
  nunca por `/sensores` ni por `/lecturas`.
- **chart.js con react-chartjs-2.** Dibuja en un lienzo, que aguanta mejor
  decenas de miles de puntos, pero aquí son mil como mucho. Se configura con un
  objeto en lugar de con componentes, son dos paquetes, y su eje de fechas
  *«requires both a date library and a corresponding adapter to be present»*:
  dos más.
- **Pasar el sensor desde la lista**, que ya lo tiene. Al recargar el detalle o
  abrir un enlace no hay lista.
- **Añadir `GET /sensores/:id` a la API.** Fuera de los requisitos, por algo que
  resuelve la ruta que ya hay.
- **Las horas en UTC.** Obligan a sumar de cabeza.
- **Una sola forma de escribir la hora en el eje.** Con horas y minutos, unas
  lecturas de tres minutos repetían la misma marca seis veces seguidas; con
  segundos siempre, un histórico de un día sería ilegible.

## Lo que cuesta

- **El panel pesa más**: el JavaScript pasa de 221 kB (69 kB comprimido) a
  617 kB (184 kB), casi todo por recharts, que trae dentro otras librerías.
  Vite avisa al compilar de que pasa de 500 kB. Si llegara a importar, el
  detalle se podría cargar solo al abrirlo.
- **La 0012 cambia en un punto**: descartó reescribir la ruta en el proxy
  porque no ganaba nada, y ahora gana que panel y API no compartan direcciones.
- **Al publicar el panel**, el servidor que lo sirva tendrá que hacer dos cosas
  que hoy hace Vite: pasar `/api` a la API y devolver el panel en cualquier otra
  dirección, para que recargar `/sensores/<id>` funcione.
- **El detalle pide la lista entera** para encontrar un sensor.
- **Las lecturas no se actualizan solas**, y el eje muestra el tramo que cubren
  las últimas mil, sea el que sea: el tramo a pedir sigue en
  [`pendiente.md`](../pendiente.md).

## Dónde vive en el código

- `frontend/src/App.jsx` — las rutas.
- `frontend/src/main.jsx` — `<BrowserRouter>`.
- `frontend/src/pages/SensorDetailPage.jsx` — el detalle, sus datos y sus
  estados.
- `frontend/src/pages/SensorsPage.jsx` — la lista y el alta, que antes estaban
  en `App.jsx`.
- `frontend/src/components/ReadingsChart.jsx` — el gráfico y el formato de las
  horas.
- `frontend/vite.config.js` y `frontend/src/api.js` — el prefijo `/api`.
- `frontend/src/components/SensorCard.jsx` — el enlace al detalle.

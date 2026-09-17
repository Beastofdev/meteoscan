# 0012 · El panel con React y Vite

**Estado:** vigente, salvo el proxy: desde la
[0016](0016-el-detalle-de-un-sensor.md), las llamadas a la API van por `/api`
**Fecha:** 2026-09-16 · **Decide:** Carlos

## El problema

Los requisitos piden un panel web que liste los sensores, dibuje la evolución
de sus lecturas, permita darlos de alta y avise cuando un valor pasa de su
umbral. El panel no habla con PostgreSQL: todo lo pide a la API del paso 2.

Eso abre cuatro preguntas antes de escribir la primera línea: con qué se
construye, en qué puerto vive, cómo alcanza a una API que está en otro puerto,
y si hace falta una librería de rutas desde el principio.

## Lo que se decidió

- **React 19.3 con Vite 8.3**, plantilla de JavaScript.
- **El panel en el 5177**, con `strictPort`, y **la API en el 8005**, como
  manda `CONTRIBUTING.md`.
- **El proxy del servidor de desarrollo**: `/sensores` y `/lecturas` se
  reenvían a `http://127.0.0.1:8005`. La API no cambia. *(Sustituido por la
  [0016](0016-el-detalle-de-un-sensor.md): el proxy reenvía `/api` y quita el
  prefijo.)*
- **Sin librería de rutas** mientras no haya una segunda pantalla. *(Llegó
  con el detalle: [0016](0016-el-detalle-de-un-sensor.md).)*
- **El revisor de código que trae la plantilla** (oxlint), con sus reglas de
  hooks de React, sin añadir configuración propia por ahora.

## Lo que se descartó, y por qué

- **CORS en la API** en vez del proxy. Habría que abrir la API a un origen
  concreto para resolver algo que solo ocurre mientras se desarrolla: en
  producción el panel se sirve como ficheros estáticos y el problema
  desaparece. El proxy deja ese apaño donde pertenece, en la configuración del
  panel, y la API se queda igual de cerrada.
- **Reescribir la ruta en el proxy** (`/api/sensores` → `/sensores`). Los
  nombres ya coinciden a los dos lados; una reescritura sería una diferencia
  que memorizar sin ganar nada. *(Con el detalle sí ganó algo: que las
  direcciones del panel no choquen con las de la API. Ver la
  [0016](0016-el-detalle-de-un-sensor.md).)*
- **El puerto por defecto de Vite (5173)**, ocupado por otro servicio de la
  máquina. Y sin `strictPort`, Vite se muda solo al siguiente puerto libre: un
  panel que aparece en un puerto ajeno es peor que uno que no arranca y lo
  dice.
- **TypeScript**. Aporta tipos donde hoy el riesgo está en otra parte, y no
  está en los requisitos. La API es JavaScript; el panel, también.
- **`react-router` desde el principio**. Es lo estándar en cuanto haya una
  vista de detalle, y probablemente entre entonces. Instalarlo hoy sería
  configurar navegación entre una sola pantalla.
- **Una librería de estilos**. Los requisitos piden una alerta visible y un
  gráfico; CSS normal llega, y se ve lo que hace cada regla.

## Lo que cuesta

- **El proxy solo existe en desarrollo.** El día que el panel se publique
  habrá que servirlo detrás del mismo origen que la API, o abrir CORS
  entonces. Está escrito aquí para que no se descubra por sorpresa.
- **Dos gestores de dependencias**, uno en `backend/` y otro en `frontend/`,
  cada uno con su `package-lock.json`.
- **Cuando la API está caída**, el proxy responde `502` y el panel enseña su
  aviso de error. Es el comportamiento buscado, pero significa que el panel
  nunca distingue «la API está apagada» de «la API falló»: solo sabe que no
  hubo respuesta buena.

## Dónde vive en el código

- `frontend/vite.config.js` — el puerto, `strictPort` y el proxy.
- `frontend/src/App.jsx` — la pantalla, y los tres estados de una consulta a
  la API: sin respuesta, error y datos.
- `frontend/src/main.jsx` — el arranque de React sobre `index.html`.

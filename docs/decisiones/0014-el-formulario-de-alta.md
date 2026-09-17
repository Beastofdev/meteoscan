# 0014 · El formulario de alta

**Estado:** vigente
**Fecha:** 2026-09-17 · **Decide:** Carlos

## El problema

Los requisitos piden un «formulario para dar de alta un sensor nuevo».
`POST /sensores` recibe tres textos —`name`, `sensor_type` y `location`— y ya
comprueba todo: que estén, que no estén en blanco, su longitud, que el nombre
no esté repetido entre los sensores en servicio y que el tipo exista. Casi todos
sus errores dicen a qué campo se refieren
([0009](0009-los-errores-de-la-api.md)).

Quedaban abiertas cinco preguntas: de dónde sale la lista de tipos, que ninguna
ruta de los requisitos da; cómo se manejan los campos; quién valida; dónde se
pone el formulario; y qué pasa después del alta.

## Lo que se decidió

- **Los tipos del desplegable salen de `sensorTypes.js`**, la lista que el
  panel ya tenía para traducirlos ([0013](0013-la-lista-de-sensores.md)).
- **Campos controlados**: lo escrito vive en el estado, y el envío lo hace
  `onSubmit` con `preventDefault()`.
- **El panel no valida.** Manda lo escrito y muestra el mensaje de la API bajo el
  campo que indica `field`; los errores sin campo —API parada, sin conexión—,
  encima del formulario. Lo escrito se conserva para corregirlo.
- **El formulario, siempre visible encima de la lista.**
- **Tras el alta**: los campos se vacían, una línea confirma el nombre del
  sensor, y la lista se vuelve a pedir a la API.
- **Mientras se envía**, el botón se desactiva y dice «Dando de alta…».

## Lo que se descartó, y por qué

- **Una ruta nueva, `GET /tipos`.** Sería una sola fuente, pero es una ruta
  fuera de los requisitos, con sus pruebas, y no evitaría la lista del panel:
  la base no guarda «Temperatura», y la traducción seguiría haciendo falta. Con
  la lista que ya existía, el formulario no añade ninguna copia.
- **Un campo de texto libre para el tipo.** Obliga a saberse `pm25`, y cada
  errata acaba en un `400`.
- **Sacar los tipos de los sensores existentes.** Con la base vacía no habría
  opciones, y no se podría dar de alta el primero.
- **`<form action={...}>` de React 19.** Necesita menos código, pero su
  documentación dice que *«after the action function succeeds, all uncontrolled
  field elements in the form are reset»*, y que si la función lanza un error se
  muestra el *error boundary*. Para enseñar un `409` junto a su campo, la
  función no puede lanzar, así que termina «bien» y vacía los campos justo
  cuando hay que corregirlos.
- **Validar también en el panel con `required` y `maxLength`.** Sería una tercera
  copia de las reglas, después de la base y la API, y no contaría igual: HTML
  mide la longitud en *code units* (un emoji cuenta dos) y la API, en caracteres.
  Además, esos avisos salen con el estilo y en el idioma del navegador.
- **Un botón que despliega el formulario.** Más limpio a la vista, pero más
  estado y más código, y se puede añadir después.
- **Una página aparte para el alta.** Necesita rutas, que se deciden con la
  vista de detalle.
- **Añadir a la lista el sensor que devuelve el alta**, sin volver a pedirla.
  Ahorra una petición, pero el orden lo tendría que calcular el navegador, con
  reglas distintas a las de la base: la lista podría cambiar de orden al
  recargar.

## Lo que cuesta

- **Si `sensorTypes.js` se queda atrás de la base**, al formulario le falta una
  opción. No puede crear un tipo que no existe, porque la base lo rechaza. La
  comprobación de que las dos listas coinciden está en
  [`pendiente.md`](../pendiente.md).
- **Cada error se ve solo después de enviar**: nada avisa mientras se escribe
  un nombre demasiado largo.
- **Un alta cuesta dos peticiones**: el `POST` y el `GET` de la lista.
- **El error y la confirmación se quedan hasta el siguiente envío**, aunque se
  corrija el campo.

## Dónde vive en el código

- `frontend/src/components/SensorForm.jsx` — los campos, el envío y dónde se
  muestra cada error.
- `frontend/src/api.js` — `createSensor`, y `field` en `ApiError`.
- `frontend/src/sensorTypes.js` — `SENSOR_TYPE_CODES`.
- `frontend/src/App.jsx` — `listVersion`, que vuelve a pedir la lista tras un
  alta.

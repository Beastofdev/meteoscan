# 0015 · La baja desde el panel

**Estado:** vigente
**Fecha:** 2026-09-17 · **Decide:** Carlos

## El problema

Las «vistas necesarias» de la [especificación](../especificacion.md) son la
lista, el detalle con el gráfico, el formulario de alta y la alerta: ninguna da
de baja un sensor. Pero la API tiene `DELETE /sensores/:id`, y la misma
especificación empieza diciendo que los sensores son *«visualizadas y
gestionadas desde un panel web»*. Sin un botón, dar de baja un sensor solo se
podría hacer desde una terminal.

Y una baja no se deshace: la API no tiene ninguna ruta para devolver un sensor
al servicio ([0006](0006-el-diseno-de-la-base-de-datos.md)).

## Lo que se decidió

- **La baja entra en el panel**: un botón «Dar de baja» en cada tarjeta.
- **Se confirma dentro de la propia tarjeta**: el botón da paso a una pregunta
  que dice lo que ocurre —deja de aceptar lecturas y conserva las que tiene—,
  con «Sí» y «No».
- **«Dar de baja», no «Eliminar»**: no se borra nada.
- **Tras la baja, la lista se vuelve a pedir**, igual que tras un alta
  ([0014](0014-el-formulario-de-alta.md)).
- **Un `404` hace lo mismo que una baja buena**: significa que el sensor ya
  estaba de baja, desde otra pestaña o con un doble clic, y lo que se quería ya
  ha pasado. Cualquier otro error se muestra en la tarjeta, que se queda para
  reintentar.
- **Mientras se envía**, los dos botones se bloquean y «Sí» dice «Dando de
  baja…». Si la baja va bien, siguen bloqueados hasta que la lista nueva quita
  la tarjeta.
- **La API contesta `204` sin cuerpo**, y `api.js` no intenta leerlo.

## Lo que se descartó, y por qué

- **Dejar la baja fuera** por no estar en la lista de vistas. La ruta existe, la
  especificación habla de gestionar, y sin ella el panel da de alta pero no
  deja quitar.
- **Sin confirmación.** Un clic sin querer no tiene vuelta atrás.
- **`window.confirm()`.** Es una línea, pero abre una ventana del navegador que
  no se puede adaptar ni en aspecto ni en botones, y congela la página mientras
  está abierta.
- **Una ventana modal con `<dialog>`.** Más código —abrirla, cerrarla, adónde
  vuelve el foco— para una acción de una tarjeta.
- **Quitar la tarjeta sin volver a pedir la lista.** Aquí sería válido: quitar no
  desordena, al contrario que añadir. Pero serían dos formas de poner la lista
  al día en lugar de una, a cambio de una petición.
- **Enseñar el `404` como error.** Diría «No hay ningún sensor con ese id» sobre
  una tarjeta que, en la base, ya está como el usuario quería.

## Lo que cuesta

- **La función de aviso atraviesa `SensorList`**, que no la usa y solo la pasa a
  cada tarjeta. Con dos niveles es razonable; con más, habría que mirar otra
  forma de compartirla.
- **Un `404` por un id mal formado** se trataría igual que uno ya dado de baja.
  Desde el panel no puede pasar: el id sale siempre de la propia API.
- **Si la baja va bien pero la lista no llega** —la API cae justo después—, la
  pantalla pasa al error general y la tarjeta desaparece con el resto.

## Dónde vive en el código

- `frontend/src/components/SensorCard.jsx` — el botón, la pregunta, su estado y
  el tratamiento del `404`.
- `frontend/src/api.js` — `retireSensor`, y el `204` sin cuerpo.
- `frontend/src/components/SensorList.jsx` y `frontend/src/App.jsx` — el aviso,
  de la tarjeta a `refreshList`.

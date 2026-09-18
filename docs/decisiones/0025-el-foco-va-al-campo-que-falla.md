# 0025 · El foco va al campo que falla

**Estado:** vigente
**Fecha:** 2026-09-18 · **Decide:** Carlos

## El problema

Cuando el alta falla, el campo se pone rojo y el motivo aparece debajo
([0023](0023-el-formulario-se-anuncia.md)). Pero el foco se queda en el botón de
enviar, que es donde lo dejó quien pulsó. Para corregir hay que volver al campo,
y con el teclado eso es tantear: ¿era el primero, el segundo o el tercero?

La 0023 dejó esto fuera diciendo que tenía «más aristas: dónde lo devuelves, qué
pasa si hay dos errores». **Una de las dos no existe**: el formulario guarda un
solo error —un objeto con un único campo— y la API contesta de uno en uno. Lo
que quedaba por decidir era solo lo primero.

## Lo que se decidió

- **El foco va al campo que la API señala**, en cuanto llega su error.
- **En un efecto que mira el error, no dentro del envío.** Los campos están
  siempre en el documento, así que enfocar justo después de guardar el error
  también funcionaría; pero llegaría **antes** de que el mensaje esté puesto, y
  el campo aún no apuntaría a él con `aria-describedby`. El lector de pantalla
  diría «no válido» sin decir por qué.
- **Un `Map` de campo a referencia**, no un objeto: en un objeto, un campo que
  llegara llamándose `constructor` encontraría algo que no es una referencia. Es
  la misma razón por la que los tipos de sensor se traducen con un `Map`.
- **Con un error que no es de ningún campo** —la API que no contesta— **el foco
  no se mueve.** No hay adónde llevarlo, y el mensaje ya se anuncia solo por su
  `role="alert"`. Llevarlo a un sitio cualquiera sería peor que dejarlo quieto.

## Lo que se descartó, y por qué

- **Enfocar dentro de `handleSubmit`**, en la misma línea que guarda el error. Se
  lee mejor, y es justo el orden equivocado: el foco llegaría al campo antes de
  que exista el mensaje al que el campo apunta.
- **Mover el foco también con un error general**, a la cabecera del formulario o
  al propio mensaje. Un salto que no lleva a nada que se pueda corregir.
- **`autoFocus`**. Sirve para cuando algo aparece por primera vez, no para
  volver a un campo que ya estaba ahí.

## Lo que cuesta

- **Mover el foco es quitárselo a quien lo tenga.** Aquí el botón se deshabilita
  mientras se envía, así que quien pulsó sigue en el formulario; en una pantalla
  donde se pudiera seguir trabajando durante el envío, esto habría que pensarlo
  otra vez.
- **Tres referencias más** en un componente que ya tenía seis estados.

## Dónde vive en el código

- `frontend/src/components/SensorForm.jsx` — las referencias y el efecto.
- `frontend/test/panel.spec.js` — la novena prueba, que se vio fallar sin el
  efecto: `Expected: focused, Received: inactive`.

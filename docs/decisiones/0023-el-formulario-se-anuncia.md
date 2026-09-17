# 0023 · El formulario se anuncia

**Estado:** vigente
**Fecha:** 2026-09-17 · **Decide:** Carlos

## El problema

Cuando el alta falla, el formulario pinta el campo de rojo y escribe el motivo
debajo. Eso vale para quien mira la pantalla. Para quien la escucha, no había
nada: el lector de pantalla leía un campo de texto cualquiera y, en otro
momento, una frase suelta. Nada decía que el campo estuviera mal, y nada unía
la frase con el campo del que habla.

La [0022](0022-el-sistema-visual-del-panel.md) lo dejó apuntado como lo que
costaba, porque cerrarlo era tocar el marcado y aquella decisión era solo de
estilos. Esta lo cierra.

## Lo que se decidió

- **`aria-invalid` en el campo que ha fallado**, y solo en ese. Es lo que hace
  que el lector diga «no válido» al llegar a él.
- **`aria-describedby` apuntando al mensaje**, que ahora lleva un `id`
  (`sensor-name-error`, `sensor-type-error`, `sensor-location-error`). Así el
  motivo se lee **con el campo**, no como una frase suelta.
- **`role="alert"` en el mensaje.** El error llega después de enviar, cuando el
  foco está en el botón: sin esto, quien no ve la pantalla no se entera de que
  ha pasado algo hasta que vuelve al campo a tientas.
- **Los atributos no están cuando no hay error**, en vez de un
  `aria-invalid="false"` permanente. Un atributo que dice «esto está bien» es
  ruido en cada lectura.
- **El rojo sale ahora de ese mismo atributo**: `input[aria-invalid="true"]`, en
  vez del `:has(~ .sensor-form-error)` de la 0022. Lo que se ve y lo que se oye
  salen del mismo sitio, así que no pueden separarse sin querer.

## Lo que se descartó, y por qué

- **Dejarlo solo en el CSS**, como estaba. Funciona para el ojo y no existe para
  todo lo demás; y el selector dependía de la forma del documento —«el campo al
  que le sigue un mensaje»—, así que mover el mensaje de sitio habría apagado el
  rojo sin que nadie se enterase.
- **Un resumen de errores en la cabecera del formulario**, al estilo de los
  formularios largos. Aquí hay tres campos y la API contesta con un error cada
  vez: un resumen repetiría la única frase que ya está donde tiene que estar.
- **`aria-invalid="false"` en los campos correctos.** Es válido, pero convierte
  cada recorrido del formulario en una retahíla de «válido, válido, válido».

## Lo que cuesta

- **Tres atributos por campo** en un formulario de tres campos: el componente
  crece, y el error de cada campo pasa a guardarse en una constante porque se
  usa tres veces.
- **El foco no se mueve al campo que ha fallado.** Es el siguiente paso
  razonable de accesibilidad y no entra aquí: mover el foco por su cuenta es una
  decisión con más aristas —dónde lo devuelves, qué pasa si hay dos errores— que
  merece pensarse aparte.
  *(Hecho en la [0025](0025-el-foco-va-al-campo-que-falla.md). De las dos
  aristas, la de los dos errores no existía: el formulario guarda uno solo.)*

## Dónde vive en el código

- `frontend/src/components/SensorForm.jsx` — los atributos, y `FieldError` con
  su `id` y su `role`.
- `frontend/src/components/SensorForm.css` — el borde rojo, colgado del
  atributo.

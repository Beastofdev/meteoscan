# 0019 · La alerta en el panel, y el refresco

**Estado:** vigente
**Fecha:** 2026-09-17 · **Decide:** Carlos

## El problema

Los requisitos piden un «indicador visual de alerta si un valor supera un
umbral». Los umbrales ya están en la base ([0017](0017-los-umbrales-de-alerta.md))
y `GET /sensores` trae el umbral y la última lectura de cada sensor
([0018](0018-el-ultimo-valor-en-la-lista.md)). Falta enseñarlo.

Y una alerta que no se actualiza no avisa de nada: hasta ahora el panel pedía
los datos una vez, al abrirse.

## Lo que se decidió

- **Cada tarjeta enseña su última lectura**: el valor con su unidad, en grande, y
  la hora en que se midió. Sin lecturas, «Sin lecturas».
- **Por encima del umbral**: el borde de la tarjeta y el valor en rojo, **y un
  texto**, «Por encima de 35 °C».
- **El detalle, igual**, y además **una línea horizontal discontinua en el
  umbral**, con su etiqueta, dentro del gráfico.
- **Un tipo sin umbral nunca está en alerta**, y su gráfico no lleva línea.
- **La pantalla se refresca sola cada cinco segundos**, el ritmo del simulador
  ([0010](0010-el-simulador.md)), tanto la lista como el detalle.
- **El siguiente viaje sale cuando ha vuelto el anterior**, no cada cinco
  segundos pase lo que pase.
- **Si un refresco falla y ya había datos en pantalla**, se quedan, y aparece un
  aviso: «No se pudo actualizar…». Solo cuando no hay nada que enseñar ocupa el
  error toda la pantalla.
- **El gráfico, sin animación de entrada**, porque se volvería a dibujar entero
  en cada refresco.

## Lo que se descartó, y por qué

- **Marcar la alerta solo con el color.** Quien no distingue el rojo no vería
  nada: de ahí el texto, que además dice de cuánto es el umbral.
- **La alerta solo en el detalle.** La lista es la vista de conjunto, y es donde
  hay que ver de un vistazo qué sensor está fuera de rango.
- **Recargar a mano.** Una alerta que hay que ir a buscar no es una alerta.
- **Un reloj fijo (`setInterval`) cada cinco segundos.** Si la API tarda más que
  eso, las peticiones se amontonan.
- **Que la API avise al panel** (*WebSockets* o *server-sent events*). Sería
  inmediato y ahorraría peticiones, pero cambia la API a fondo y no está en los
  requisitos.
- **Vaciar la pantalla cuando falla un refresco.** Un fallo de un segundo
  borraría datos que siguen siendo buenos.

## Lo que cuesta

- **Una petición cada cinco segundos por panel abierto**, también si la pestaña
  está de fondo. Con tres sensores es una consulta corta
  ([0018](0018-el-ultimo-valor-en-la-lista.md)); con muchos paneles abiertos
  habría que mirarlo.
- **Un sensor que dejó de enviar sigue enseñando su última lectura**, y su
  alerta si la tenía. Por eso al lado va la hora.
- **La comparación la hace el panel**: otro cliente de la API tendría que
  hacerla por su cuenta, aunque la API le dé los dos datos.
- **Cinco segundos de retraso como mucho** entre la lectura y el aviso.

## Dónde vive en el código

- `frontend/src/format.js` — `isOverThreshold`, y cómo se escriben números y
  horas.
- `frontend/src/components/SensorCard.jsx` — la lectura y la alerta en la
  tarjeta.
- `frontend/src/pages/SensorDetailPage.jsx` — la alerta en el detalle.
- `frontend/src/components/ReadingsChart.jsx` — la línea del umbral.
- `frontend/src/pages/SensorsPage.jsx` y `SensorDetailPage.jsx` — el refresco
  encadenado y qué se enseña cuando falla.

# 0024 · El tramo en alerta del gráfico

**Estado:** vigente
**Fecha:** 2026-09-17 · **Decide:** Carlos

## El problema

El histórico dibujaba una línea de un solo color y, cruzándola, la línea
discontinua del umbral. Para saber qué parte del rato estuvo el sensor pasado
había que seguir la línea con el dedo y compararla con la discontinua. En la
lista y en el detalle, pasar del umbral se ve de cuatro maneras
([0022](0022-el-sistema-visual-del-panel.md)); en el gráfico, que es donde se
mira la evolución, no se veía de ninguna.

La 0022 lo dejó fuera por una razón concreta: **no es CSS**. recharts dibuja la
serie como un único trazo, y un trazo tiene un color.

## Lo que se decidió

**Sigue siendo un solo trazo, y el color se lo da un degradado vertical con dos
paradas en el mismo punto**: cambia de golpe, sin mezcla. Es el mecanismo del
propio SVG, no un apaño.

- **Dónde cae el corte** lo dice la caja de la propia línea, que es lo que mide
  un degradado en unidades de objeto: arriba está la lectura más alta y abajo la
  más baja, así que la parte en alerta es `(máximo - umbral) / (máximo -
  mínimo)`. Cero si el umbral queda en el máximo o por encima —igualar el umbral
  no es pasarlo, como en la [0017](0017-los-umbrales-de-alerta.md)—, y uno si
  queda en el mínimo o por debajo.
- **Los colores los pone el CSS**, con `stop-color` sobre las dos paradas: la
  paleta sigue viviendo en un solo sitio.
- **El color de la línea ya no se declara en el CSS.** Una regla de CSS le gana
  al atributo del SVG, así que un `stroke` ahí dejaría el degradado sin efecto.
  El fichero de estilos lo dice en un comentario, porque es justo el tipo de
  línea que alguien «arregla» al verla vacía.
- **Con todas las lecturas iguales no hay degradado.** Una línea plana no tiene
  alto, y un degradado medido sobre una caja sin alto no se dibuja: el navegador
  deja la línea **sin pintar**. Ese caso lleva la clase `readings-chart-flat` y
  el color vuelve al CSS.
- **Un `id` propio por gráfico**, con `useId`: dos degradados con el mismo
  nombre serían el mismo degradado.
- **Dos pruebas**: que al cruzar el umbral la línea se pinta con el degradado y
  que su parada de arriba es el color de alerta; y que con todas las lecturas
  iguales la línea sigue teniendo color.

## Lo que se descartó, y por qué

- **Dos series, una por debajo y otra por encima**, con huecos donde no toca. Es
  lo primero que se le ocurre a cualquiera, y por eso está escrito aquí: obliga
  a **inventar puntos** donde la línea cruza el umbral —si no, el color cambia
  en la lectura siguiente y no en el cruce— y deja dos series donde hay una, con
  lo que el recuadro flotante pasa a enseñar dos valores.
- **Que la línea engorde por encima del umbral**, como se dibujó al pensar el
  aspecto. Un trazo tiene un grosor; variarlo cuesta lo mismo que partirlo en
  dos series. El tramo alto ya se distingue por dónde está respecto de la
  discontinua, que sigue ahí con su etiqueta.
- **Pintar de rojo el fondo por encima del umbral.** Competiría con la línea y
  con el borde rojo de la propia tarjeta, y el gráfico dejaría de leerse.

## Lo que cuesta

- **El color de la línea ya no está donde están los demás colores**: la parte
  que decide vive en el componente. Es el precio de que sea un solo trazo.
- **La prueba de la línea plana no puede usar `toBeVisible`**: Playwright da por
  no visible todo lo que mide cero de alto, y una línea horizontal lo mide. Se
  comprueba que existe y con qué color se pinta, que es lo que estaba en juego.
- **Un identificador más por gráfico**, que no se ve pero está en el HTML.

## Dónde vive en el código

- `frontend/src/components/ReadingsChart.jsx` — el reparto y el degradado.
- `frontend/src/components/ReadingsChart.css` — las dos paradas, y la línea
  plana.
- `frontend/test/panel.spec.js` — las dos pruebas.

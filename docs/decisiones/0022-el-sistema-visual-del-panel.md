# 0022 · El sistema visual del panel

**Estado:** vigente
**Fecha:** 2026-09-17 · **Decide:** Carlos

## El problema

El panel se leía bien, pero sus valores estaban puestos de uno en uno: seis
colores elegidos a ojo, cuatro tamaños de letra que no seguían ninguna escala,
huecos entre 0,25 y 1,25 rem según la pieza, y dos radios distintos sin criterio
de cuál tocaba. Eso no se ve en una pantalla; se ve al añadir la siguiente, que
no hay a qué agarrarse y cada componente vuelve a decidirlo todo.

Y dos cosas sí se veían. El foco del teclado era el que trae el navegador por
defecto, que sobre una tarjeta blanca casi no se distingue. Y la alerta —lo
único que este panel existe para enseñar— se apoyaba en el color y en una
frase, sin ninguna forma que la separase del resto.

## Lo que se decidió

Un sistema de variables en `index.css`, y los seis ficheros de cada pieza
tirando de él. **Solo CSS: no se tocó el marcado**, así que las siete pruebas
del panel siguen valiendo tal cual.

- **Los seis colores que ya había, ahora medidos.** Texto 13,7:1 sobre el fondo,
  secundario 6,0:1, alerta 6,6:1 sobre blanco. La norma de accesibilidad AA pide
  4,5:1 para el texto. El borde se queda en 1,3:1, y de ahí sale su regla: solo
  separa cajas y nunca lleva texto encima.
- **Ningún color más.** Sin verde de «correcto» y sin azul de marca: un sensor
  normal es gris y uno en alerta es rojo, así que cualquier mancha de color en
  la pantalla significa que algo pasa. No hay un tercer estado que aprender.
- **Espaciado en múltiplos de 4 px**, y el número del nombre dice cuántos:
  `--space-4` son 16 px. Dentro de una tarjeta no se pasa de 20; los 32 se
  guardan para separar bloques de pantalla.
- **Seis pasos de tipografía** sobre una base de 16 px: 13 para píldoras y ejes
  del gráfico, 14 para horas, etiquetas y errores, 16 el cuerpo, 18 el nombre de
  un sensor, 24 el último valor en la lista y 28 el título y el valor del
  detalle. Los saltos son amplios a propósito: una jerarquía que hay que
  comparar para notarla no es una jerarquía.
- **Dos radios y una píldora**, con una regla que se dice en una frase: el
  contenedor siempre más redondeado que el control que lleva dentro.
- **Cifras de ancho fijo** (`font-variant-numeric: tabular-nums`) en los valores.
  La lista se refresca cada cinco segundos, y con las cifras normales —el 1 es
  más estrecho que el 8— el número se movía en cada cambio.
- **El foco del teclado, visible**: un `outline` de 2 px en el color del texto,
  separado 2 px. Se ve sobre el blanco de una tarjeta y sobre el rojo de un
  botón de confirmación, sin añadir un color nuevo.
- **La alerta, con cuatro señales**: el borde de la tarjeta, el valor en rojo,
  una píldora con el límite y un triángulo delante. Ninguna de las cuatro es
  solo el color.
- **El mismo triángulo en todo lo que va mal**: la píldora del umbral, el error
  bajo un campo, el fallo de una baja y el aviso de que la API no contesta. El
  mismo signo significa lo mismo en todo el panel.
- **La fuente del sistema**, como hasta ahora: no se descarga, así que no hay
  salto de texto al cargar ni una dependencia de red en un panel que puede vivir
  en una máquina sin salida a internet.

## Lo que se descartó, y por qué

- **Una librería de componentes, o un framework de clases de utilidad.** El
  panel entero son 483 líneas de CSS repartidas en siete ficheros, uno por
  pieza; cualquiera de las dos cosas pesaría más que lo que viene a resolver, y
  dejaría el aspecto del panel escrito en una documentación ajena en vez de en
  el repositorio.
- **Un tema oscuro de sala de control.** Luce más en una captura, pero se lee
  peor en la pantalla de cualquier portátil, obliga a repintar el gráfico entero
  y duplica los sitios donde hay que volver a medir el contraste.
- **Poner las píldoras en mayúsculas con `text-transform`.** Convertiría
  «µg/m³» en algo que ya no es la unidad que mide el sensor. Si alguna vez hace
  falta un rótulo en mayúsculas, se escribe en mayúsculas.
- **Marcar el campo que ha fallado desde el componente**, con una clase o un
  atributo. El CSS puede preguntarlo solo: `:has(~ .sensor-form-error)` señala
  al campo al que le sigue un mensaje de error, que es exactamente donde lo pone
  el formulario. Cero cambios en el marcado.
  *(Sustituido por la [0023](0023-el-formulario-se-anuncia.md): al añadir el
  `aria-invalid` que aquí faltaba, el selector dejó de hacer falta.)*
- **Que la línea del gráfico cambie de color al cruzar el umbral.** Es lo más
  vistoso que se puede hacer aquí, y es lo único que no es CSS: recharts dibuja
  la serie como un solo trazo, así que teñir un tramo pide partir los datos o
  meter un degradado. Queda fuera de esta decisión, no descartado.
  *(Hecho en la [0024](0024-el-tramo-en-alerta-del-grafico.md), con el
  degradado.)*

## Lo que cuesta

- **`:has()` necesita un navegador reciente** (Chrome 105, Safari 15.4, Firefox
  121; todos de 2022 o 2023). En uno anterior, el campo con error no se pone
  rojo —el mensaje sigue ahí, con su triángulo—, que es el fallo bueno.
- **El campo con error no lleva `aria-invalid`**, porque eso sí sería tocar el
  marcado: un lector de pantalla lee el mensaje, pero no anuncia el campo como
  inválido. Queda apuntado.
  *(Cerrado en la [0023](0023-el-formulario-se-anuncia.md).)*
- **El triángulo va en hexadecimal** (`\25B2`) y no como carácter, para que los
  siete ficheros de estilo sigan siendo ASCII y ninguna herramienta los estropee
  por el camino. Se lee peor en el código, y por eso lleva su comentario.
- **138 líneas más de CSS**, de 345 a 483. Casi todo son comentarios y el bloque
  de variables: las reglas nuevas son pocas.

## Dónde vive en el código

- `frontend/src/index.css` — las variables, la base de la página y el foco.
- `frontend/src/App.css` — la separación entre bloques y la línea de estado.
- `frontend/src/components/SensorCard.css` — la tarjeta, el valor y la píldora.
- `frontend/src/components/SensorForm.css` — el formulario, y el campo en rojo
  (que desde la [0023](0023-el-formulario-se-anuncia.md) cuelga del atributo que
  lo anuncia).
- `frontend/src/components/SensorList.css`,
  `frontend/src/components/ReadingsChart.css` y
  `frontend/src/pages/SensorDetailPage.css` — la rejilla, el gráfico y el
  detalle.

# 0003 · El vocabulario no se inventa

**Estado:** vigente
**Fecha:** 2026-09-11 · **Decide:** Carlos

## El problema

Una lista cerrada —los tipos de sensor, sus unidades— se rellena fácil con lo
que suena razonable. Y el daño no se ve: **un valor plausible es indistinguible
de uno comprobado una vez está en el fichero**, así que nadie vuelve a mirarlo.

Aquí mismo hubo un caso. Los requisitos dicen «calidad del aire», pero no qué se
mide —CO₂, partículas PM2.5, un índice—, y cada opción tiene su unidad y sus
umbrales. Rellenarlo con la primera que sonara bien habría dejado en el esquema
una decisión que nadie tomó.

## Lo que se decidió

Los valores de una lista cerrada —tipos de sensor, unidades, estados— salen de
uno de estos tres sitios, y de ningún otro:

1. **Los [requisitos](../especificacion.md).**
2. **Un estándar externo, citado.** Por ejemplo, los símbolos de unidad de
   SenML, el formato del IETF para lecturas de sensores
   ([RFC 8428](https://www.rfc-editor.org/rfc/rfc8428), ampliado por la
   [RFC 8798](https://www.rfc-editor.org/rfc/rfc8798)).
3. **Carlos**, como responsable del producto, preguntándole.

Si no hay ninguno de los tres, **se dice y se pregunta**; no se rellena el hueco.

Y cada lista cerrada lleva escrito de dónde salió, en una línea `Fuente:` del
comentario que la acompaña en el esquema.

## Lo que se descartó, y por qué

**Rellenar con lo razonable y corregir después.** No se corrige: nadie vuelve a
mirar un valor que ya está escrito y no rompe nada.

**Deducir los valores de la etiqueta.** «Calidad del aire» parece decir qué se
mide, y no lo dice. Se preguntó, y la respuesta está en la
[0006](0006-el-diseno-de-la-base-de-datos.md).

## Lo que cuesta

Es más lento: a veces, una pregunta por tres palabras. A cambio, cada valor del
esquema tiene detrás una fuente que se puede señalar.

## Dónde vive en el código

- `db/schema.sql` — la línea `Fuente:` de cada lista cerrada, desde el paso 1

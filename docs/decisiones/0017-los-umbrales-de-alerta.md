# 0017 · Los umbrales de alerta

**Estado:** vigente
**Fecha:** 2026-09-17 · **Decide:** Carlos

## El problema

Los requisitos piden un «indicador visual de alerta si un valor supera un
umbral (ej. temperatura > 35 °C en rojo)». Dan un umbral, el de la temperatura,
y ninguno para la humedad ni para la calidad del aire. Y no dicen dónde vive un
umbral: en el tipo de sensor, en cada sensor o en el panel.

Un umbral es un valor que no se inventa
([0003](0003-el-vocabulario-no-se-inventa.md)): o sale de los requisitos, o de
una fuente que se pueda citar.

## Lo que se decidió

- **Temperatura: más de 35 °C**, de los requisitos.
- **PM2.5: más de 35 µg/m³.** Es la norma de 24 horas de la EPA estadounidense.
  Su tabla del índice de calidad del aire de 2024 empieza la categoría
  «perjudicial para grupos sensibles» en 35,5 µg/m³, *«because EPA retained the
  24-hour fine PM standard of 35 micrograms per cubic meter»* ([EPA, Final
  Updates to the Air Quality Index for Particulate
  Matter](https://www.epa.gov/system/files/documents/2024-02/pm-naaqs-air-quality-index-fact-sheet.pdf),
  consultado el 17 de septiembre de 2026).
- **Humedad: sin umbral.** No hay un límite con fuente para la humedad al aire
  libre, y los sensores de MeteoScan están en exteriores.
- **El umbral vive en el tipo de sensor**: una columna `alert_threshold` en
  `sensor_types`, en la unidad del tipo. Vacía, el tipo no tiene alerta.
- **Una lectura está en alerta si su valor es mayor que el umbral**; igual, no:
  «supera», como dicen los requisitos.
- **La base solo admite un número de verdad**: ni `NaN` ni infinitos, con la
  misma regla que el valor de una lectura.

## Lo que se descartó, y por qué

- **Un umbral para la humedad del 60 %.** Es la recomendación de la EPA *para
  interiores* —*«keep indoor humidity below 60 percent»* ([EPA, A Brief Guide to
  Mold, Moisture, and Your
  Home](https://www.epa.gov/mold/brief-guide-mold-moisture-and-your-home))—, por
  el moho. Al aire libre, una humedad por encima del 60 % es corriente y no
  indica ningún problema; con sensores en exteriores, la alerta saltaría sin
  significar nada.
- **Un umbral por sensor.** El formulario de alta necesitaría otro campo, con su
  validación, y el ejemplo de los requisitos es por tipo. Dos sensores del mismo
  tipo con umbrales distintos tampoco significarían lo mismo al verlos juntos.
- **Los umbrales en el panel.** Serían más rápidos de escribir, pero la API y
  cualquier otro cliente no los conocerían, y cambiar uno obligaría a tocar el
  código del panel.
- **`NUMERIC` para el umbral.** Guarda decimales exactos, pero el valor de una
  lectura es `DOUBLE PRECISION`, y umbral y valor se compararían siendo de tipos
  distintos.
- **Alerta también con el valor igual al umbral.** Los requisitos dicen
  «supera».

## Lo que cuesta

- **La norma de la EPA es una media de 24 horas**, y aquí se compara cada
  lectura suelta. Es la misma simplificación que hacen los requisitos con los
  35 °C: una lectura puntual por encima avisa, aunque la media del día no lo
  estuviera.
- **Cambiar un umbral es cambiar el esquema**, y mientras no haya migraciones
  ([`pendiente.md`](../pendiente.md)), cargarlo vacía la base.
- **Todos los sensores de un tipo comparten umbral**, estén donde estén.

## Dónde vive en el código

- `db/schema.sql` — `alert_threshold`, `chk_sensor_types_alert_threshold` y los
  valores de cada tipo, con su fuente.
- `db/checks.sql` — las pruebas del umbral: con él, sin él, `NaN` e infinitos.

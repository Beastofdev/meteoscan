# 0002 · La base de datos impone, no confía

**Estado:** vigente
**Fecha:** 2026-09-11 · **Decide:** Carlos

## El problema

Una regla que vive solo en el código se cumple donde alguien se acordó de
escribirla. Y basta un sitio donde no.

Aquí va a haber, como poco, tres cosas que escriben en la base de datos: la
API, el simulador de sensores y quien abra `psql` para probar algo. Si la regla
«una lectura tiene que ser un número de verdad» vive solo en la API, el
simulador puede saltársela y la base no se entera. Y una lectura mala, una vez
guardada, sale en cada gráfico que la dibuje.

## Lo que se decidió

**Toda regla que se pueda expresar en el motor, se expresa en el motor**: tipos,
`NOT NULL`, `CHECK`, `UNIQUE`, claves ajenas y, cuando nada de eso alcanza, un
disparador.

No **en lugar de** la validación de la API, sino **debajo** de ella. Son dos
capas con dos trabajos distintos:

| Capa | Para qué |
|---|---|
| La API valida en la frontera | Para dar un mensaje bueno —«el nombre no puede estar vacío»— antes de tocar la base |
| La base de datos impone | Para que nada que se salte la API —el simulador, un script, `psql`— pueda escribir un disparate |

## Lo que se descartó, y por qué

**Las reglas solo en la aplicación**, que es lo más habitual: se cumplen donde
se escribieron, y aquí escribe más de uno.

**Las reglas solo en la base de datos.** Entonces los errores los da el motor, y
un `check_violation` no es un mensaje para una persona. La API tiene que validar
igual, para explicar el error; lo que no puede es ser la única que valida.

## Lo que cuesta

- **Rigidez, a propósito.** Cambiar una regla es cambiar el esquema, no un `if`.
- **Traducir.** Los errores del motor —`23505` duplicado, `23503` clave ajena,
  `23514` `CHECK`— hay que convertirlos en respuestas HTTP, y en un solo sitio
  de la API. Es trabajo del paso 2.
- **Dos sitios que dicen lo mismo.** La regla de la API y la del esquema pueden
  separarse con el tiempo. Las pruebas del esquema vigilan la segunda.

## Dónde vive en el código

- `db/schema.sql` — llega con el paso 1
- La validación de la API — llega con el paso 2

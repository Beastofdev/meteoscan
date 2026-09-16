# Cómo se trabaja en este repositorio

Las normas del proyecto. Las que necesitan más explicación la tienen en
[`docs/decisiones/`](docs/decisiones/README.md), y lo que se construye está en
los [requisitos](docs/especificacion.md).

## Antes de cambiar el esquema

- **El diseño se revisa antes de escribirse**, con el DDL entero. Un resumen de
  columnas es donde se esconde el error.
- **Las alternativas se comparan antes de elegir**, y las descartadas quedan
  escritas en su decisión. «Es lo que ya hay» desempata; no es un argumento.
- **Los valores de una lista cerrada no se inventan.** Salen de los requisitos,
  de un estándar citado o del responsable del producto, y cada lista lleva su
  línea `Fuente:`. Ver
  [0003](docs/decisiones/0003-el-vocabulario-no-se-inventa.md).
- **Una tabla nueva copia el patrón de una que ya exista**, entero.
- **Una regla no se afloja porque un dato futuro no la cumpliría.** Un dato que
  no encaja se resuelve al recibirlo, no abriendo la columna.

Las convenciones de nombres del esquema, y cómo se carga, están en
[`db/README.md`](db/README.md).

## La API

- **Consultas siempre parametrizadas** (`$1`, `$2`…), nunca texto pegado a mano:
  por ahí entra la inyección SQL.
- **Validar en la frontera, con la base de datos debajo.** La API valida cada
  entrada en un solo sitio antes de tocar la base, para dar un mensaje claro; el
  esquema es la red, no el sustituto. Ver
  [0002](docs/decisiones/0002-la-base-de-datos-impone.md).
- **Errores con un código estable además del mensaje**: el mensaje es para las
  personas, el código para los programas. La forma y la lista de códigos, en la
  [0009](docs/decisiones/0009-los-errores-de-la-api.md).
- **Los errores del motor no son para el usuario.** Un `23505`, un `23503`, un
  `23001` —borrar algo que otra fila usa— o un `23514` se traducen a una
  respuesta HTTP, y en un solo sitio.
- **Una operación de negocio, una transacción.**

## Comprobar

```
bash check.sh                 # todas las comprobaciones: la única lista
node docs/check_docs.mjs      # solo la documentación
bash db/check_all.sh          # solo el esquema; hace falta Docker en marcha
bash backend/check_api.sh     # solo la API; hace falta Docker, npm install y el 8005 libre
```

Las corre un hook antes de cada push, y GitHub Actions en cada push. El hook
**se activa una vez por clon** —`.git/hooks` no se versiona, y git no activa
`core.hooksPath` por su cuenta, a propósito—:

```
git config core.hooksPath .githooks
```

Para saltárselo a sabiendas: `git push --no-verify`. Ver
[0005](docs/decisiones/0005-comprobaciones-en-local-y-en-ci.md).

- **Nunca sobre la base de desarrollo, ni sobre un contenedor reutilizado.** Ver
  [0004](docs/decisiones/0004-toda-comprobacion-sobre-entorno-limpio.md).
- **Cada rechazo tiene que venir por la restricción que dice su etiqueta**, y eso
  se comprueba leyendo el error, no contando.
- **«Verificado» solo si se ha corrido.** Y si un resultado sale idéntico al de
  antes de un cambio grande, se sospecha del método antes que del cambio.

### Una comprobación nueva se ve fallar una vez

Al escribir una regla nueva —un comprobador, una restricción, una prueba— **se
rompe a propósito una vez**, se mira que salte **nombrando lo que se rompió**, y
se deshace la rotura.

Una comprobación en verde tiene dos causas que se ven **idénticas**: que no haya
nada mal, o que no esté mirando. La segunda no da error nunca. Por eso los
comprobadores de aquí **dicen a cuántas cosas miraron**, y mirar a cero es un
fallo por sí solo.

## Puertos locales

| Puerto | Qué |
|---|---|
| 5438 | PostgreSQL de desarrollo |
| 5439 | PostgreSQL de usar y tirar, solo para las comprobaciones |
| 8005 | La API (Express) |
| 5177 | El panel (Vite) |

Vite arranca en el 5173 si no se le dice otra cosa: en su configuración va
`port: 5177` con `strictPort: true`, para que falle en vez de irse a otro
puerto con una línea de aviso fácil de pasar por alto.

## Credenciales

`.env` no se sube nunca. Se sube `.env.example`, con los nombres de las
variables y sin valores reales: el repositorio es público, y un secreto subido
una vez se queda en el historial aunque se borre después.

## Commits

Un commit por pieza —una tabla, un endpoint, un componente—, con
[Conventional Commits](https://www.conventionalcommits.org/) en castellano:

```
tipo(ámbito): lo que se hizo, en una línea

Qué se decidió y contra qué alternativa: lo que el diff no dice.
```

- `tipo`: `feat` (algo nuevo que funciona), `fix`, `docs`, `test`, `refactor`,
  y `chore` para lo que no cambia el comportamiento —configuración,
  herramientas—.
- `ámbito`: `db`, `api`, `simulador`, `panel`, `docs`.
- El cuerpo cuenta **qué se decidió y contra qué alternativa**. Es lo único que
  el diff no dice.
- Antes de cada commit, `bash check.sh` en verde.

## Cómo se escribe

- Prosa **en castellano**. En los `.md`, castellano normal. En los `.sql` y en
  lo que se imprime por terminal —`check.sh`, el hook, los comprobadores—, **sin
  acentos ni ñ**, y con `---` donde iría una raya: una consola de Windows o un
  `psql` con otra codificación los convierten en basura.
- **En inglés**: nombres de tabla, columna, restricción e índice; variables,
  funciones, componentes y ficheros de código; los literales de una lista
  cerrada; y los campos de un estándar externo. Los documentos llevan el nombre
  en castellano, como lo que cuentan.
- Los comentarios explican **por qué**, no qué. El qué ya está en la línea de al
  lado.

## Dónde va cada cosa

| Qué es | Dónde |
|---|---|
| Qué hace el proyecto, cómo se arranca y en qué paso va | `README.md` |
| Lo que hay que construir | `docs/especificacion.md` |
| Cómo funciona una tabla o una columna | Comentario en `db/schema.sql`, pegado a ella |
| Por qué el proyecto es así, y qué se descartó | `docs/decisiones/`, con su índice |
| Lo que se hará más adelante | `docs/pendiente.md` |
| Una comprobación nueva | Su guion, y una línea en `check.sh` |

**Una regla que un programa puede comprobar acaba en un programa.** Mientras no
se haya incumplido nunca, basta con escribirla; la primera vez que se incumple,
pasa a un comprobador y a `check.sh`, porque ha demostrado que la memoria no
alcanza. Y si una regla de aquí choca con lo que hace el código, se dice: o el
código se ha desviado, o la regla se quedó vieja, y las dos cosas hay que
arreglarlas.

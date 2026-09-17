# La base de datos

| Fichero | Qué es |
|---|---|
| [`schema.sql`](schema.sql) | El esquema: las tres tablas, sus reglas y el disparador. El porqué de cada cosa está en la [0006](../docs/decisiones/0006-el-diseno-de-la-base-de-datos.md) |
| [`checks.sql`](checks.sql) | Sus pruebas: lo que tiene que entrar, y lo que tiene que saltar y por qué regla |
| [`check_all.sh`](check_all.sh) | Pasa las pruebas sobre un PostgreSQL de usar y tirar |

## Cargar el esquema

**Vacía la base**: cada tabla se tira y se vuelve a crear. Con datos simulados
es lo que se quiere; antes de guardar datos de verdad hacen falta migraciones
([`pendiente.md`](../docs/pendiente.md)).

La **primera vez** no hace falta: con la base recién creada, Docker carga este
mismo fichero solo ([0021](../docs/decisiones/0021-docker-para-levantarlo-todo.md)).
Esta orden es para volver a empezar de cero cuando ya existe.

Con la base arrancada (`docker compose up -d`) y desde la raíz del proyecto.
En bash (Linux, macOS o Git Bash):

```
docker compose exec -T db psql -U meteoscan -v ON_ERROR_STOP=1 < db/schema.sql
```

En PowerShell, que no tiene `<`:

```
Get-Content db/schema.sql | docker compose exec -T db psql -U meteoscan -v ON_ERROR_STOP=1
```

- `-T`: sin terminal interactiva, para que el fichero llegue a `psql`.
- `-v ON_ERROR_STOP=1`: se para en el primer error. Sin esto, `psql` sigue
  adelante y un error se pierde entre el resto.

Los `.sql` no llevan acentos: Windows PowerShell 5.1 pasa el texto por la
tubería en ASCII, y una tilde llegaría como `?`.

## Probar el esquema

```
bash db/check_all.sh
```

Crea un PostgreSQL de usar y tirar en el 5439, carga el esquema, pasa las
pruebas y lo destruye al acabar, pase lo que pase. Nunca toca la base de
desarrollo ([0004](../docs/decisiones/0004-toda-comprobacion-sobre-entorno-limpio.md)).
Hace falta Docker en marcha, y también lo corre `bash check.sh`.

Cada prueba compara el código del error y el nombre de su regla, no el texto
del mensaje: una frase puede cambiar de una versión a otra.

## Los nombres

Todo en inglés y en `snake_case` (minúsculas y guiones bajos). El nombre de cada
regla sale en el error que la hace saltar: así se sabe qué regla fue, y la API
puede traducir cada error por su nombre.

| Qué | Patrón | Ejemplo |
|---|---|---|
| Tabla | En plural | `sensor_types`, `readings` |
| Columna | En singular | `name`, `sensor_type` |
| Fecha y hora | `TIMESTAMPTZ`, acabada en `_at` | `created_at`, `retired_at` |
| Clave primaria | La nombra PostgreSQL: `<tabla>_pkey` | `sensors_pkey` |
| Clave ajena | `fk_<tabla>_<columna>` | `fk_readings_sensor_id` |
| Regla `CHECK` | `chk_<tabla>_<columna>` | `chk_sensors_name` |
| Unicidad | `uq_<tabla>_<lo que no se repite>` | `uq_readings_sensor_recorded` |
| Índice | `idx_<tabla>_<columna>` | `idx_sensors_sensor_type` |
| Disparador | `<tabla>_<lo que comprueba>` | `readings_sensor_in_service` |
| Función de un disparador | `trigger_` y el nombre del disparador | `trigger_readings_sensor_in_service` |

El error de un disparador empieza por su nombre y lo lleva también en
`CONSTRAINT`, con el código de un `CHECK` (`23514`): así se trata igual que el
de una restricción.

## Una tabla nueva

Copia el patrón de las que ya hay, entero, como pide
[CONTRIBUTING](../CONTRIBUTING.md):

- Empieza por `DROP TABLE IF EXISTS <tabla> CASCADE;`, para que el fichero se
  pueda cargar dos veces. Las funciones van con `CREATE OR REPLACE`.
- Va detrás de las tablas a las que apunta: una clave ajena no puede apuntar a
  una tabla que todavía no existe.
- Cada regla nueva lleva su prueba en `checks.sql`, y se ve fallar una vez.

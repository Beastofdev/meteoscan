# La base de datos

| Fichero | Qué es |
|---|---|
| [`schema.sql`](schema.sql) | El esquema: las tres tablas, sus reglas y el disparador. El porqué de cada cosa está en la [0006](../docs/decisiones/0006-el-diseno-de-la-base-de-datos.md) |

## Cargar el esquema

**Vacía la base**: cada tabla se tira y se vuelve a crear. Con datos simulados
es lo que se quiere; antes de guardar datos de verdad hacen falta migraciones
([`pendiente.md`](../docs/pendiente.md)).

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

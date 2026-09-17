# 0007 · La base de desarrollo, en Docker

**Estado:** vigente; el mismo `compose.yaml` levanta además el sistema entero con
el perfil `completo` ([0021](0021-docker-para-levantarlo-todo.md))
**Fecha:** 2026-09-12 · **Decide:** Carlos

## El problema

La API necesita un PostgreSQL al que conectarse, y quien clone el proyecto
tiene que poder levantar el mismo: la misma versión, en el mismo puerto y con la
misma configuración. Hay tres cosas que decidir: dónde corre, qué versión, y a
quién queda abierto.

Lo último no es obvio. Si no se le dice otra cosa, Docker publica el puerto en
todas las conexiones de red del ordenador, y su propia documentación lo llama
«inseguro por defecto».

## Lo que se decidió

**PostgreSQL 18, en un contenedor descrito en [`compose.yaml`](../../compose.yaml),
con el puerto 5438 abierto solo para el propio ordenador (`127.0.0.1`)**, y los
datos en un volumen con nombre. Se levanta con `docker compose up -d`.

- La imagen es `postgres:18`: fija la versión mayor, no la menor.
- La contraseña sale del `.env`, y si falta o está vacía, Compose no arranca
  (ver [`.env.example`](../../.env.example)).

## Lo que se descartó, y por qué

**PostgreSQL instalado en el sistema.** Es uno para todo el ordenador, con la
versión que haya, y su configuración no viaja con el repositorio.

**La 17.** Ya estaba descargada, y el diseño de la
[0006](0006-el-diseno-de-la-base-de-datos.md) se probó sobre ella. Pero eso es
lo que ya había, no un argumento: la 18 recibe arreglos un año más (hasta
noviembre de 2030, frente a noviembre de 2029), y el diseño no usa nada que la
18 no tenga. Lo más reciente que usa, `gen_random_uuid()`, existe desde la 13.

**La 19.** El 12 de septiembre de 2026 iba por la beta 3, que el propio
proyecto desaconseja fuera de pruebas, y de una beta a la siguiente puede hacer
falta migrar los datos. **Tampoco esperar a la definitiva**, prevista para
septiembre u octubre: serían semanas parados, por un cambio que aquí cuesta
poco hacer después.

**El puerto sin IP** (`"5438:5432"`). Dejaría la base al alcance de la red
local, y todo lo que se conecta a ella corre en el mismo ordenador.

**`postgres:18.6`, la versión exacta.** Todo el mundo tendría la misma, pero
cada arreglo de seguridad obligaría a editar el fichero, cada tres meses. Las
menores no cambian el formato de los datos, y PostgreSQL recomienda estar
siempre en la última.

**`docker-compose.yml`.** Es el nombre antiguo. Docker prefiere `compose.yaml`
y mantiene el otro por compatibilidad.

## Lo que cuesta

- **Hace falta Docker** para levantar la base.
- **Cada máquina tiene la 18.x que descargó** hasta que hace
  `docker compose pull`, porque Docker no la actualiza solo. Dos máquinas pueden
  tener menores distintas: son compatibles, pero un fallo ya arreglado en una
  puede verse en la otra.
- **Desde la 18, la imagen guarda los datos en `/var/lib/postgresql/18/docker`**,
  y el volumen va en `/var/lib/postgresql`. Los ejemplos escritos para la 17 lo
  montan en `/var/lib/postgresql/data`, y en la 18 eso dejaría los datos fuera
  del volumen.
- **Usuario, base y contraseña solo cuentan al crear el volumen.** Si se cambian
  después en el `.env`, no cambia nada hasta borrar el volumen.
- **Cambiar de versión mayor no es cambiar una línea.** Los datos de una mayor
  no los abre la siguiente. Con datos simulados, se borra el volumen
  (`docker compose down -v`) y se vuelve a cargar el esquema; con datos de
  verdad, haría falta `pg_upgrade`, o volcarlos y restaurarlos.

## Dónde vive en el código

- [`compose.yaml`](../../compose.yaml) — la imagen, el puerto y el volumen
- [`.env.example`](../../.env.example) — la variable de la contraseña
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — el 5438, en la tabla de puertos

## Fuentes

Consultadas el 12 de septiembre de 2026: la
[política de versiones](https://www.postgresql.org/support/versioning/) y el
[calendario](https://www.postgresql.org/developer/roadmap/) de PostgreSQL; la
documentación de Docker sobre
[publicar puertos](https://docs.docker.com/engine/network/port-publishing/) y
sobre [el nombre del fichero](https://docs.docker.com/compose/intro/compose-application-model/);
y la de la [imagen oficial de PostgreSQL](https://github.com/docker-library/docs/blob/master/postgres/content.md).

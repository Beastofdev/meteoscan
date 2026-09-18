# 0021 · Docker para levantarlo todo

**Estado:** vigente
**Fecha:** 2026-09-17 · **Decide:** Carlos

## El problema

Docker solo llevaba la base de datos ([0007](0007-la-base-de-desarrollo-en-docker.md)).
La API, el panel y el simulador se arrancaban a mano, cada uno en su terminal,
con Node instalado en la máquina. Para ver MeteoScan funcionando hacían falta
cuatro pasos y las herramientas correctas.

Y quedaba un cabo suelto de la [0016](0016-el-detalle-de-un-sensor.md): el
proxy que lleva `/api` a la API **solo existe mientras se desarrolla**, igual
que la respuesta que devuelve el panel al recargar en `/sensores/<id>`. Al
publicarlo, eso lo tiene que hacer alguien.

## Lo que se decidió

- **Un perfil en el mismo `compose.yaml`**: `docker compose up -d` sigue
  levantando solo la base, y
  `docker compose --profile completo up -d --build` levanta **base, API, panel y
  simulador**.
- **La API, en una imagen de Node** con solo sus dependencias de producción, sin
  npm por medio y con el usuario sin privilegios que trae la imagen oficial.
- **El panel, en dos partes**: se compila con Node y **lo sirve nginx**. La
  imagen final no lleva Node ni las dependencias del panel.
- **nginx hace las dos cosas que hacía Vite**: reenvía `/api` a la API quitando
  el prefijo, y devuelve el panel en cualquier otra dirección, para que recargar
  en `/sensores/<id>` funcione.
- **La API escucha en la dirección que diga `HOST`**, con `127.0.0.1` por
  defecto. El compose la pone a `0.0.0.0` **solo dentro del contenedor**.
- **Los puertos de siempre**: 5438, 8005 y 5177.
- **El esquema se carga solo la primera vez**, montándolo donde PostgreSQL
  ejecuta lo que encuentra al crear la base.
- **Cada servicio con puerto dice si está bien** (`healthcheck`), y el que
  depende de él espera a eso, no a que su contenedor exista:
  - la base, con `pg_isready`, y la API espera;
  - la API, preguntando a su propio `/health` desde dentro, y el simulador
    espera —antes mandaba su primera lectura contra una API que aún no
    escuchaba, y esa vuelta se iba en errores de conexión—;
  - el panel, pidiéndole la página a su nginx.

  Las dos últimas se preguntan con el `wget` que ya traen las imágenes: en
  `node:24-alpine` **no hay `curl`**, y no se instala nada para una sonda.

  Y hay que saber **qué pregunta esa sonda**: con la base parada, la API sale
  como `unhealthy` aunque su proceso esté perfectamente. Es «¿puedo atender?»,
  no «¿estoy vivo?». Docker no reinicia nada por eso; si algún día decidiera
  reinicios algo por encima, esta no sería la sonda con la que decidirlos.
  Comprobado el 18/09: con `docker compose stop db`, la API tarda 30 segundos
  —tres intentos de diez— en darse por `unhealthy`, y 12 en volver a
  `healthy` cuando la base arranca.
- **El simulador es un servicio más**, con la misma imagen que la API y otra
  orden.

## Lo que se descartó, y por qué

- **Servir el panel con `vite preview`.** Arrastraría Node y las dependencias de
  desarrollo para servir cuatro ficheros estáticos.
- **Un segundo fichero `compose.completo.yaml`.** Dos ficheros que describen el
  mismo sistema acaban separándose.
- **Meter los servicios sin perfil.** Cambiaría lo que hace hoy
  `docker compose up -d`, que el README documenta.
- **`network_mode: host`** para no tocar la dirección de escucha. En Linux
  funcionaría; en Windows y en Mac, no: el «levántalo con una orden» valdría
  solo en un sistema.
- **Dejar la API escuchando siempre en `127.0.0.1`.** Dentro de un contenedor
  eso significa «solo yo»: ni el panel ni la máquina llegarían.
- **Puertos nuevos para el modo Docker.** La tabla de `CONTRIBUTING.md` no tiene
  libres, y cada puerto nuevo es un choque en potencia con otro proyecto.
- **Construir las imágenes en `check.sh` y en GitHub.** Son minutos en cada
  pasada para algo que cambia poco. En su lugar, una comprobación que solo lee
  el `compose.yaml` y lista los servicios que entiende: falla si el fichero está
  roto, sin construir ni levantar nada.

## Lo que cuesta

- **No se puede tener a la vez el modo Docker y el de desarrollo**: se pelearían
  por el 8005 y el 5177.
- **Dos formas de arrancar que mantener.** Una variable nueva de la API hay que
  ponerla también en el `compose.yaml`.
- **Espacio**: la imagen de la API ocupa 248 MB y la del panel, 103 MB. La API y
  el simulador comparten la suya.
- **Las imágenes no se comprueban solas**: nada avisa si un `Dockerfile` deja de
  construir, porque construirlas en cada pasada son minutos. Lo que sí se
  comprueba, y cuesta un segundo, es que el `compose.yaml` se entienda: está en
  `check.sh`.
- **La 0008 gana una excepción**: la API ya no escucha siempre en `127.0.0.1`,
  aunque sigue siendo lo que hace por defecto.

## Dónde vive en el código

- `compose.yaml` — el perfil `completo`, el `healthcheck`, el esquema que se
  carga solo y las variables de cada servicio.
- `backend/Dockerfile` y `backend/.dockerignore` — la imagen de la API y del
  simulador.
- `frontend/Dockerfile`, `frontend/nginx.conf` y `frontend/.dockerignore` — el
  panel compilado y servido por nginx.
- `backend/src/server.js` — `HOST`, con `127.0.0.1` por defecto.
- `check.sh` — la comprobación de que el `compose.yaml` se entiende.

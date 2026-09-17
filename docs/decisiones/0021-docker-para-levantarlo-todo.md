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
- **La base avisa de cuándo está lista** (`healthcheck`), y la API espera a eso.
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
  pasada para algo que cambia poco.

## Lo que cuesta

- **No se puede tener a la vez el modo Docker y el de desarrollo**: se pelearían
  por el 8005 y el 5177.
- **Dos formas de arrancar que mantener.** Una variable nueva de la API hay que
  ponerla también en el `compose.yaml`.
- **Espacio**: la imagen de la API ocupa 248 MB y la del panel, 103 MB. La API y
  el simulador comparten la suya.
- **Las imágenes no se comprueban solas**: nada avisa si un `Dockerfile` deja de
  construir, porque no entra en `check.sh`.
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

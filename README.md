# MeteoScan

Panel de monitorización de sensores —un mini SCADA web—. Una red simulada de
sensores de temperatura, humedad y calidad del aire envía lecturas cada pocos
segundos, y un panel web las lista, dibuja su evolución y avisa cuando un valor
pasa de su umbral.

> **En construcción.** Este README se completa al final. Hoy dice qué hay, qué
> falta y cómo comprobarlo.

## Stack

| | |
|---|---|
| API | Node.js + Express |
| Base de datos | PostgreSQL |
| Panel | React con Vite |
| Integración continua | GitHub Actions |

## Estado

- [x] **Paso 0** — estructura, normas y registro de decisiones
- [x] **Paso 1** — base de datos: el esquema en
  [`db/schema.sql`](db/schema.sql)
  ([0006](docs/decisiones/0006-el-diseno-de-la-base-de-datos.md)), PostgreSQL en
  Docker ([0007](docs/decisiones/0007-la-base-de-desarrollo-en-docker.md)) y
  sus pruebas en [`db/checks.sql`](db/checks.sql)
- [ ] **Paso 2** — API con Express, y el simulador de sensores
- [ ] **Paso 3** — panel con React
- [ ] README final

## Cómo está organizado

```
db/                  el esquema y sus pruebas                   (paso 1)
backend/             la API con Express y el simulador          (paso 2)
frontend/            el panel con React                         (paso 3)
docs/                los requisitos, las decisiones y lo aparcado
compose.yaml         la base de datos de desarrollo, en Docker
.env.example         las variables que hay que copiar a .env
CONTRIBUTING.md      las normas del proyecto
check.sh             la única lista de comprobaciones
.githooks/pre-push   las corre antes de cada push
.github/workflows/   las corre en GitHub, en cada push
```

Cada carpeta se crea al llegar a su paso: una carpeta vacía no explica nada.

## Cómo arrancar la base de datos

Hace falta Docker. Una vez por clon, el `.env` a partir de su plantilla, con una
contraseña de letras y números:

```
cp .env.example .env
```

Y para arrancarla, en el puerto 5438 de este ordenador:

```
docker compose up -d
```

El esquema se carga con otra orden, que vacía las tablas: está en
[`db/README.md`](db/README.md).

## Cómo comprobarlo

```
bash check.sh
```

Hace falta Docker en marcha: las pruebas del esquema corren en un PostgreSQL de
usar y tirar.

Y una vez por clon, para que se corra solo antes de cada push:

```
git config core.hooksPath .githooks
```

## Por qué es así

Cada decisión que alguien podría querer deshacer sin saber lo que costó está en
[`docs/decisiones/`](docs/decisiones/README.md), con las alternativas que se
descartaron.

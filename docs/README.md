# Documentación de MeteoScan

Esta carpeta explica **qué se construye** y **por qué** el proyecto es como es.
Lo que hace está en el código; cómo se arranca, en el
[README de la raíz](../README.md); y cómo se trabaja en él, en
[`CONTRIBUTING.md`](../CONTRIBUTING.md).

| | |
|---|---|
| [`especificacion.md`](especificacion.md) | Los requisitos. Lo que no está ahí se propone antes de hacerlo |
| [`decisiones/`](decisiones/README.md) | Una decisión por fichero: el problema, lo que se decidió, **lo que se descartó** y lo que cuesta |
| [`pendiente.md`](pendiente.md) | Lo que se ha visto y se aparca a propósito, con el paso en que se retoma |

## Por dónde empezar

1. Los [requisitos](especificacion.md): lo que se pidió.
2. La [0002](decisiones/0002-la-base-de-datos-impone.md), la postura de la que
   sale todo lo demás, y la [0006](decisiones/0006-el-diseno-de-la-base-de-datos.md),
   el diseño de la base.
3. La [0008](decisiones/0008-la-api-con-express.md) y la
   [0009](decisiones/0009-los-errores-de-la-api.md): la API y sus errores.
4. La [0012](decisiones/0012-el-panel-con-react.md) y la
   [0016](decisiones/0016-el-detalle-de-un-sensor.md): el panel, y el problema de
   direcciones que apareció al probarlo.
5. La [0017](decisiones/0017-los-umbrales-de-alerta.md): de dónde salen los
   umbrales, y por qué la humedad no tiene.

Y si lo que quieres es leer **código**, cada carpeta dice por dónde empezar:
[`backend/`](../backend/README.md), [`frontend/`](../frontend/README.md) y
[`db/`](../db/README.md).

Para saber de dónde salen las normas del proyecto, la
[0001](decisiones/0001-de-donde-salen-las-reglas.md).

## Cómo se añade una decisión

Un fichero nuevo en `decisiones/`, con el número siguiente, y una línea en su
índice. La plantilla está [allí](decisiones/README.md).

Y hay un comprobador, porque una regla que nadie mira se pudre:

```
node docs/check_docs.mjs
```

No comprueba que lo escrito sea verdad —eso no lo puede hacer un programa—.
Comprueba que ningún enlace esté roto ni apunte a algo que no se publica, que
toda decisión esté enlazada en su índice, que ningún número se repita, y que
haya encontrado algo que mirar.

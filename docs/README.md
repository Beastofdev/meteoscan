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

1. Los [requisitos](especificacion.md).
2. La [0001](decisiones/0001-de-donde-salen-las-reglas.md), que cuenta de dónde
   salen las normas del proyecto.
3. La [0006](decisiones/0006-el-diseno-de-la-base-de-datos.md), el diseño de la
   base de datos, y la [0002](decisiones/0002-la-base-de-datos-impone.md), la
   postura de la que sale.

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

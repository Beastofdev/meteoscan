# 0001 · De dónde salen las normas de este proyecto

**Estado:** vigente
**Fecha:** 2026-09-11 · **Decide:** Carlos

## El problema

MeteoScan es un proyecto pequeño, y un proyecto pequeño tiene dos salidas
cómodas. Las dos son malas:

- **Seguir la estructura de un tutorial, sin normas.** Es lo más rápido, y
  también lo que deja un proyecto cuyas razones nadie sabe explicar. Tres meses
  después, nadie recuerda por qué una columna admite nulos o por qué se borra en
  cascada.
- **Montar desde el principio la maquinaria de un proyecto grande**: capas de
  arquitectura, comprobadores para cada convención, herramientas para problemas
  que todavía no existen. Aquí habrá tres tablas, y esa maquinaria enterraría el
  proyecto.

## Lo que se decidió

**Cada norma entra con el problema concreto que evita aquí, y ninguna
herramienta entra antes de que la pida un problema de hoy.**

| Norma | Dónde |
|---|---|
| La base de datos impone, no confía | [0002](0002-la-base-de-datos-impone.md) |
| El vocabulario no se inventa | [0003](0003-el-vocabulario-no-se-inventa.md) |
| Toda comprobación, sobre un entorno limpio | [0004](0004-toda-comprobacion-sobre-entorno-limpio.md) |
| Las comprobaciones, en local y en GitHub Actions, con una sola lista | [0005](0005-comprobaciones-en-local-y-en-ci.md) |
| El diseño se revisa antes de escribirse, y las alternativas se comparan antes de elegir | [`CONTRIBUTING.md`](../../CONTRIBUTING.md) |
| Una comprobación nueva se ve fallar una vez | [`CONTRIBUTING.md`](../../CONTRIBUTING.md) |
| Validar en la frontera, con errores que llevan un código además del mensaje | [`CONTRIBUTING.md`](../../CONTRIBUTING.md) |
| Prosa en castellano, identificadores en inglés | [`CONTRIBUTING.md`](../../CONTRIBUTING.md) |
| Una decisión por fichero, con lo que se descartó | Este directorio |

Cómo se organiza el código de la API —en capas o no— se decide al construirla,
con su propia decisión.

## Lo que se descartó, y por qué

**El tutorial sin normas**, por lo de arriba: un proyecto cuyas decisiones no
están escritas no se puede revisar, ni continuar sin rehacerlo.

**La maquinaria de proyecto grande desde el principio.** Una norma sin el
problema que la justifica es ceremonia, y la ceremonia se abandona a la primera
prisa —llevándose por delante, de paso, las normas que sí importaban—.

## Lo que cuesta

Más documentos de los que lleva un proyecto de este tamaño, y cada paso va más
lento porque se razona y se escribe. Se acepta: un proyecto con sus decisiones
escritas se puede revisar, discutir y continuar.

## Dónde vive en el código

- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — las normas
- Este directorio — el porqué de las que necesitan más explicación

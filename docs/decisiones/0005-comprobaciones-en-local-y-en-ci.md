# 0005 · Comprobaciones en local y en GitHub Actions

**Estado:** vigente
**Fecha:** 2026-09-11 · **Decide:** Carlos

## El problema

Las comprobaciones pueden correr en el ordenador de quien sube, antes de
subir, o en GitHub, después. Lo primero avisa a tiempo, pero depende de cada
máquina y se puede saltar; lo segundo deja constancia, pero llega tarde.

El inconveniente de la integración continua es el coste: en un repositorio
privado, los minutos de GitHub Actions cuentan contra el cupo del plan, y
cuando se agotan no falla una prueba, se para el trabajo. Este repositorio **va
a ser público** —lo decidió Carlos el 11 de septiembre de 2026—, y en uno
público los ordenadores estándar de GitHub Actions son gratis.

Y en un repositorio público hay una razón más: el resultado de las
comprobaciones de cada commit lo ve cualquiera que lo abra, sin clonarlo.

## Lo que se decidió

**Las dos cosas, llamando al mismo guion:**

| | Qué da |
|---|---|
| El hook [`.githooks/pre-push`](../../.githooks/pre-push) | Avisa **antes** de subir, en la máquina de quien sube |
| El workflow [`.github/workflows/checks.yml`](../../.github/workflows/checks.yml) | Deja **constancia** en cada commit y en cada pull request, y lo prueba en Linux |

Los dos llaman a [`check.sh`](../../check.sh), que es **la única lista** de
comprobaciones. Una comprobación nueva se añade allí, y en ningún otro sitio.

## Lo que se descartó, y por qué

**Solo el hook.** Es gratis y avisa antes, pero no deja constancia, solo prueba
en la máquina de quien sube, y se salta con `--no-verify`.

**Solo el workflow.** Te enteras del fallo después de subir, y en el historial
queda un commit en rojo.

**El hook y el workflow, cada uno con su lista.** Dos listas escritas a mano se
separan sin que nadie se entere: el día que se añada una comprobación a una y no
a la otra, la que se quedó corta seguirá en verde sin mirar.

## Lo que cuesta

- **Si el repositorio pasa a privado, los minutos vuelven a contar**, y esta
  decisión hay que volver a mirarla.
- **El hook hay que activarlo una vez por clon**, con
  `git config core.hooksPath .githooks`: `.git/hooks` no se versiona, y git no
  activa un hook por su cuenta —clonar no debe poder ejecutar código de un
  desconocido—.
- **El hook se salta con `git push --no-verify`.** Es deliberado: es un
  despertador, no un control. El control es el workflow.
- **Tiene que ser ejecutable en el índice de git**, y desde Windows no lo es
  solo: `git add --chmod=+x .githooks/pre-push`. En Linux y en macOS, git se
  salta un hook que no lo es, con un aviso que se pierde entre el resto.

## Dónde vive en el código

- [`check.sh`](../../check.sh) — la lista
- [`.githooks/pre-push`](../../.githooks/pre-push) — el aviso antes de subir
- [`.github/workflows/checks.yml`](../../.github/workflows/checks.yml) — la constancia
- [`.gitattributes`](../../.gitattributes) — los finales de línea LF de los
  guiones, sin los que no arrancan en Linux

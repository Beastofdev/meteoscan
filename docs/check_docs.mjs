// Comprueba que la documentacion no se pudre.
//
// Los documentos se estropean igual que el codigo, y antes: un enlace se rompe
// al renombrar un fichero, y nadie lo ve porque ningun programa lo mira.
//
// No comprueba que lo escrito sea verdad --- eso no lo puede hacer un
// programa ---. Comprueba las cosas que si se pueden mirar, y que son justo
// las que se rompen al escribir con prisa:
//
//   1. Ningun enlace relativo apunta a un fichero que no existe.
//   2. Ningun enlace apunta a un fichero que existe pero NO SE PUBLICA.
//   3. Toda decision de docs/decisiones/ esta ENLAZADA en su indice, y todo lo
//      que el indice nombra existe.
//   4. Los ficheros de decision se llaman NNNN-algo.md, y ningun numero se
//      repite: el numero es la unica referencia estable de una decision.
//
// SOLO MIRA LO QUE SE PUBLICA: lo que git subiria, sin lo ignorado en
// .gitignore ni lo excluido en .git/info/exclude. Si mirase tambien lo que no
// se sube, en esta maquina daria por bueno un enlace que en GitHub saldria
// roto, y la comprobacion local y la de GitHub dirian cosas distintas.
//
// Y DICE A CUANTOS MIRO. Cero ficheros y cero decisiones se imprimen igual que
// "todo bien", y no es lo mismo: puede ser una ruta mal escrita que no
// encuentra nada. Aqui mirar a nadie es un fallo por si solo.
//
// Sin dependencias: solo Node y git. Devuelve 1 si hay fallos.
//
//   node docs/check_docs.mjs

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DECISIONS_DIR = 'docs/decisiones/';
const DECISIONS_INDEX = DECISIONS_DIR + 'README.md';

const failures = [];

// Lo que se publica, tal como lo ve git: lo que ya esta en el indice y lo que
// entraria con un "git add .". Rutas con barras normales, relativas a la raiz.
function publishedFiles() {
  try {
    const output = execFileSync(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    // Un fichero borrado del disco sigue en el indice hasta el siguiente
    // commit: si no esta en el disco, no cuenta.
    return new Set(output.split('\0').filter((f) => f && existsSync(join(ROOT, f))));
  } catch (e) {
    failures.push(`no puedo preguntar a git que se publica: ${String(e.message).split('\n')[0]}`);
    return new Set();
  }
}

const PUBLISHED = publishedFiles();

// Una ruta se publica si es un fichero publico, o una carpeta con alguno dentro.
function isPublished(relPath) {
  const trimmed = relPath.replace(/\/+$/, '');
  if (PUBLISHED.has(trimmed)) return true;
  for (const f of PUBLISHED) if (f.startsWith(trimmed + '/')) return true;
  return false;
}

// Todo [texto](ruta) relativo tiene que llevar a algo que tambien se publica.
// Los enlaces a una web y los que solo llevan un ancla (#algo) no se miran.
function checkLinks() {
  const mdFiles = [...PUBLISHED].filter((f) => f.endsWith('.md')).sort();
  let linkCount = 0;
  for (const doc of mdFiles) {
    const text = readFileSync(join(ROOT, doc), 'utf8');
    for (const m of text.matchAll(/\[([^\]]*)\]\(([^)#]+?)(#[^)]*)?\)/g)) {
      const target = m[2];
      if (/^(https?:|mailto:)/.test(target)) continue;
      linkCount++;
      const targetPath = posix.normalize(posix.join(posix.dirname(doc), target));
      if (targetPath.startsWith('../')) {
        failures.push(`${doc}: enlaza fuera del repositorio, a '${target}'`);
      } else if (!existsSync(join(ROOT, targetPath))) {
        failures.push(`${doc}: enlace roto a '${target}'`);
      } else if (!isPublished(targetPath)) {
        failures.push(`${doc}: enlaza a '${target}', que existe pero no se publica`);
      }
    }
  }
  return { docCount: mdFiles.length, linkCount };
}

// Cada decision, enlazada en su indice; cada numero, una sola vez.
function checkDecisions() {
  if (!PUBLISHED.has(DECISIONS_INDEX)) {
    failures.push(`no se publica ${DECISIONS_INDEX}, que es el indice de las decisiones`);
    return 0;
  }
  const index = readFileSync(join(ROOT, DECISIONS_INDEX), 'utf8');
  const files = [...PUBLISHED]
    .filter((f) => f.startsWith(DECISIONS_DIR) && f !== DECISIONS_INDEX && f.endsWith('.md'))
    .map((f) => f.slice(DECISIONS_DIR.length))
    .sort();

  const byNumber = new Map();
  for (const f of files) {
    const m = /^(\d{4})-[a-z0-9-]+\.md$/.exec(f);
    if (!m) {
      failures.push(`decisiones/${f}: no se llama NNNN-algo.md`);
      continue;
    }
    byNumber.set(m[1], [...(byNumber.get(m[1]) ?? []), f]);
    // Enlazada, no solo nombrada: mencionar el fichero en una frase no lo
    // pone en el indice.
    if (!index.includes(`(${f})`)) {
      failures.push(`decisiones/${f}: no esta enlazada en el indice`);
    }
  }

  for (const [number, names] of byNumber) {
    if (names.length > 1) {
      failures.push(`el numero ${number} lo usan ${names.join(' y ')}`);
    }
  }

  // Y al reves: el indice no nombra nada que no exista. Los enlaces rotos ya
  // lo cazarian, pero este mensaje dice mejor que ha pasado.
  for (const m of index.matchAll(/\((\d{4}-[a-z0-9-]+\.md)\)/g)) {
    if (!files.includes(m[1])) {
      failures.push(`el indice nombra decisiones/${m[1]}, que no existe o no se publica`);
    }
  }

  return files.length;
}

const { docCount, linkCount } = checkLinks();
const decisionCount = checkDecisions();

// El denominador. Buscar y no encontrar nada no es lo mismo que todo bien.
if (docCount === 0) failures.push('no encuentro ningun .md que se publique');
if (decisionCount === 0) failures.push('no encuentro ninguna decision que se publique');

console.log('Documentacion (solo lo que se publica)');
console.log();
console.log(`  ${docCount} ficheros .md, con ${linkCount} enlaces relativos`);
console.log(`  ${decisionCount} decisiones`);
console.log();

if (failures.length > 0) {
  console.log(`FALLOS (${failures.length}):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exitCode = 1;
} else {
  console.log('Sin enlaces rotos, sin enlaces a lo que no se publica, sin decisiones sueltas.');
}

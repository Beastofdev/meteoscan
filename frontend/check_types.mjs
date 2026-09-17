// Comprueba que los tipos de sensor del panel son los de la base.
//
// El panel tiene su propia lista de tipos (decision 0014): la necesita para
// traducirlos --- la base guarda 'temperature' y la pantalla dice
// "Temperatura" --- y para el desplegable del alta. Dos listas de lo mismo
// acaban siendo distintas, y la que se queda atras es siempre la del panel: un
// tipo nuevo en la base no sale en el formulario, y nadie se entera hasta que
// alguien lo echa de menos.
//
// LA BASE MANDA. Si no coinciden, esto falla y dice en que direccion.
//
// Y DICE CUANTOS HA MIRADO: cero y cero tambien coinciden, y no prueban nada.
//
// No mira las unidades ni los umbrales: el panel traduce las unidades que
// conoce y ensena tal cual las que no, y los umbrales solo viven en la base.
//
// Sin dependencias: lee el esquema como texto e importa la lista del panel, que
// es la misma que usa el formulario. Devuelve 1 si hay fallos.
//
//   node frontend/check_types.mjs

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SENSOR_TYPE_CODES } from './src/sensorTypes.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA = 'db/schema.sql';
const PANEL = 'frontend/src/sensorTypes.js';

// El INSERT de sensor_types, hasta su punto y coma, y dentro los codigos:
// ('temperature', 'Cel', 35). La cabecera --- (code, unit, alert_threshold)
// --- no lleva comillas, asi que no se cuela.
const INSERT = /INSERT INTO sensor_types[^;]*;/;
const CODE = /\(\s*'([a-z][a-z0-9_]*)'/g;

function codesInSchema() {
  const sql = readFileSync(resolve(ROOT, SCHEMA), 'utf8');
  const insert = sql.match(INSERT);
  if (insert === null) return [];
  return [...insert[0].matchAll(CODE)].map((match) => match[1]);
}

const inSchema = codesInSchema();
const inPanel = SENSOR_TYPE_CODES;
const failures = [];

if (inSchema.length === 0) failures.push(`no encuentro ningun tipo en ${SCHEMA}`);
if (inPanel.length === 0) failures.push(`no encuentro ningun tipo en ${PANEL}`);

for (const code of inSchema.filter((code) => !inPanel.includes(code))) {
  failures.push(`'${code}' esta en la base y no en el panel: el formulario de alta no lo ofrece`);
}
for (const code of inPanel.filter((code) => !inSchema.includes(code))) {
  failures.push(`'${code}' esta en el panel y no en la base: el alta lo ofreceria y la API lo rechazaria`);
}

console.log('Los tipos de sensor del panel');
console.log();
console.log(`  ${inSchema.length} en ${SCHEMA}: ${inSchema.join(', ')}`);
console.log(`  ${inPanel.length} en ${PANEL}: ${inPanel.join(', ')}`);
console.log();

if (failures.length > 0) {
  console.log(`FALLOS (${failures.length}):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exitCode = 1;
} else {
  console.log('Los mismos tipos en la base y en el panel.');
}

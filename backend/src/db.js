// La conexion con PostgreSQL: un pool, que presta conexiones abiertas a cada
// consulta en vez de abrir una nueva cada vez.
import { Pool } from 'pg';

// Sin estas variables la API no arranca: mejor pararse al empezar, diciendo
// cual falta, que fallar en la primera consulta con un error que no lo dice.
const REQUIRED = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Faltan variables en el .env: ${missing.join(', ')}`);
  process.exit(1);
}

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Por defecto espera sin limite: una base que no contesta dejaria colgada
  // cada peticion.
  connectionTimeoutMillis: 2000,
});

// Una conexion en reposo dentro del pool tambien puede fallar, si la base se
// reinicia. Sin este aviso, ese error tumbaria la API (documentacion de pg).
pool.on('error', (error) => {
  console.error('Una conexion del pool ha fallado:', error.message);
});

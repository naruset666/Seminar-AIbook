// Creates the database (if missing), then applies schema.sql and seed.sql.
// Usage: npm run db:migrate
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { databaseUrl } = require('../config/env');

async function ensureDatabase() {
  const url = new URL(databaseUrl);
  const dbName = url.pathname.replace(/^\//, '');
  url.pathname = '/postgres';

  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (rowCount === 0) {
      await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
      console.log(`Created database ${dbName}`);
    }
  } finally {
    await admin.end();
  }
}

async function runSqlFile(client, fileName) {
  const sql = fs.readFileSync(path.join(__dirname, fileName), 'utf8');
  await client.query(sql);
  console.log(`Applied ${fileName}`);
}

async function main() {
  await ensureDatabase();
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await runSqlFile(client, 'schema.sql');
    await runSqlFile(client, 'seed.sql');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});

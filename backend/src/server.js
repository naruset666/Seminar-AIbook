const app = require('./app');
const { pool } = require('./db/pool');
const { port, nodeEnv } = require('./config/env');

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL');
  } catch (err) {
    console.error('Cannot connect to PostgreSQL:', err.message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`API running on http://localhost:${port} (${nodeEnv})`);
  });
}

start();

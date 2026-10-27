const { query } = require('../db/pool');

const PUBLIC_COLUMNS = 'id, email, display_name, created_at';

async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function create({ email, passwordHash, displayName }) {
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING ${PUBLIC_COLUMNS}`,
    [email, passwordHash, displayName]
  );
  return rows[0];
}

module.exports = { findByEmail, findById, create };

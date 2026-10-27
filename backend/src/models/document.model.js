const { query } = require('../db/pool');

// stored_path is internal; never send it to the client.
const PUBLIC_COLUMNS = 'id, original_name, size_bytes, page_count, last_page, uploaded_at, last_opened_at';

async function listByUser(userId) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS} FROM documents WHERE user_id = $1 ORDER BY uploaded_at DESC`,
    [userId]
  );
  return rows;
}

async function findOwned(id, userId) {
  const { rows } = await query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [id, userId]);
  return rows[0] || null;
}

async function create({ userId, originalName, storedPath, sizeBytes }) {
  const { rows } = await query(
    `INSERT INTO documents (user_id, original_name, stored_path, size_bytes)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PUBLIC_COLUMNS}`,
    [userId, originalName, storedPath, sizeBytes]
  );
  return rows[0];
}

async function updateProgress(id, userId, { lastPage, pageCount }) {
  const { rows } = await query(
    `UPDATE documents
     SET last_page = COALESCE($3, last_page),
         page_count = COALESCE($4, page_count),
         last_opened_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING ${PUBLIC_COLUMNS}`,
    [id, userId, lastPage ?? null, pageCount ?? null]
  );
  return rows[0] || null;
}

async function remove(id, userId) {
  const { rows } = await query(
    'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING stored_path',
    [id, userId]
  );
  return rows[0] || null;
}

module.exports = { listByUser, findOwned, create, updateProgress, remove };

const { query } = require('../db/pool');

// Both queries join documents so a user can only reach annotations of their own files.

async function find(documentId, userId) {
  const { rows } = await query(
    `SELECT d.id, a.strokes, a.updated_at
     FROM documents d
     LEFT JOIN document_annotations a ON a.document_id = d.id
     WHERE d.id = $1 AND d.user_id = $2`,
    [documentId, userId]
  );
  return rows[0] || null; // null = document not found / not owned
}

async function save(documentId, userId, strokes) {
  const { rows } = await query(
    `INSERT INTO document_annotations (document_id, strokes, updated_at)
     SELECT d.id, $3::jsonb, NOW() FROM documents d WHERE d.id = $1 AND d.user_id = $2
     ON CONFLICT (document_id) DO UPDATE SET strokes = EXCLUDED.strokes, updated_at = NOW()
     RETURNING strokes, updated_at`,
    [documentId, userId, JSON.stringify(strokes)]
  );
  return rows[0] || null;
}

module.exports = { find, save };

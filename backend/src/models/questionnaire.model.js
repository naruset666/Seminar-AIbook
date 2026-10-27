const { query } = require('../db/pool');

// Each questionnaire response doubles as a saved "preference" the user can switch back to.
const COLUMNS = 'id, answers, score, level, recommended_preset_id, chosen_preset_id, label, created_at';

async function create({ userId, answers, score, level, recommendedPresetId }) {
  const { rows } = await query(
    `INSERT INTO questionnaire_responses (user_id, answers, score, level, recommended_preset_id, chosen_preset_id)
     VALUES ($1, $2, $3, $4, $5, $5)
     RETURNING ${COLUMNS}`,
    [userId, JSON.stringify(answers), score, level, recommendedPresetId]
  );
  return rows[0];
}

async function findLatest(userId) {
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM questionnaire_responses
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function listByUser(userId) {
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM questionnaire_responses
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

// Partial update: fields left undefined keep their stored value.
async function update(id, userId, { label, chosenPresetId }) {
  const { rows } = await query(
    `UPDATE questionnaire_responses
     SET label = CASE WHEN $3 THEN $4 ELSE label END,
         chosen_preset_id = COALESCE($5, chosen_preset_id)
     WHERE id = $1 AND user_id = $2
     RETURNING ${COLUMNS}`,
    [id, userId, label !== undefined, label || null, chosenPresetId ?? null]
  );
  return rows[0] || null;
}

async function remove(id, userId) {
  const { rowCount } = await query('DELETE FROM questionnaire_responses WHERE id = $1 AND user_id = $2', [id, userId]);
  return rowCount > 0;
}

module.exports = { create, findLatest, listByUser, update, remove };

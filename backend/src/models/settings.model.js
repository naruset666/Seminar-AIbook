const { query } = require('../db/pool');

const DEFAULTS = {
  current_preset_id: null,
  layer_settings: {},
  open_tabs: [],
  active_tab_doc_id: null,
};

async function find(userId) {
  const { rows } = await query(
    `SELECT current_preset_id, layer_settings, open_tabs, active_tab_doc_id
     FROM user_settings WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || { ...DEFAULTS };
}

// Partial update: fields left undefined keep their stored value.
async function upsert(userId, { currentPresetId, layerSettings, openTabs, activeTabDocId }) {
  const { rows } = await query(
    `INSERT INTO user_settings (user_id, current_preset_id, layer_settings, open_tabs, active_tab_doc_id)
     VALUES ($1, $2, COALESCE($3::jsonb, '{}'::jsonb), COALESCE($4::jsonb, '[]'::jsonb), $5)
     ON CONFLICT (user_id) DO UPDATE SET
       current_preset_id = CASE WHEN $6 THEN EXCLUDED.current_preset_id ELSE user_settings.current_preset_id END,
       layer_settings    = COALESCE($3::jsonb, user_settings.layer_settings),
       open_tabs         = COALESCE($4::jsonb, user_settings.open_tabs),
       active_tab_doc_id = CASE WHEN $7 THEN EXCLUDED.active_tab_doc_id ELSE user_settings.active_tab_doc_id END
     RETURNING current_preset_id, layer_settings, open_tabs, active_tab_doc_id`,
    [
      userId,
      currentPresetId ?? null,
      layerSettings === undefined ? null : JSON.stringify(layerSettings),
      openTabs === undefined ? null : JSON.stringify(openTabs),
      activeTabDocId ?? null,
      currentPresetId !== undefined,
      activeTabDocId !== undefined,
    ]
  );
  return rows[0];
}

module.exports = { find, upsert };

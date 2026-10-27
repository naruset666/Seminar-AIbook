const { query } = require('../db/pool');

async function listWithLayers() {
  const { rows: presets } = await query(
    `SELECT id, name, description, level, pleasantness, eventfulness, tags
     FROM presets
     ORDER BY sort_order, id`
  );
  const { rows: layers } = await query(
    `SELECT id, preset_id, label, file_path AS src, default_volume AS volume,
            default_pan AS pan, source_type, prompt
     FROM sound_layers
     ORDER BY preset_id, sort_order`
  );

  return presets.map((preset) => ({
    ...preset,
    layers: layers
      .filter((layer) => layer.preset_id === preset.id)
      .map(({ preset_id, ...layer }) => layer),
  }));
}

async function findById(id) {
  const all = await listWithLayers();
  return all.find((preset) => preset.id === id) || null;
}

module.exports = { listWithLayers, findById };

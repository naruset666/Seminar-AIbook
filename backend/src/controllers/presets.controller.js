const Preset = require('../models/preset.model');

async function list(req, res) {
  res.json({ presets: await Preset.listWithLayers() });
}

module.exports = { list };

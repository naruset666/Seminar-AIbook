const Settings = require('../models/settings.model');
const Preset = require('../models/preset.model');

async function get(req, res) {
  res.json({ settings: await Settings.find(req.userId) });
}

async function update(req, res) {
  const {
    current_preset_id: currentPresetId,
    layer_settings: layerSettings,
    open_tabs: openTabs,
    active_tab_doc_id: activeTabDocId,
  } = req.body;

  if (currentPresetId && !(await Preset.findById(currentPresetId))) {
    return res.status(400).json({ message: 'ไม่พบบรรยากาศที่เลือก' });
  }

  const settings = await Settings.upsert(req.userId, {
    currentPresetId,
    layerSettings,
    openTabs,
    activeTabDocId,
  });
  return res.json({ settings });
}

module.exports = { get, update };

const Questionnaire = require('../models/questionnaire.model');
const Preset = require('../models/preset.model');
const Settings = require('../models/settings.model');
const { publicQuestions } = require('../services/questions');
const { recommender, AnswerValidationError } = require('../services/recommender');

// Attach full preset objects to each ranking entry.
function withPresets(result, presets) {
  const byId = new Map(presets.map((preset) => [preset.id, preset]));
  return result.rankings.map(({ presetId, score, hits }) => ({ preset: byId.get(presetId), score, hits }));
}

// A stored response plus its presets and rankings. Rankings are recomputed from the
// raw answers, so they follow preset updates.
function present(response, presets) {
  const byId = new Map(presets.map((preset) => [preset.id, preset]));
  let results = [];
  try {
    results = withPresets(recommender.recommend(response.answers, presets), presets);
  } catch (err) {
    if (!(err instanceof AnswerValidationError)) throw err;
    // Answers from an older questionnaire version: keep the stored result only.
  }
  return {
    ...response,
    preset: byId.get(response.recommended_preset_id) || null,
    chosen_preset: byId.get(response.chosen_preset_id) || null,
    results,
  };
}

function getQuestions(req, res) {
  res.json({ questions: publicQuestions() });
}

async function submit(req, res) {
  const presets = await Preset.listWithLayers();

  let result;
  try {
    result = recommender.recommend(req.body.answers, presets);
  } catch (err) {
    if (err instanceof AnswerValidationError) {
      return res.status(400).json({ message: 'กรุณาตอบแบบสอบถามให้ครบทุกข้อ' });
    }
    throw err;
  }

  const response = await Questionnaire.create({
    userId: req.userId,
    answers: req.body.answers,
    score: result.score,
    level: result.level,
    recommendedPresetId: result.presetId,
  });

  // Make the top match the active preset; the user can switch on the result page.
  await Settings.upsert(req.userId, { currentPresetId: result.presetId, layerSettings: {} });

  return res.status(201).json({
    response,
    level: result.level,
    score: result.score,
    results: withPresets(result, presets),
  });
}

async function latest(req, res) {
  const response = await Questionnaire.findLatest(req.userId);
  if (!response) return res.json({ latest: null });
  return res.json({ latest: present(response, await Preset.listWithLayers()) });
}

// All saved preferences (one per questionnaire attempt), newest first.
async function history(req, res) {
  const [responses, presets] = await Promise.all([Questionnaire.listByUser(req.userId), Preset.listWithLayers()]);
  res.json({ preferences: responses.map((response) => present(response, presets)) });
}

// Rename a preference and/or pick a place from it. Picking a place also makes it the
// active soundscape preset.
async function update(req, res) {
  const { label, chosen_preset_id: chosenPresetId } = req.body;

  if (chosenPresetId && !(await Preset.findById(chosenPresetId))) {
    return res.status(400).json({ message: 'ไม่พบบรรยากาศที่เลือก' });
  }

  const response = await Questionnaire.update(req.params.id, req.userId, { label, chosenPresetId });
  if (!response) return res.status(404).json({ message: 'ไม่พบความชอบนี้' });

  if (chosenPresetId) {
    await Settings.upsert(req.userId, { currentPresetId: chosenPresetId, layerSettings: {} });
  }
  return res.json({ preference: present(response, await Preset.listWithLayers()) });
}

async function remove(req, res) {
  const deleted = await Questionnaire.remove(req.params.id, req.userId);
  if (!deleted) return res.status(404).json({ message: 'ไม่พบความชอบนี้' });
  return res.status(204).end();
}

module.exports = { getQuestions, submit, latest, history, update, remove };

// Recommendation service (CLAUDE.md sections 5 and 9).
// Every recommender exposes recommend(answers, presets) -> RecommendationResult:
//   { level, score, presetId, rankings: [{ presetId, score, hits: {questionId: bool} }] }
// Phase 2 adds SimilarityRecommender / collaborative filtering behind the same interface.

const { QUESTIONS } = require('./questions');

const MIN_RESULTS = 3;

// Q1 (noise level) also gives the coarse stimulation level stored with each response.
const NOISE_LEVEL_TO_LEVEL = { quiet: 'low', moderate: 'medium', lively: 'high' };

class AnswerValidationError extends Error {}

function answerTags(answers) {
  if (!answers || typeof answers !== 'object') {
    throw new AnswerValidationError('answers must be an object');
  }
  const tagsByQuestion = {};
  for (const question of QUESTIONS) {
    const option = question.options.find((o) => o.value === answers[question.id]);
    if (!option) throw new AnswerValidationError(`Invalid answer for "${question.id}"`);
    tagsByQuestion[question.id] = option.tags;
  }
  return tagsByQuestion;
}

// Tag matching (ported from reading-place-quiz): a question scores 1 point for a preset
// when any of the answer's tags appears in the preset's tags, so the max score is 5.
// Scoring per question (not per tag) keeps every question equally weighted.
class TagMatchRecommender {
  recommend(answers, presets) {
    const tagsByQuestion = answerTags(answers);

    const scored = presets
      .map((preset) => {
        const hits = {};
        let score = 0;
        for (const question of QUESTIONS) {
          const hit = tagsByQuestion[question.id].some((tag) => preset.tags.includes(tag));
          hits[question.id] = hit;
          if (hit) score += 1;
        }
        return { presetId: preset.id, score, hits };
      })
      // Array.prototype.sort is stable, so ties keep the presets' sort_order.
      .sort((a, b) => b.score - a.score);

    // At least MIN_RESULTS entries, plus anything tied with the last one.
    const cutoff = scored[MIN_RESULTS - 1]?.score ?? 0;
    const rankings = scored.filter((entry, i) => i < MIN_RESULTS || entry.score >= cutoff);

    return {
      level: NOISE_LEVEL_TO_LEVEL[answers.noise_level],
      score: rankings[0]?.score ?? 0,
      presetId: rankings[0]?.presetId ?? null,
      rankings,
    };
  }
}

const recommender = new TagMatchRecommender();

module.exports = { recommender, TagMatchRecommender, AnswerValidationError };

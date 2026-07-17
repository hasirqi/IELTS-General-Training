function evenlySelect(group, count, offset) {
  if (count >= group.length) return group.slice();
  const selected = [];
  const used = new Set();
  for (let index = 0; index < count; index += 1) {
    let position = Math.floor((index + 0.5) * group.length / count + offset) % group.length;
    while (used.has(position)) position = (position + 1) % group.length;
    used.add(position);
    selected.push(group[position]);
  }
  return selected;
}

export function buildVocabularyTestSample(items, sampleSize = 40, attempt = 0) {
  const size = Math.max(1, Math.min(sampleSize, items.length));
  const strata = 4;
  const selected = [];
  for (let stratum = 0; stratum < strata; stratum += 1) {
    const start = Math.floor(items.length * stratum / strata);
    const end = Math.floor(items.length * (stratum + 1) / strata);
    const group = items.slice(start, end);
    const quota = Math.floor(size / strata) + (stratum < size % strata ? 1 : 0);
    selected.push(...evenlySelect(group, Math.min(quota, group.length), attempt * 7 + stratum * 3));
  }
  if (selected.length < size) {
    const chosen = new Set(selected.map((item) => item.id));
    for (const item of items) {
      if (!chosen.has(item.id)) selected.push(item);
      if (selected.length === size) break;
    }
  }
  return selected.slice(0, size).map((item) => item.id);
}

export function buildVocabularyOptions(items, target, field, seed = 0) {
  const correct = target[field] || target.term;
  const pool = [...new Set(items.map((item) => item[field] || item.term).filter((value) => value && value !== correct))];
  const distractors = [];
  let cursor = Math.abs(seed * 37 + target.id.length * 11) % Math.max(1, pool.length);
  while (distractors.length < 2 && distractors.length < pool.length) {
    const value = pool[cursor % pool.length];
    if (!distractors.includes(value)) distractors.push(value);
    cursor += 53;
  }
  const options = [correct, ...distractors];
  const rotation = Math.abs(seed) % options.length;
  return [...options.slice(rotation), ...options.slice(0, rotation)];
}

function estimate(score, sampleSize, totalVocabulary) {
  if (!sampleSize) return { value: 0, low: 0, high: 0 };
  const proportion = Math.max(0, Math.min(1, score / sampleSize));
  const z = 1.96;
  const denominator = 1 + z * z / sampleSize;
  const centre = (proportion + z * z / (2 * sampleSize)) / denominator;
  const margin = z * Math.sqrt((proportion * (1 - proportion) + z * z / (4 * sampleSize)) / sampleSize) / denominator;
  const scale = (value) => Math.max(0, Math.min(totalVocabulary, Math.round(value * totalVocabulary / 10) * 10));
  return { value: scale(proportion), low: scale(centre - margin), high: scale(centre + margin) };
}

export function estimateVocabularyProfile(answers, totalVocabulary) {
  const sampleSize = answers.length;
  const recognitionScore = answers.reduce((sum, answer) => sum + (answer.recognition === "know" ? 1 : answer.recognition === "unsure" ? 0.5 : 0), 0);
  const meaningScore = answers.filter((answer) => answer.meaningCorrect).length;
  const useScore = answers.filter((answer) => answer.useCorrect).length;
  return {
    recognition: estimate(recognitionScore, sampleSize, totalVocabulary),
    meaning: estimate(meaningScore, sampleSize, totalVocabulary),
    use: estimate(useScore, sampleSize, totalVocabulary),
  };
}

export const VOCABULARY_CAT_ENGINE_VERSION = "vocabulary-cat-context-1pl-2pl-v4";
export const VOCABULARY_CAT_LIMITS = Object.freeze({
  routeQuestions: 15,
  routeRealQuestions: 12,
  routePseudoQuestions: 3,
  minimumScoredQuestions: 20,
  maximumScoredQuestions: 30,
  targetStandardError: 0.45,
  maximumDurationMs: 18 * 60_000,
});
export const VOCABULARY_CAT_GUARDRAILS = Object.freeze({
  highThetaProbe: 1.25,
  upperProbeMinimumBand: 9,
  maximumBandExposure: 8,
  pathThetaTolerance: 0.6,
  pathRankTolerance: 1_600,
});

const MIN_THETA = -4;
const MAX_THETA = 4;
const GRID_STEP = 0.05;
const ELIGIBLE_STATUSES = new Set(["item-authored", "pilot-active", "calibrated"]);
export const VOCABULARY_ROUTE_PSEUDOWORDS = Object.freeze([
  "brastive", "caldrin", "drelvate", "flintery", "grendish",
  "lospate", "nexulate", "plimory", "quandrel", "sostive",
  "trellic", "vornate", "wexling", "yandric", "zembate",
]);

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function bandNumber(band) {
  return Number(String(band ?? "1K").replace("K", "")) || 1;
}

export function allVocabularyBands() {
  return Array.from({ length: 20 }, (_, index) => `${index + 1}K`);
}

export function responseProbability(theta, difficulty, discrimination = 1, guessing = 0.25) {
  const logistic = 1 / (1 + Math.exp(-discrimination * (theta - difficulty)));
  return clamp(guessing + (1 - guessing) * logistic, 1e-7, 1 - 1e-7);
}

export function estimateVocabularyAbility(answers, priorTheta = -0.4) {
  if (!answers.length) return { theta: Number(priorTheta.toFixed(3)), standardError: 1.35 };
  const points = [];
  let weightTotal = 0;
  for (let theta = MIN_THETA; theta <= MAX_THETA + 0.0001; theta += GRID_STEP) {
    const routeInfluence = Math.exp(-answers.length / 4);
    const effectivePrior = -0.4 + (priorTheta + 0.4) * routeInfluence;
    let logWeight = -0.5 * ((theta - effectivePrior) / 1.15) ** 2;
    for (const answer of answers) {
      const probability = responseProbability(theta, answer.difficulty, answer.discrimination ?? 1, answer.guessing ?? 0.25);
      logWeight += answer.correct ? Math.log(probability) : Math.log(1 - probability);
    }
    points.push({ theta, logWeight });
  }
  const maximum = Math.max(...points.map((point) => point.logWeight));
  for (const point of points) {
    point.weight = Math.exp(point.logWeight - maximum);
    weightTotal += point.weight;
  }
  const theta = points.reduce((sum, point) => sum + point.theta * point.weight, 0) / weightTotal;
  const variance = points.reduce((sum, point) => sum + ((point.theta - theta) ** 2) * point.weight, 0) / weightTotal;
  return { theta: Number(theta.toFixed(3)), standardError: Number(Math.sqrt(variance).toFixed(3)) };
}

function evenlySelect(items, count, offset) {
  const selected = [];
  const used = new Set();
  for (let index = 0; index < count; index += 1) {
    let position = Math.floor((index + 0.5) * items.length / count + offset) % items.length;
    while (used.has(position)) position = (position + 1) % items.length;
    used.add(position);
    selected.push(items[position]);
  }
  return selected;
}

export function eligibleVocabularyAnchors(bank) {
  return bank.filter((anchor) =>
    ELIGIBLE_STATUSES.has(anchor.reviewStatus)
    && typeof anchor.contextSentence === "string"
    && anchor.contextSentence.toLowerCase().includes(anchor.term.toLowerCase())
    && typeof anchor.englishDefinition === "string"
    && Array.isArray(anchor.definitionOptions)
    && anchor.definitionOptions.length === 4
    && new Set(anchor.definitionOptions).size === 4
    && anchor.definitionOptions.includes(anchor.correctDefinition)
    && Array.isArray(anchor.chineseOptions)
    && anchor.chineseOptions.length === 4
    && new Set(anchor.chineseOptions).size === 4
    && anchor.chineseOptions.includes(anchor.correctChinese)
  );
}

export function buildVocabularyRoute(bank, attempt = 0) {
  const eligible = eligibleVocabularyAnchors(bank);
  const counts = { "1K": 3, "2K": 3, "3K": 2, "4K": 2, "5K": 2 };
  const real = Object.entries(counts).flatMap(([band, count], index) => {
    const items = eligible.filter((anchor) => anchor.frequencyBand === band);
    if (items.length < count) throw new Error(`Route requires at least ${count} eligible ${band} anchors`);
    return evenlySelect(items, count, attempt * 5 + index * 2).map((anchor) => ({
      id: `route-real-${anchor.id}`, kind: "real", term: anchor.term,
      anchorId: anchor.id, frequencyBand: anchor.frequencyBand,
    }));
  });
  const pseudo = evenlySelect(VOCABULARY_ROUTE_PSEUDOWORDS, VOCABULARY_CAT_LIMITS.routePseudoQuestions, attempt * 3)
    .map((term, index) => ({ id: `route-pseudo-${attempt}-${index}`, kind: "pseudo", term }));
  const combined = [...real, ...pseudo];
  return combined.map((_, index) => combined[(index * 7 + attempt * 2) % combined.length]);
}

export function estimateVocabularyRoute(routeResponses) {
  const real = routeResponses.filter((item) => item.kind === "real");
  const pseudo = routeResponses.filter((item) => item.kind === "pseudo");
  const claimedPseudowords = pseudo.filter((item) => item.recognized).length;
  let weighted = 0;
  let weights = 0;
  for (const response of real) {
    const band = Number(response.frequencyBand?.slice(0, -1) ?? 1);
    const weight = 0.75 + band * 0.1;
    weighted += (response.recognized ? band : Math.max(0, band - 2)) * weight;
    weights += weight;
  }
  const averageBand = weights ? weighted / weights : 1;
  const theta = clamp(-2.55 + (averageBand - 1) * 0.88 - claimedPseudowords * 0.45, -3, 1.1);
  return {
    theta: Number(theta.toFixed(3)),
    realRecognized: real.filter((item) => item.recognized).length,
    realTotal: real.length,
    claimedPseudowords,
    pseudoTotal: pseudo.length,
    reliable: claimedPseudowords <= 1,
  };
}

function itemInformation(anchor, theta) {
  const probability = responseProbability(theta, anchor.difficulty, anchor.discrimination, anchor.guessing);
  return (anchor.discrimination ** 2) * probability * (1 - probability);
}

function seededUnit(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

export function selectNextVocabularyAnchor(bank, answers, theta, attempt = 0, options = {}) {
  const used = new Set([
    ...answers.map((answer) => answer.anchorId),
    ...(options.recentAnchorIds ?? []),
  ]);
  const exposureByBand = new Map(allVocabularyBands().map((band) => [band, 0]));
  for (const answer of answers) exposureByBand.set(answer.frequencyBand, (exposureByBand.get(answer.frequencyBand) ?? 0) + 1);
  for (const [band, count] of Object.entries(options.exposureByBand ?? {})) {
    exposureByBand.set(band, Math.max(exposureByBand.get(band) ?? 0, count));
  }
  const maxBandExposure = options.maximumBandExposure ?? VOCABULARY_CAT_GUARDRAILS.maximumBandExposure;
  const needsUpperProbe = options.forceUpperProbe
    ?? (theta >= VOCABULARY_CAT_GUARDRAILS.highThetaProbe
      && !answers.some((answer) => bandNumber(answer.frequencyBand) >= VOCABULARY_CAT_GUARDRAILS.upperProbeMinimumBand));
  const available = eligibleVocabularyAnchors(bank).filter((anchor) => !used.has(anchor.id));
  let eligible = available.filter((anchor) => (exposureByBand.get(anchor.frequencyBand) ?? 0) < maxBandExposure);
  if (needsUpperProbe) {
    const upper = eligible.filter((anchor) => bandNumber(anchor.frequencyBand) >= VOCABULARY_CAT_GUARDRAILS.upperProbeMinimumBand);
    if (upper.length) eligible = upper;
  }
  if (!eligible.length && available.length) eligible = available;
  if (!eligible.length) return null;
  return eligible.map((anchor) => ({
    anchor,
    score: itemInformation(anchor, theta) - Math.abs(anchor.difficulty - theta) * 0.015 + seededUnit(`${attempt}:${answers.length}:${anchor.id}`) * 0.02,
  })).sort((a, b) => b.score - a.score || a.anchor.id.localeCompare(b.anchor.id))[0].anchor;
}

function distinctBands(answers) {
  return new Set(answers.map((answer) => answer.frequencyBand)).size;
}

export function shouldStopVocabularyCat(answers, estimate, elapsedMs) {
  if (answers.length >= VOCABULARY_CAT_LIMITS.maximumScoredQuestions) return true;
  if (elapsedMs >= VOCABULARY_CAT_LIMITS.maximumDurationMs) return true;
  if (answers.length < VOCABULARY_CAT_LIMITS.minimumScoredQuestions) return false;
  const guardrails = vocabularyCatGuardrailSummary(answers, estimate);
  return estimate.standardError <= VOCABULARY_CAT_LIMITS.targetStandardError
    && guardrails.coverageSufficient
    && (!guardrails.upperProbeRequired || guardrails.upperProbeReached);
}

export function thetaToPilotRank(theta) {
  return Math.round(clamp(1 + ((theta + 2.55) / 4.35) * 7_999, 0, 8_000));
}

export function thetaToVocabularyRank(theta) {
  return Math.round(clamp(1 + ((theta + 2.55) / 4.35) * 19_999, 1, 20_000));
}

export function roundedVocabularyEstimate(theta, standardError) {
  const margin = 1.64 * standardError;
  const value = Math.round(thetaToVocabularyRank(theta) / 500) * 500;
  const low = Math.floor(thetaToVocabularyRank(theta - margin) / 500) * 500;
  const high = Math.ceil(thetaToVocabularyRank(theta + margin) / 500) * 500;
  return {
    value: clamp(value, 500, 20_000),
    low: clamp(low, 500, 20_000),
    high: clamp(high, 500, 20_000),
  };
}

export function pilotBandForRank(rank) {
  if (rank < 1_000) return "1K以内";
  if (rank < 2_000) return "1K–2K";
  if (rank < 3_000) return "2K–3K";
  if (rank < 4_000) return "3K–4K";
  if (rank < 5_000) return "4K–5K";
  if (rank < 6_000) return "5K–6K";
  if (rank < 8_000) return "6K–8K";
  return "8K+（当前题库上限）";
}

function bandProfileFor(answers) {
  return Object.fromEntries(allVocabularyBands().map((band) => {
    const selected = answers.filter((answer) => answer.frequencyBand === band);
    return [band, { correct: selected.filter((answer) => answer.correct).length, total: selected.length }];
  }));
}

export function vocabularyCatGuardrailSummary(answers, estimate, options = {}) {
  const bandProfile = bandProfileFor(answers);
  const sampledBands = Object.entries(bandProfile).filter(([, value]) => value.total > 0).map(([band]) => band);
  const upperProbeReached = sampledBands.some((band) => bandNumber(band) >= VOCABULARY_CAT_GUARDRAILS.upperProbeMinimumBand);
  const overexposedBands = Object.entries(bandProfile)
    .filter(([, value]) => value.total > VOCABULARY_CAT_GUARDRAILS.maximumBandExposure)
    .map(([band]) => band);
  const answerIds = answers.map((answer) => answer.anchorId);
  const recentIds = new Set(options.recentAnchorIds ?? []);
  const recentOverlapIds = [...new Set(answerIds.filter((id) => recentIds.has(id)))];
  const upperProbeRequired = estimate.theta >= VOCABULARY_CAT_GUARDRAILS.highThetaProbe;
  const coverageSufficient = sampledBands.length >= 5;
  const retestSafe = new Set(answerIds).size === answerIds.length && recentOverlapIds.length === 0;
  const issues = [
    ...(upperProbeRequired && !upperProbeReached ? ["\u9ad8\u9891\u6bb5\u6837\u672c\u4e0d\u8db3"] : []),
    ...(overexposedBands.length ? ["\u90e8\u5206\u9891\u6bb5\u9898\u76ee\u8fc7\u4e8e\u96c6\u4e2d"] : []),
    ...(!retestSafe ? ["\u8fd1\u671f\u9898\u76ee\u51fa\u73b0\u91cd\u590d"] : []),
    ...(!coverageSufficient ? ["\u8986\u76d6\u9891\u6bb5\u4e0d\u8db3"] : []),
  ];
  return {
    sampledBands,
    upperProbeReached,
    upperProbeRequired,
    overexposedBands,
    recentOverlapIds,
    retestSafe,
    coverageSufficient,
    validationPassed: issues.length === 0,
    issues,
  };
}

export function compareVocabularyCatPaths(primaryResult, comparisonResult) {
  const thetaDelta = Math.abs((primaryResult?.theta ?? 0) - (comparisonResult?.theta ?? 0));
  const rankDelta = Math.abs(thetaToVocabularyRank(primaryResult?.theta ?? 0) - thetaToVocabularyRank(comparisonResult?.theta ?? 0));
  const consistent = thetaDelta <= VOCABULARY_CAT_GUARDRAILS.pathThetaTolerance
    && rankDelta <= VOCABULARY_CAT_GUARDRAILS.pathRankTolerance;
  return {
    consistent,
    thetaDelta: Number(thetaDelta.toFixed(3)),
    rankDelta,
    reasons: consistent ? [] : [
      ...(thetaDelta > VOCABULARY_CAT_GUARDRAILS.pathThetaTolerance ? ["路径 theta 差异过大"] : []),
      ...(rankDelta > VOCABULARY_CAT_GUARDRAILS.pathRankTolerance ? ["路径词族等级差异过大"] : []),
    ],
  };
}

export function summarizeVocabularyCatPathMatrix(comparisons, minimumConsistentRate = 0.8) {
  const total = comparisons.length;
  const consistentCount = comparisons.filter((comparison) => comparison.consistent).length;
  const consistentRate = total ? consistentCount / total : 0;
  return {
    total,
    consistentCount,
    consistentRate: Number(consistentRate.toFixed(3)),
    maximumThetaDelta: total ? Math.max(...comparisons.map((comparison) => comparison.thetaDelta)) : 0,
    maximumRankDelta: total ? Math.max(...comparisons.map((comparison) => comparison.rankDelta)) : 0,
    passed: total >= 4 && consistentRate >= minimumConsistentRate,
  };
}

function confidenceFor(answers, standardError, routeSummary, guardrails) {
  const fast = answers.filter((answer) => answer.responseMs > 0 && answer.responseMs < 750).length;
  const fastRate = answers.length ? fast / answers.length : 0;
  const byBand = new Map();
  for (const answer of answers) {
    const current = byBand.get(answer.frequencyBand) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (answer.correct) current.correct += 1;
    byBand.set(answer.frequencyBand, current);
  }
  const rates = [...byBand.entries()].sort((a, b) => Number(a[0].slice(0, -1)) - Number(b[0].slice(0, -1))).map(([, value]) => value.correct / value.total);
  const inversion = rates.some((rate, index) => index > 0 && rate - rates[index - 1] > 0.65);
  const pseudoRisk = (routeSummary?.claimedPseudowords ?? 0) > 1;
  if (fastRate > 0.25 || inversion || standardError > 0.62 || pseudoRisk || !guardrails.validationPassed) {
    return { label: "需要谨慎", reasons: [
      ...(fastRate > 0.25 ? ["作答速度过快"] : []),
      ...(inversion ? ["频段表现异常"] : []),
      ...(standardError > 0.62 ? ["估计区间较宽"] : []),
      ...(pseudoRisk ? ["基础路由中误认了多个非词"] : []),
      ...guardrails.issues,
    ] };
  }
  return { label: "中等", reasons: ["1,000 锚点完整版本"] };
}

export function buildVocabularyPilotResult(answers, routeResponses, startedAt, completedAt = new Date().toISOString(), savedRoute, options = {}) {
  const routeSummary = routeResponses.length ? estimateVocabularyRoute(routeResponses) : savedRoute;
  const estimate = estimateVocabularyAbility(answers, routeSummary?.theta ?? 0);
  const margin = 1.64 * estimate.standardError;
  const rank = thetaToPilotRank(estimate.theta);
  const lowRank = thetaToPilotRank(estimate.theta - margin);
  const highRank = thetaToPilotRank(estimate.theta + margin);
  const bands = bandProfileFor(answers);
  const guardrails = vocabularyCatGuardrailSummary(answers, estimate, options);
  const confidence = confidenceFor(answers, estimate.standardError, routeSummary, guardrails);
  return {
    engineVersion: VOCABULARY_CAT_ENGINE_VERSION,
    anchorBankVersion: answers[0]?.anchorBankVersion ?? "unknown",
    wordFamilyIndexVersion: answers[0]?.wordFamilyIndexVersion ?? "unknown",
    startedAt, completedAt,
    sampleSize: answers.length,
    correctCount: answers.filter((answer) => answer.correct).length,
    sampledAnchorIds: answers.map((answer) => answer.anchorId),
    theta: estimate.theta,
    standardError: estimate.standardError,
    broadBand: pilotBandForRank(rank),
    interval: { lowBand: pilotBandForRank(lowRank), highBand: pilotBandForRank(highRank) },
    vocabulary: roundedVocabularyEstimate(estimate.theta, estimate.standardError),
    confidence,
    guardrails,
    routeSummary,
    bandProfile: bands,
    experimental: true,
  };
}

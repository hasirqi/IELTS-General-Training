export type View = "home" | "review" | "words" | "vocabulary-study" | "vocabulary-test" | "sentence" | "speak" | "courses" | "library" | "progress" | "errors";
export type Skill = "listening" | "reading" | "writing" | "speaking";
export type MasteryAspect = "form" | "meaning" | "use";
export type VocabularyStudyMode = "order" | "weak" | "random";

export type LexiconProgress = {
  id: string;
  introducedAt: string;
  lastReviewedAt: string;
  dueAt: string;
  stability: number;
  difficulty: number;
  exposures: number;
  lapses: number;
  mastery: Record<MasteryAspect, number>;
};

export type DailyPlan = { date: string; reviewIds: string[]; newIds: string[] };

export type LearningError = {
  id: string;
  lexiconId?: string;
  aspect?: MasteryAspect;
  prompt: string;
  answer: string;
  expected: string;
  createdAt: string;
  resolvedAt?: string;
};

export type VocabularyStudyState = {
  cursor: number;
  mode: VocabularyStudyMode;
  category: string;
};

export type VocabularyTestAnswer = {
  anchorId: string;
  familyId: string;
  lexiconId: string;
  selectedOption: string;
  correct: boolean;
  frequencyBand: string;
  difficulty: number;
  discrimination: number;
  guessing: number;
  responseMs: number;
  phase: "cat";
  anchorBankVersion: string;
  wordFamilyIndexVersion: string;
};

export type VocabularyRouteItem = {
  id: string;
  kind: "real" | "pseudo";
  term: string;
  anchorId?: string;
  frequencyBand?: string;
};

export type VocabularyRouteResponse = VocabularyRouteItem & {
  recognized: boolean;
  responseMs: number;
};

export type VocabularyEstimate = { value: number; low: number; high: number };

export type VocabularyTestResult = {
  id: string;
  completedAt: string;
  sampleSize: number;
  correctCount: number;
  weakCategories: string[];
  mode?: "adaptive-v1" | "adaptive-v2";
  totalVocabulary?: number;
  vocabulary?: VocabularyEstimate;
  broadBand?: string;
  interval?: { lowBand: string; highBand: string };
  confidence?: { label: string; reasons: string[] };
  routeSummary?: { theta: number; realRecognized: number; realTotal: number; claimedPseudowords: number; pseudoTotal: number; reliable: boolean };
  bandProfile?: Record<string, { correct: number; total: number }>;
  engineVersion?: string;
  anchorBankVersion?: string;
  wordFamilyIndexVersion?: string;
  theta?: number;
  standardError?: number;
  experimental?: boolean;
  startedAt?: string;
};

export type VocabularyTestDraft = {
  mode: "adaptive-v2";
  phase: "route" | "cat";
  intent: "quick-route" | "vocabulary-cat";
  routeItems: VocabularyRouteItem[];
  routeIndex: number;
  routeResponses: VocabularyRouteResponse[];
  currentAnchorId?: string;
  answers: VocabularyTestAnswer[];
  initialTheta?: number;
  startedAt: string;
  presentedAt: string;
  attempt: number;
};

export type LearningState = {
  schemaVersion: 5;
  completedSteps: number[];
  completedLessons: string[];
  reviewIndex: number;
  wordIndex: number;
  sentenceIndex: number;
  speakingIndex: number;
  nextLexiconIndex: number;
  dailyPlan: DailyPlan;
  lexiconProgress: Record<string, LexiconProgress>;
  attempts: number;
  correct: number;
  lastStudied: string;
  skill: Record<Skill, number>;
  errorLog: LearningError[];
  vocabularyStudy: VocabularyStudyState;
  vocabularyTestDraft: VocabularyTestDraft | null;
  vocabularyTests: VocabularyTestResult[];
};

export type LexiconItem = {
  id: string;
  term: string;
  phonetic: string;
  part: string;
  meaning: string;
  category: string;
  kind: "word" | "chunk";
  level: string;
  cue?: string;
  example?: string;
  collocation?: string;
  meaningNote?: string;
  contentStatus?: "verified" | "core-only";
};

export type VocabularyAnchor = {
  id: string;
  familyId: string;
  lexiconId: string;
  term: string;
  partOfSpeech: "noun" | "verb" | "adjective" | "adverb";
  focusedMeaning: string;
  meaningNote: string;
  example: string;
  collocation: string;
  contextSentence: string;
  englishDefinition: string;
  definitionOptions: string[];
  correctDefinition: string;
  chineseOptions: string[];
  correctChinese: string;
  frequencyRank: number;
  frequencyBand: string;
  difficulty: number;
  discrimination: number;
  guessing: number;
  reviewStatus: "item-authored" | "pilot-active" | "calibrated";
  version: string;
  source: { wordFamilyIndexVersion: string; teachingLexiconId: string };
};

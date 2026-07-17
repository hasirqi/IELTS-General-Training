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
  lexiconId: string;
  correct: boolean;
};

export type VocabularyEstimate = {
  value: number;
  low: number;
  high: number;
};

export type VocabularyTestResult = {
  id: string;
  completedAt: string;
  sampleSize: number;
  correctCount: number;
  totalVocabulary: number;
  vocabulary: VocabularyEstimate;
  weakCategories: string[];
};

export type VocabularyTestDraft = {
  ids: string[];
  index: number;
  answers: VocabularyTestAnswer[];
  startedAt: string;
};

export type LearningState = {
  schemaVersion: 3;
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

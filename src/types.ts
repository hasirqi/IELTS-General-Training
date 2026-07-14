export type View = "home" | "review" | "words" | "sentence" | "speak" | "progress" | "errors";

export type LearningState = {
  completedSteps: number[];
  dueReviews: number;
  reviewIndex: number;
  wordIndex: number;
  attempts: number;
  correct: number;
  lastStudied: string;
  skill: { listening: number; reading: number; writing: number; speaking: number };
  errorLog: { id: string; prompt: string; answer: string; expected: string; createdAt: string }[];
};

export type WordItem = {
  word: string;
  phonetic: string;
  part: string;
  meaning: string;
  cue: string;
  example: string;
  collocation: string;
  japanese?: string;
  mongolian?: string;
};

import { openDB } from "idb";
import type { LearningState } from "./product-types";

const initialState: LearningState = {
  schemaVersion: 3,
  completedSteps: [],
  completedLessons: [],
  reviewIndex: 0,
  wordIndex: 0,
  sentenceIndex: 0,
  speakingIndex: 0,
  nextLexiconIndex: 0,
  dailyPlan: { date: "", reviewIds: [], newIds: [] },
  lexiconProgress: {},
  attempts: 0,
  correct: 0,
  lastStudied: "",
  skill: { listening: 4, reading: 4, writing: 3.5, speaking: 3.5 },
  errorLog: [],
  vocabularyStudy: { cursor: 0, mode: "order", category: "all" },
  vocabularyTestDraft: null,
  vocabularyTests: [],
};

const dbPromise = openDB("breakthrough-ielts", 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("learning")) db.createObjectStore("learning");
  },
});

function migrate(saved?: Partial<LearningState> | null): LearningState {
  return {
    ...structuredClone(initialState),
    ...(saved ?? {}),
    schemaVersion: 3,
    skill: { ...initialState.skill, ...(saved?.skill ?? {}) },
    completedSteps: saved?.completedSteps ?? [],
    completedLessons: saved?.completedLessons ?? [],
    errorLog: saved?.errorLog ?? [],
    lexiconProgress: saved?.lexiconProgress ?? {},
    dailyPlan: saved?.dailyPlan ?? initialState.dailyPlan,
    sentenceIndex: saved?.sentenceIndex ?? 0,
    speakingIndex: saved?.speakingIndex ?? 0,
    nextLexiconIndex: saved?.nextLexiconIndex ?? 0,
    vocabularyStudy: { ...initialState.vocabularyStudy, ...(saved?.vocabularyStudy ?? {}) },
    vocabularyTestDraft: saved?.vocabularyTestDraft ?? null,
    vocabularyTests: (saved?.vocabularyTests ?? []).filter((result) => "vocabulary" in result),
  };
}

export async function loadLearningState(): Promise<LearningState> {
  try {
    const db = await dbPromise;
    return migrate(await db.get("learning", "state"));
  } catch {
    const fallback = localStorage.getItem("breakthrough-ielts-state");
    return migrate(fallback ? JSON.parse(fallback) : null);
  }
}

export async function saveLearningState(state: LearningState) {
  localStorage.setItem("breakthrough-ielts-state", JSON.stringify(state));
  try {
    const db = await dbPromise;
    await db.put("learning", state, "state");
  } catch {
    // localStorage remains the explicit fallback.
  }
}

export function freshState(): LearningState {
  return structuredClone(initialState);
}

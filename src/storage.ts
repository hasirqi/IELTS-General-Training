import { openDB } from "idb";
import type { LearningState } from "./types";

const initialState: LearningState = {
  completedSteps: [],
  dueReviews: 12,
  reviewIndex: 0,
  wordIndex: 0,
  attempts: 0,
  correct: 0,
  lastStudied: "",
  skill: { listening: 4, reading: 4, writing: 3.5, speaking: 3.5 },
  errorLog: []
};

const dbPromise = openDB("breakthrough-ielts", 1, {
  upgrade(db) {
    db.createObjectStore("learning");
  }
});

export async function loadLearningState(): Promise<LearningState> {
  try {
    const db = await dbPromise;
    return (await db.get("learning", "state")) ?? initialState;
  } catch {
    const fallback = localStorage.getItem("breakthrough-ielts-state");
    return fallback ? JSON.parse(fallback) : initialState;
  }
}

export async function saveLearningState(state: LearningState) {
  localStorage.setItem("breakthrough-ielts-state", JSON.stringify(state));
  try {
    const db = await dbPromise;
    await db.put("learning", state, "state");
  } catch {
    // localStorage remains the offline fallback.
  }
}

export function freshState(): LearningState {
  return structuredClone(initialState);
}

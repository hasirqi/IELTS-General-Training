import test from "node:test";
import assert from "node:assert/strict";
import { adaptiveDailyLoad, calculateNextReview, dedupeEvents, normalizeAnswer, scoreRecall } from "../src/learning-core.mjs";

test("normalizes punctuation and spacing", () => {
  assert.equal(normalizeAnswer("  Appointment! "), "appointment");
});

test("distinguishes independent recall from hinted recall", () => {
  assert.equal(scoreRecall("confirm", "confirm", 0).quality, 5);
  assert.equal(scoreRecall("confirm", "confirm", 1).quality, 3);
  assert.equal(scoreRecall("conform", "confirm", 0).correct, false);
});

test("failed recall returns tomorrow and strong recall expands interval", () => {
  assert.equal(calculateNextReview({ quality: 1, stability: 3, difficulty: 5 }).intervalDays, 1);
  assert.ok(calculateNextReview({ quality: 5, stability: 3, difficulty: 5 }).intervalDays > 3);
});

test("low recent accuracy reduces new item count", () => {
  assert.equal(adaptiveDailyLoad({ dueReviews: 12, recentAccuracy: 0.4 }).newItems, 5);
  assert.equal(adaptiveDailyLoad({ dueReviews: 12, recentAccuracy: 0.9 }).newItems, 10);
});

test("deduplicates offline events and keeps chronological order", () => {
  const events = [
    { id: "b", createdAt: "2026-07-14T10:01:00Z" },
    { id: "a", createdAt: "2026-07-14T10:00:00Z" },
    { id: "b", createdAt: "2026-07-14T10:01:00Z" }
  ];
  assert.deepEqual(dedupeEvents(events).map((event) => event.id), ["a", "b"]);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildDailyPlan, buildThirtySixWeekRoadmap, createStudyOrder, dateKey,
  introduceLexiconItem, masteryStats, overallProgress, scheduleLexiconReview,
} from "../src/learning-engine.mjs";
import { buildLearningLexicon, lexiconQuality, verifiedChunkContent } from "../src/content/lexicon-content.mjs";

const raw = JSON.parse(fs.readFileSync(new URL("../src/content/lexicon.json", import.meta.url), "utf8"));
const lexicon = buildLearningLexicon(raw);

test("all 1,000 items enter one stable, unique study order", () => {
  const order = createStudyOrder(lexicon);
  assert.equal(order.length, 1000);
  assert.equal(new Set(order).size, 1000);
  assert.deepEqual(new Set(order), new Set(lexicon.map((item) => item.id)));
});

test("verified usage content is explicit and never fabricated for unreviewed words", () => {
  assert.equal(Object.keys(verifiedChunkContent).length, 120);
  const quality = lexiconQuality(lexicon);
  assert.equal(quality.total, 1000);
  assert.equal(quality.verified, 1000);
  assert.equal(quality.coreOnly, 0);
  for (const item of lexicon.filter((entry) => entry.contentStatus === "verified")) {
    assert.ok(item.cue && item.example && item.collocation, item.term);
  }
  for (const item of lexicon.filter((entry) => entry.contentStatus === "core-only")) {
    assert.ok(item.cue, item.term);
    assert.equal(item.example, undefined, `${item.term} received an unreviewed example`);
  }
});

test("the 36-week vocabulary roadmap covers every item exactly once", () => {
  const weeks = buildThirtySixWeekRoadmap(lexicon);
  assert.equal(weeks.length, 36);
  const ids = weeks.flatMap((week) => week.ids);
  assert.equal(ids.length, 1000);
  assert.equal(new Set(ids).size, 1000);
  assert.ok(Math.max(...weeks.map((week) => week.ids.length)) - Math.min(...weeks.map((week) => week.ids.length)) <= 1);
});

test("daily plan prioritises unresolved mistakes and then due reviews", () => {
  const now = new Date("2026-07-15T09:00:00Z");
  const first = lexicon[0];
  const second = lexicon[1];
  const progress = {
    [first.id]: { ...introduceLexiconItem(undefined, first.id, { now }), dueAt: "2026-07-14T09:00:00.000Z" },
    [second.id]: { ...introduceLexiconItem(undefined, second.id, { now }), dueAt: "2026-08-14T09:00:00.000Z" },
  };
  const plan = buildDailyPlan({ items: lexicon, progress, nextLexiconIndex: 2, errorLog: [{ id:"e1",lexiconId:second.id,createdAt:now.toISOString() }], now });
  assert.equal(plan.date, dateKey(now));
  assert.deepEqual(plan.reviewIds.slice(0,2), [second.id,first.id]);
  assert.ok(plan.newIds.length >= 5 && plan.newIds.length <= 10);
});

test("wrong recall returns quickly while strong recall increases mastery", () => {
  const start = new Date("2026-07-15T09:00:00Z");
  const base = introduceLexiconItem(undefined, "chunk-0001", { now:start, confidence:3, supportsUse:true });
  const failed = scheduleLexiconReview(base, "meaning", 1, start);
  const strong = scheduleLexiconReview(base, "meaning", 5, start);
  assert.equal(failed.lapses, 1);
  assert.equal(new Date(failed.dueAt).getTime() - start.getTime(), 86_400_000);
  assert.ok(strong.mastery.meaning > base.mastery.meaning);
  assert.ok(strong.stability > failed.stability);
});

test("overall progress is derived from real coverage, mastery and lessons", () => {
  const base = introduceLexiconItem(undefined, "chunk-0001", { confidence:5, supportsUse:true });
  const stats = masteryStats({ [base.id]:base });
  const early = overallProgress({ introduced:stats.introduced,totalVocabulary:1000,completedLessons:1,totalLessons:256,masteryAverage:stats.average });
  const later = overallProgress({ introduced:700,totalVocabulary:1000,completedLessons:192,totalLessons:256,masteryAverage:72 });
  assert.ok(early < later);
  assert.ok(later > 60);
});

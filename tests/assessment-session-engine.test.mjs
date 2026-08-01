import assert from "node:assert/strict";
import test from "node:test";
import rawLexicon from "../src/content/lexicon.json" with { type: "json" };
import anchors from "../src/content/vocabulary-anchor-bank-600.json" with { type: "json" };
import { buildLearningLexicon } from "../src/content/lexicon-content.mjs";
import { buildVocabularyRoute, selectNextVocabularyAnchor } from "../src/vocabulary-cat-engine.mjs";
import {
  buildContextSession, buildDailyQuickSession, buildReadingSession, sampleWithoutReplacement, shuffleWithSeed,
} from "../src/assessment-session-engine.mjs";
const lexicon = buildLearningLexicon(rawLexicon);
const curriculum = Array.from({length:12},(_,index)=>({
  id:`r${index+1}`,
  skill:"reading",
  section:index<6?"Section 1":"Section 3",
  title:`Passage ${index+1}`,
  text:`This is audited passage ${index+1}. It contains enough information for four distinct questions.`,
  questions:Array.from({length:4},(__,questionIndex)=>({
    prompt:`Question ${index+1}-${questionIndex+1}`,
    options:[`Answer ${index}-${questionIndex}`,`Distractor A ${index}-${questionIndex}`,`Distractor B ${index}-${questionIndex}`],
    answer:`Answer ${index}-${questionIndex}`,
    explanation:"The answer is stated in the passage.",
  })),
}));

test("seeded shuffle is stable for resume but different across new seeds", () => {
  const items = Array.from({length:100},(_,index)=>index);
  assert.deepEqual(shuffleWithSeed(items,123),shuffleWithSeed(items,123));
  assert.notDeepEqual(shuffleWithSeed(items,123),shuffleWithSeed(items,124));
  assert.equal(new Set(sampleWithoutReplacement(items,40,88)).size,40);
});

test("daily quick check draws 20 unique anchors and shuffles both questions and options", () => {
  const first=buildDailyQuickSession(anchors,20,1001);
  const second=buildDailyQuickSession(anchors,20,1002);
  assert.equal(first.length,20);
  assert.equal(new Set(first.map((item)=>item.id)).size,20);
  assert.notDeepEqual(first.map((item)=>item.id),second.map((item)=>item.id));
  assert.ok(first.every((item)=>item.options.length===4&&new Set(item.options).size===4&&item.options.includes(item.answer)));
});

test("context practice draws 20 unique verified cloze items with valid choices", () => {
  const first=buildContextSession(lexicon,20,2001);
  const second=buildContextSession(lexicon,20,2002);
  assert.equal(first.length,20);
  assert.equal(new Set(first.map((item)=>item.id)).size,20);
  assert.notDeepEqual(first.map((item)=>item.id),second.map((item)=>item.id));
  assert.ok(first.every((item)=>item.context.includes("____")&&item.options.length===4&&new Set(item.options).size===4&&item.options.includes(item.answer)));
});

test("reading assessment draws six unique audited passages across both reading formats", () => {
  const first=buildReadingSession(curriculum,6,3001);
  const second=buildReadingSession(curriculum,6,3002);
  assert.equal(first.length,24);
  assert.equal(new Set(first.map((item)=>item.passageId)).size,6);
  assert.deepEqual(new Set(first.map((item)=>item.kind)),new Set(["functional","continuous"]));
  assert.notDeepEqual(first.map((item)=>item.id),second.map((item)=>item.id));
  assert.ok(first.every((item)=>item.passage&&item.options.length===3&&item.options.includes(item.answer)));
});

test("quick route and adaptive CAT vary new sessions while remaining duplicate-free", () => {
  const routeA=buildVocabularyRoute(anchors,41001);
  const routeB=buildVocabularyRoute(anchors,41002);
  assert.equal(new Set(routeA.map((item)=>item.id)).size,15);
  assert.equal(new Set(routeB.map((item)=>item.id)).size,15);
  assert.notDeepEqual(routeA.map((item)=>item.term),routeB.map((item)=>item.term));
  const firstItems=new Set(Array.from({length:12},(_,index)=>selectNextVocabularyAnchor(anchors,[],0,51000+index)?.id));
  assert.ok(firstItems.size>1);
});
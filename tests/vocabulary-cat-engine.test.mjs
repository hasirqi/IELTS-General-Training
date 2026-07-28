import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { vocabularyAnchorReview1K } from "../src/content/vocabulary-anchor-review-1k.mjs";
import {
  VOCABULARY_CAT_GUARDRAILS, VOCABULARY_CAT_LIMITS, VOCABULARY_ROUTE_PSEUDOWORDS,
  buildVocabularyPilotResult, buildVocabularyRoute, eligibleVocabularyAnchors,
  compareVocabularyCatPaths,
  estimateVocabularyAbility, estimateVocabularyRoute, responseProbability,
  selectNextVocabularyAnchor, shouldStopVocabularyCat, thetaToVocabularyRank,
  vocabularyCatGuardrailSummary,
} from "../src/vocabulary-cat-engine.mjs";

const anchors = JSON.parse(fs.readFileSync(new URL("../src/content/vocabulary-anchor-bank-600.json", import.meta.url), "utf8"));
const familyIndex = JSON.parse(fs.readFileSync(new URL("../src/content/word-family-index-20k.json", import.meta.url), "utf8"));

function answer(anchor, correct, responseMs = 2400) {
  return { anchorId:anchor.id, familyId:anchor.familyId, lexiconId:anchor.lexiconId, correct,
    difficulty:anchor.difficulty, discrimination:anchor.discrimination, guessing:anchor.guessing,
    frequencyBand:anchor.frequencyBand, responseMs, phase:"cat", anchorBankVersion:anchor.version,
    wordFamilyIndexVersion:anchor.source.wordFamilyIndexVersion };
}
function routeResponse(item, recognized) { return {...item,recognized,responseMs:1700}; }

test("600 reviewed anchors complete the M3 usable bank through 20K", () => {
  assert.equal(anchors.length,600); assert.equal(new Set(anchors.map((item)=>item.id)).size,600);
  assert.equal(new Set(anchors.map((item)=>item.familyId)).size,600);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="1K").length,60);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="2K").length,60);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="3K").length,60);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="4K").length,60);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="5K").length,60);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="6K").length,60);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="7K").length,60);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="8K").length,60);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="9K").length,15);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="10K").length,15);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="11K").length,15);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="12K").length,15);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="13K").length,15);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="14K").length,15);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="15K").length,5);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="16K").length,5);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="17K").length,5);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="18K").length,5);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="19K").length,5);
  assert.equal(anchors.filter((item)=>item.frequencyBand==="20K").length,5);
  assert.equal(eligibleVocabularyAnchors(anchors).length,600);
});

test("every scored anchor has reviewed context, English definitions and separate Chinese choices", () => {
  for(const anchor of anchors){
    assert.equal(anchor.reviewStatus,"item-authored");
    assert.ok(anchor.contextSentence.toLowerCase().includes(anchor.term.toLowerCase()));
    assert.ok(anchor.englishDefinition.length>12);
    assert.equal(anchor.definitionOptions.length,4); assert.equal(new Set(anchor.definitionOptions).size,4);
    assert.equal(anchor.definitionOptions.filter((option)=>option===anchor.correctDefinition).length,1);
    assert.equal(anchor.chineseOptions.length,4); assert.equal(new Set(anchor.chineseOptions).size,4);
    assert.equal(anchor.chineseOptions.filter((option)=>option===anchor.correctChinese).length,1);
    for(const check of ["family","frequency-band","part-of-speech","focused-meaning","english-definition","unique-definition-options","unique-chinese-options","context"]) assert.ok(anchor.review.checks.includes(check));
  }
});

test("Yes/No route contains 12 real words and 3 pseudowords across 1K to 5K", () => {
  const route=buildVocabularyRoute(anchors,0);
  assert.equal(route.length,VOCABULARY_CAT_LIMITS.routeQuestions);
  assert.equal(route.filter((item)=>item.kind==="real").length,12);
  assert.equal(route.filter((item)=>item.kind==="pseudo").length,3);
  for(let band=1;band<=5;band+=1) assert.ok(route.some((item)=>item.frequencyBand===String(band)+"K"));
  assert.notDeepEqual(route.map((item)=>item.id),buildVocabularyRoute(anchors,1).map((item)=>item.id));
});

test("pseudowords never overlap the 20K index or scored anchors", () => {
  const known=new Set([...familyIndex.map((item)=>item.headword.toLowerCase()),...anchors.map((item)=>item.term.toLowerCase())]);
  for(const word of VOCABULARY_ROUTE_PSEUDOWORDS) assert.equal(known.has(word),false,word);
});

test("route only sets the starting point and flags false claims", () => {
  const route=buildVocabularyRoute(anchors,0);
  const honest=route.map((item)=>routeResponse(item,item.kind==="real"));
  const inflated=route.map((item)=>routeResponse(item,true));
  const honestEstimate=estimateVocabularyRoute(honest); const inflatedEstimate=estimateVocabularyRoute(inflated);
  assert.equal(honestEstimate.claimedPseudowords,0); assert.equal(honestEstimate.reliable,true);
  assert.equal(inflatedEstimate.claimedPseudowords,3); assert.equal(inflatedEstimate.reliable,false);
  assert.ok(inflatedEstimate.theta<honestEstimate.theta);
});

test("1PL probability and EAP estimate rise with stronger contextual performance", () => {
  assert.ok(responseProbability(1,0)>responseProbability(-1,0));
  const low=anchors.slice(0,25).map((anchor)=>answer(anchor,false));
  const high=anchors.slice(0,25).map((anchor)=>answer(anchor,true));
  assert.ok(estimateVocabularyAbility(high).theta>estimateVocabularyAbility(low).theta);
});

test("adaptive selection never repeats a scored anchor", () => {
  const used=anchors.slice(0,20).map((anchor)=>answer(anchor,true));
  const next=selectNextVocabularyAnchor(anchors,used,estimateVocabularyAbility(used).theta,0);
  assert.ok(next); assert.ok(!new Set(used.map((item)=>item.anchorId)).has(next.id));
});

test("adaptive selection avoids recent retest items and caps frequency-band exposure", () => {
  const lowBand = anchors.filter((anchor) => anchor.frequencyBand === "1K").slice(0, 8);
  const used = lowBand.map((anchor) => answer(anchor, true));
  const recentAnchorIds = anchors.slice(100, 120).map((anchor) => anchor.id);
  const next = selectNextVocabularyAnchor(anchors, used, -1.8, 0, {
    recentAnchorIds,
    maximumBandExposure: 8,
  });
  assert.ok(next);
  assert.notEqual(next.frequencyBand, "1K");
  assert.ok(!recentAnchorIds.includes(next.id));
});

test("high ability CAT probes the completed 9K to 20K upper bank", () => {
  const lowerOnly = anchors.filter((anchor) => ["1K", "2K", "3K", "4K", "5K"].includes(anchor.frequencyBand)).slice(0, 12)
    .map((anchor) => answer(anchor, true));
  const next = selectNextVocabularyAnchor(anchors, lowerOnly, VOCABULARY_CAT_GUARDRAILS.highThetaProbe, 1);
  assert.ok(next);
  assert.ok(Number(next.frequencyBand.replace("K", "")) >= VOCABULARY_CAT_GUARDRAILS.upperProbeMinimumBand);
});

test("stopping rule counts only 20 to 30 scored contextual questions", () => {
  const sample=Array.from({length:6},(_,index)=>["1K","2K","3K","4K","5K"].map((band)=>anchors.filter((anchor)=>anchor.frequencyBand===band)[index])).flat().map((anchor)=>answer(anchor,true));
  assert.equal(shouldStopVocabularyCat(sample.slice(0,19),{standardError:.2},5_000),false);
  assert.equal(shouldStopVocabularyCat(sample.slice(0,20),{standardError:.7},5_000),false);
  assert.equal(shouldStopVocabularyCat(sample.slice(0,20),{standardError:.2},5_000),true);
  assert.equal(shouldStopVocabularyCat(sample,{standardError:.9},5_000),true);
  assert.equal(shouldStopVocabularyCat(sample.slice(0,5),{standardError:.9},VOCABULARY_CAT_LIMITS.maximumDurationMs),true);
});

test("pilot result excludes route items from score and reports route credibility separately", () => {
  const route=buildVocabularyRoute(anchors,0).map((item)=>routeResponse(item,item.kind==="real"));
  const sample=anchors.slice(0,24).map((anchor,index)=>answer(anchor,index<18));
  const result=buildVocabularyPilotResult(sample,route,"2026-07-24T00:00:00.000Z");
  assert.equal(result.sampleSize,24); assert.equal(result.correctCount,18);
  assert.deepEqual(result.sampledAnchorIds, sample.map((item) => item.anchorId));
  assert.equal(result.routeSummary.realTotal,12); assert.equal(result.routeSummary.pseudoTotal,3);
  assert.match(result.broadBand,/K/); assert.ok(!Object.hasOwn(result,"certifiedLexile")); assert.ok(!Object.hasOwn(result,"ieltsScore"));
  assert.equal(Object.keys(result.bandProfile).length, 20);
  assert.ok(Object.hasOwn(result.guardrails, "upperProbeReached"));
});

test("unreviewed or incomplete candidates are blocked from scoring", () => {
  const blocked=anchors.map((anchor,index)=>index===0?{...anchor,reviewStatus:"frequency-seeded"}:anchor);
  const incomplete=blocked.map((anchor,index)=>index===1?{...anchor,definitionOptions:anchor.definitionOptions.slice(0,3)}:anchor);
  assert.equal(eligibleVocabularyAnchors(blocked).length,anchors.length-1);
  assert.equal(eligibleVocabularyAnchors(incomplete).length,anchors.length-2);
});

test("rapid responses and multiple pseudoword claims lower credibility", () => {
  const route=buildVocabularyRoute(anchors,0).map((item)=>routeResponse(item,true));
  const sample=anchors.slice(0,24).map((anchor,index)=>answer(anchor,index%3===0,180));
  const result=buildVocabularyPilotResult(sample,route,"2026-07-24T00:00:00.000Z");
  assert.equal(result.confidence.label,"需要谨慎");
  assert.ok(result.confidence.reasons.includes("作答速度过快"));
  assert.ok(result.confidence.reasons.includes("基础路由中误认了多个非词"));
});

test("chance-like contextual performance cannot produce a high pilot band", () => {
  const route=buildVocabularyRoute(anchors,0).map((item)=>routeResponse(item,false));
  const sample=anchors.slice(0,30).map((anchor,index)=>answer(anchor,index%4===0));
  const result=buildVocabularyPilotResult(sample,route,"2026-07-24T00:00:00.000Z");
  assert.ok(["1K以内","1K–2K"].includes(result.broadBand));
});

test("the first M3 batch contains 36 manually authored 1K items", () => {
  const batch = anchors.filter((anchor) => Number(anchor.id.slice(7)) >= 151 && Number(anchor.id.slice(7)) <= 186);
  assert.equal(batch.length, 36);
  assert.equal(Object.keys(vocabularyAnchorReview1K).length, 36);
  for (const anchor of batch) {
    const authored = vocabularyAnchorReview1K[anchor.term.toLowerCase()];
    assert.ok(authored, anchor.term);
    assert.equal(anchor.frequencyBand, "1K");
    assert.equal(anchor.partOfSpeech, authored.partOfSpeech);
    assert.equal(anchor.englishDefinition, authored.englishDefinition);
    assert.ok(anchor.review.checks.includes("same-pos-distractors"));
    assert.ok(anchor.review.checks.includes("sense-context-match"));
  }
});

test("direct CAT can reuse a recent route only as its starting estimate", () => {
  const savedRoute={theta:.35,realRecognized:9,realTotal:12,claimedPseudowords:0,pseudoTotal:3,reliable:true,completedAt:"2026-07-27T00:00:00.000Z"};
  const sample=anchors.slice(0,24).map((anchor,index)=>answer(anchor,index<16));
  const result=buildVocabularyPilotResult(sample,[],"2026-07-27T00:00:00.000Z",undefined,savedRoute);
  assert.equal(result.sampleSize,24);
  assert.equal(result.routeSummary.theta,.35);
  assert.equal(result.routeSummary.realTotal,12);
});

test("guardrail summary detects upper probing, overexposure and duplicate retest risk", () => {
  const repeated = anchors.filter((anchor) => anchor.frequencyBand === "2K").slice(0, 9).map((anchor) => answer(anchor, true));
  repeated.push({ ...answer(anchors.find((anchor) => anchor.frequencyBand === "10K"), true), anchorId: repeated[0].anchorId });
  const summary = vocabularyCatGuardrailSummary(repeated, { theta: 1.4, standardError: 0.4 });
  assert.equal(summary.upperProbeRequired, true);
  assert.equal(summary.upperProbeReached, true);
  assert.deepEqual(summary.overexposedBands, ["2K"]);
  assert.equal(summary.retestSafe, false);
});

test("path consistency gate compares route-first and direct CAT outcomes without official claims", () => {
  const sampleA = anchors.slice(0, 24).map((anchor, index) => answer(anchor, index < 17));
  const sampleB = anchors.slice(10, 34).map((anchor, index) => answer(anchor, index < 16));
  const route = buildVocabularyRoute(anchors, 2).map((item) => routeResponse(item, item.kind === "real"));
  const routeFirst = buildVocabularyPilotResult(sampleA, route, "2026-07-28T00:00:00.000Z");
  const direct = buildVocabularyPilotResult(sampleB, [], "2026-07-28T00:00:00.000Z", undefined, routeFirst.routeSummary);
  const comparison = compareVocabularyCatPaths(routeFirst, direct);
  assert.equal(comparison.consistent, true);
  assert.ok(comparison.thetaDelta <= VOCABULARY_CAT_GUARDRAILS.pathThetaTolerance);
  assert.ok(thetaToVocabularyRank(routeFirst.theta) <= 20_000);
  assert.ok(!Object.hasOwn(routeFirst, "certifiedLexile"));
  assert.ok(!Object.hasOwn(direct, "ieltsScore"));
});

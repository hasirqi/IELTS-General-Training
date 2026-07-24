import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  VOCABULARY_CAT_LIMITS, VOCABULARY_ROUTE_PSEUDOWORDS,
  buildVocabularyPilotResult, buildVocabularyRoute, eligibleVocabularyAnchors,
  estimateVocabularyAbility, estimateVocabularyRoute, responseProbability,
  selectNextVocabularyAnchor, shouldStopVocabularyCat,
} from "../src/vocabulary-cat-engine.mjs";

const anchors = JSON.parse(fs.readFileSync(new URL("../src/content/vocabulary-anchor-bank-150.json", import.meta.url), "utf8"));
const familyIndex = JSON.parse(fs.readFileSync(new URL("../src/content/word-family-index-20k.json", import.meta.url), "utf8"));

function answer(anchor, correct, responseMs = 2400) {
  return { anchorId:anchor.id, familyId:anchor.familyId, lexiconId:anchor.lexiconId, correct,
    difficulty:anchor.difficulty, discrimination:anchor.discrimination, guessing:anchor.guessing,
    frequencyBand:anchor.frequencyBand, responseMs, phase:"cat", anchorBankVersion:anchor.version,
    wordFamilyIndexVersion:anchor.source.wordFamilyIndexVersion };
}
function routeResponse(item, recognized) { return {...item,recognized,responseMs:1700}; }

test("150 reviewed anchors match the exact pilot distribution", () => {
  assert.equal(anchors.length,150); assert.equal(new Set(anchors.map((item)=>item.id)).size,150);
  assert.equal(new Set(anchors.map((item)=>item.familyId)).size,150);
  for(let band=1;band<=5;band+=1) assert.equal(anchors.filter((item)=>item.frequencyBand===String(band)+"K").length,24);
  for(let band=6;band<=8;band+=1) assert.equal(anchors.filter((item)=>item.frequencyBand===String(band)+"K").length,10);
  assert.equal(eligibleVocabularyAnchors(anchors).length,150);
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
    assert.deepEqual(anchor.review.checks,["family","frequency-band","part-of-speech","focused-meaning","english-definition","unique-definition-options","unique-chinese-options","context"]);
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
  assert.equal(result.routeSummary.realTotal,12); assert.equal(result.routeSummary.pseudoTotal,3);
  assert.match(result.broadBand,/K/); assert.ok(!Object.hasOwn(result,"certifiedLexile")); assert.ok(!Object.hasOwn(result,"ieltsScore"));
});

test("unreviewed or incomplete candidates are blocked from scoring", () => {
  const blocked=anchors.map((anchor,index)=>index===0?{...anchor,reviewStatus:"frequency-seeded"}:anchor);
  const incomplete=blocked.map((anchor,index)=>index===1?{...anchor,definitionOptions:anchor.definitionOptions.slice(0,3)}:anchor);
  assert.equal(eligibleVocabularyAnchors(blocked).length,149);
  assert.equal(eligibleVocabularyAnchors(incomplete).length,148);
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

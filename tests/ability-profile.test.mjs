import test from "node:test";
import assert from "node:assert/strict";
import { assessmentTrend, buildReadingWeaknessProfile, classifyReadingQuestion, gtReadingReadiness, measurementStatus, weakestReadingCategories } from "../src/ability-profile.mjs";

test("reading questions map deterministically to five non-overlapping weakness types",()=>{
  assert.equal(classifyReadingQuestion("rc-001-q1","continuous"),"mainIdea");
  assert.equal(classifyReadingQuestion("rc-001-q2","continuous"),"locating");
  assert.equal(classifyReadingQuestion("rc-001-q4","continuous"),"sentence");
  assert.equal(classifyReadingQuestion("rc-001-q6","continuous"),"vocabulary");
  assert.equal(classifyReadingQuestion("rc-001-q7","continuous"),"inference");
});

test("weakness profile ranks actual wrong-answer rates instead of raw labels",()=>{
  const profile=buildReadingWeaknessProfile([
    {questionId:"rc-001-q1",kind:"continuous",correct:true},
    {questionId:"rc-001-q2",kind:"continuous",correct:false},
    {questionId:"rc-001-q4",kind:"continuous",correct:false},
    {questionId:"rc-001-q5",kind:"continuous",correct:true},
    {questionId:"rc-001-q6",kind:"continuous",correct:false},
    {questionId:"rc-001-q7",kind:"continuous",correct:false},
  ]);
  const categories=new Set(weakestReadingCategories(profile,5).map(item=>item.category));
  assert.deepEqual(categories,new Set(["locating","sentence","vocabulary","inference"]));
});

test("ability trend and model status remain descriptive rather than official IELTS scores",()=>{
  assert.equal(gtReadingReadiness({internalLevel:"L5",internalReadingValue:1030}).label,"接近 6 分所需训练难度");
  assert.deepEqual(assessmentTrend([{score:700},{score:760}],"score"),{direction:"up",delta:60,label:"较上次提高"});
  assert.equal(measurementStatus([{assessment:"vocabulary-cat",responses:[{},{}]},{assessment:"reading-cat",responses:[{}]}],{status:"awaiting-data"}).model,"审核参数 1PL");
});

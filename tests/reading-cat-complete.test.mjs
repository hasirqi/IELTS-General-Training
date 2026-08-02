import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { build } from "vite";
import { estimateReadingAbility, buildReadingCatResult, selectNextReadingPassage, shouldFinishReadingCat } from "../src/reading-cat-engine-v1.mjs";

let server;
let bank;
test.before(async()=>{server=await build({configFile:false,appType:"custom",plugins:[],ssr:{noExternal:true},build:{ssr:"src/content/reading-assessment-bank-final.ts",outDir:".tmp-reading-bank-test",emptyOutDir:true,rollupOptions:{output:{entryFileNames:"bank.mjs"}}},logLevel:"silent"});bank=await import(`${pathToFileURL(`${process.cwd()}/.tmp-reading-bank-test/bank.mjs`).href}?${Date.now()}`);});

test("reading bank contains exactly 110 independent passages and 720 questions",()=>{
  const passages=bank.readingAssessmentPassages;const questions=bank.readingAssessmentQuestions;
  assert.equal(passages.length,110);assert.equal(questions.length,720);
  assert.equal(passages.filter(item=>item.kind==="functional").length,60);
  assert.equal(passages.filter(item=>item.kind==="continuous").length,50);
  assert.equal(new Set(passages.map(item=>item.id)).size,110);
  assert.equal(new Set(passages.map(item=>item.title)).size,110);
  assert.equal(new Set(passages.map(item=>item.text)).size,110);
  assert.deepEqual(new Set(passages.map(item=>item.level)),new Set([1,2,3,4,5,6]));
});

test("all 720 items pass answer, option, explanation and scoring gates",()=>{
  for(const passage of bank.readingAssessmentPassages){
    assert.equal(passage.contentStatus,"reviewed-original");assert.equal(passage.scoringEligible,true);
    const wordCount=(passage.text.match(/[A-Za-z]+/g)??[]).length;
    assert.ok(wordCount>=(passage.kind==="functional"?45:125),`${passage.id} has only ${wordCount} words`);
    for(const question of passage.questions){assert.equal(question.passageId,passage.id);assert.equal(question.options.length,3);assert.equal(new Set(question.options).size,3);assert.ok(question.options.includes(question.answer));assert.ok(question.explanation.length>=10);assert.ok(Number.isFinite(question.difficulty));assert.ok(question.discrimination>=.9);}
  }
  const ids=bank.readingAssessmentQuestions.map(item=>item.id);assert.equal(new Set(ids).size,720);
  assert.ok(!JSON.stringify(bank.readingAssessmentPassages).match(/placeholder|lorem ipsum|todo|coming soon/i));
});

test("reading CAT adapts by whole passage without repeats and covers both formats",()=>{
  const answers=[];const picked=[];let theta=0;
  for(let round=0;round<8;round++){const passage=selectNextReadingPassage(bank.readingAssessmentPassages,answers,theta,9100+round,[]);assert.ok(passage);assert.ok(!picked.includes(passage.id));picked.push(passage.id);for(const question of passage.questions)answers.push({questionId:question.id,passageId:passage.id,kind:passage.kind,level:passage.level,correct:round%3!==0,difficulty:question.difficulty,discrimination:question.discrimination,optionCount:question.options.length});theta=estimateReadingAbility(answers).theta;}
  assert.ok(new Set(answers.map(item=>item.kind)).size===2);assert.equal(new Set(picked).size,picked.length);
});

test("ability estimate and internal result respond to performance",()=>{
  const sample=bank.readingAssessmentQuestions.slice(0,45);
  const correct=sample.map(item=>({...item,correct:true,optionCount:item.options.length}));
  const wrong=sample.map(item=>({...item,correct:false,optionCount:item.options.length}));
  assert.ok(estimateReadingAbility(correct).theta>estimateReadingAbility(wrong).theta);
  const result=buildReadingCatResult(correct,"2026-08-02T00:00:00.000Z");
  assert.equal(result.sampleSize,45);assert.equal(result.experimental,true);assert.equal(result.official,false);assert.ok(result.internalReadingValue>0);assert.ok(result.interval.low<=result.internalReadingValue&&result.interval.high>=result.internalReadingValue);
});

test("reading CAT stop gate requires enough questions, passages and both formats",()=>{
  const all=bank.readingAssessmentPassages.slice(0,7).flatMap(passage=>passage.questions.map(item=>({...item,correct:true,optionCount:3})));
  assert.equal(shouldFinishReadingCat(all.slice(0,20),{standardError:.1}),false);
  const mixed=[...bank.readingAssessmentPassages.filter(item=>item.kind==="functional").slice(0,4),...bank.readingAssessmentPassages.filter(item=>item.kind==="continuous").slice(0,3)].flatMap(passage=>passage.questions.map(item=>({...item,correct:true,optionCount:3})));
  assert.equal(shouldFinishReadingCat(mixed,{standardError:.3}),true);
});

test("formal application exposes complete experimental reading CAT without official claims",()=>{
  const app=fs.readFileSync("src/AppProduct.tsx","utf8");const component=fs.readFileSync("src/ReadingAssessmentCat.tsx","utf8");
  assert.ok(app.includes("110篇独立文章＋720道客观题"));assert.ok(app.includes("ReadingAssessmentCat"));
  for(const phrase of ["按整篇文章自适应选文","内部模拟阅读值","非官方蓝思认证","不是MetaMetrics官方Lexile认证","38–48题"])assert.ok(component.includes(phrase),phrase);
});

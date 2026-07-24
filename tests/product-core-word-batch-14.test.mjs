import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import{buildLearningLexicon,lexiconQuality}from"../src/content/lexicon-content.mjs";
import{verifiedCoreWordBatch14 as batch}from"../src/content/verified-core-word-batch-14.mjs";

const read=path=>fs.readFileSync(new URL(path,import.meta.url),"utf8");
const json=path=>JSON.parse(read(path));
const raw=json("../src/content/lexicon.json");
const candidates=json("../src/content/core-word-batch-14-candidates.json");
const course=read("../src/content/curriculum-batch-21.ts");
const foundation=read("../src/content/foundation-batch-17.ts");
const ids=(source,prefix)=>[...source.matchAll(new RegExp(`id:\\s*"(${prefix}\\d+)"`,"g"))].map(match=>match[1]);
const questions=source=>[...source.matchAll(/q\(\s*"([^"]+)"\s*,\s*(\[[^\]]+\])\s*,\s*"([^"]+)"\s*,\s*"([^"]*)"\s*\)/g)].map(match=>({prompt:match[1],options:JSON.parse(match[2]),answer:match[3],explanation:match[4]}));

test("batch 14 follows source priority 2601-2800 with audited corrections",()=>{
  assert.equal(candidates.length,200);
  assert.deepEqual(candidates.map(item=>item.priorityIndex),Array.from({length:200},(_,index)=>2601+index));
  assert.deepEqual(Object.keys(batch),candidates.map(item=>item.term));
  assert.equal(candidates.find(item=>item.sourceTerm==="ghosh")?.term,"gosh");
  assert.equal(candidates.find(item=>item.sourceTerm==="manchin")?.term,"mansion");
  assert.equal(raw.length,3800);
  assert.equal(new Set(raw.map(item=>item.term.toLowerCase())).size,3800);
  assert.deepEqual(raw.slice(3600).map(item=>item.term),candidates.map(item=>item.term));
});

test("batch 14 word content passes all gates",()=>{
  const examples=[],collocations=[];
  for(const[term,item]of Object.entries(batch)){
    const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    assert.match(item.meaning,/[\u3400-\u9fff]/,term);
    assert.match(item.example.toLowerCase(),new RegExp(`\\b${escaped}\\b`),term);
    assert.ok(item.example.split(/\s+/).length>=5,term);
    assert.match(item.example,/[.!?]$/,term);
    assert.ok(item.collocation.toLowerCase().includes(term),term);
    assert.ok(item.category.length>=4,term);
    examples.push(item.example);collocations.push(item.collocation.toLowerCase());
  }
  assert.equal(new Set(examples).size,200);
  assert.equal(new Set(collocations).size,200);
  const built=buildLearningLexicon(raw);
  assert.deepEqual(lexiconQuality(built),{total:3800,verified:3800,coreOnly:0});
  const prior=buildLearningLexicon(raw.slice(0,3600));
  const oldExamples=new Set(prior.map(item=>item.example).filter(Boolean));
  const oldCollocations=new Set(prior.map(item=>item.collocation?.toLowerCase()).filter(Boolean));
  for(const item of Object.values(batch)){
    assert.ok(!oldExamples.has(item.example),item.example);
    assert.ok(!oldCollocations.has(item.collocation.toLowerCase()),item.collocation);
  }
});

test("batch 21 adds complete IELTS lessons",()=>{
  for(const prefix of["l","r","w","s"])assert.deepEqual(ids(course,prefix),Array.from({length:4},(_,index)=>`${prefix}${117+index}`));
  const titles=[...course.matchAll(/title:\s*"([^"]+)"/g)].map(match=>match[1]);
  assert.equal(titles.length,16);assert.equal(new Set(titles).size,16);
  for(const marker of["Part 1","Part 2","Part 3","Part 4","Section 1","Section 2","Section 3","Task 1","Task 2"])assert.match(course,new RegExp(marker));
});

test("batch 21 objective questions are answerable",()=>{
  const items=questions(course);
  assert.equal(items.length,32);assert.equal(new Set(items.map(item=>item.prompt)).size,32);
  for(const item of items){
    assert.match(item.prompt,/^[A-Za-z]/);assert.doesNotMatch(item.prompt,/[\u3400-\u9fff]/);
    assert.equal(item.options.length,3);assert.equal(new Set(item.options).size,3);
    assert.ok(item.options.includes(item.answer));assert.ok(item.explanation.length>=4);
  }
});

test("batch 21 fixed MP3 files are valid",()=>{
  for(let index=117;index<=120;index+=1){
    const audio=fs.readFileSync(new URL(`../public/audio/l${index}.mp3`,import.meta.url));
    assert.ok(audio.length>100000);
    assert.ok(audio.subarray(0,3).toString("ascii")==="ID3"||audio[0]===255);
  }
});

test("foundation batch 17 adds ids 169-176",()=>{
  assert.deepEqual(ids(foundation,"g"),Array.from({length:8},(_,index)=>`g${169+index}`));
  assert.deepEqual(ids(foundation,"d"),Array.from({length:8},(_,index)=>`d${169+index}`));
  const prompts=[...foundation.matchAll(/prompt:\s*"([^"]+)"/g)].map(match=>match[1]);
  assert.equal(prompts.length,16);assert.equal(new Set(prompts).size,16);
});

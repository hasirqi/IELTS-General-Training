import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import{buildLearningLexicon,lexiconQuality}from"../src/content/lexicon-content.mjs";
import{verifiedCoreWordBatch15 as batch}from"../src/content/verified-core-word-batch-15.mjs";

const read=path=>fs.readFileSync(new URL(path,import.meta.url),"utf8");
const json=path=>JSON.parse(read(path));
const raw=json("../src/content/lexicon.json");
const candidates=json("../src/content/core-word-batch-15-candidates.json");
const course=read("../src/content/curriculum-batch-22.ts");
const foundation=read("../src/content/foundation-batch-18.ts");
const ids=(source,prefix)=>[...source.matchAll(new RegExp(`id:\\s*"(${prefix}\\d+)"`,"g"))].map(match=>match[1]);
const questions=source=>[...source.matchAll(/q\(\s*"([^"]+)"\s*,\s*(\[[^\]]+\])\s*,\s*"([^"]+)"\s*,\s*"([^"]*)"\s*\)/g)].map(match=>({prompt:match[1],options:JSON.parse(match[2]),answer:match[3],explanation:match[4]}));

test("batch 15 follows source priority 2801-3000 with audited corrections",()=>{
  assert.equal(candidates.length,200);
  assert.deepEqual(candidates.map(item=>item.priorityIndex),Array.from({length:200},(_,index)=>2801+index));
  assert.deepEqual(Object.keys(batch),candidates.map(item=>item.term));
  assert.equal(candidates.find(item=>item.sourceTerm==="mame")?.term,"maim");
  assert.equal(candidates.find(item=>item.sourceTerm==="rous")?.term,"rouse");
  assert.ok(raw.length>=4000);
  assert.equal(new Set(raw.slice(0,4000).map(item=>item.term.toLowerCase())).size,4000);
  assert.deepEqual(raw.slice(3800,4000).map(item=>item.term),candidates.map(item=>item.term));
});

test("batch 15 word content passes all gates",()=>{
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
  const built=buildLearningLexicon(raw.slice(0,4000));
  assert.deepEqual(lexiconQuality(built),{total:4000,verified:4000,coreOnly:0});
  const prior=buildLearningLexicon(raw.slice(0,3800));
  const oldExamples=new Set(prior.map(item=>item.example).filter(Boolean));
  const oldCollocations=new Set(prior.map(item=>item.collocation?.toLowerCase()).filter(Boolean));
  for(const item of Object.values(batch)){
    assert.ok(!oldExamples.has(item.example),item.example);
    assert.ok(!oldCollocations.has(item.collocation.toLowerCase()),item.collocation);
  }
});

test("batch 22 adds complete IELTS lessons",()=>{
  for(const prefix of["l","r","w","s"])assert.deepEqual(ids(course,prefix),Array.from({length:4},(_,index)=>`${prefix}${121+index}`));
  const titles=[...course.matchAll(/title:\s*"([^"]+)"/g)].map(match=>match[1]);
  assert.equal(titles.length,16);assert.equal(new Set(titles).size,16);
  for(const marker of["Part 1","Part 2","Part 3","Part 4","Section 1","Section 2","Section 3","Task 1","Task 2"])assert.match(course,new RegExp(marker));
});

test("batch 22 objective questions are answerable",()=>{
  const items=questions(course);
  assert.equal(items.length,32);assert.equal(new Set(items.map(item=>item.prompt)).size,32);
  for(const item of items){
    assert.match(item.prompt,/^[A-Za-z]/);assert.doesNotMatch(item.prompt,/[\u3400-\u9fff]/);
    assert.equal(item.options.length,3);assert.equal(new Set(item.options).size,3);
    assert.ok(item.options.includes(item.answer));assert.ok(item.explanation.length>=4);
  }
});

test("batch 22 fixed MP3 files are valid",()=>{
  for(let index=121;index<=124;index+=1){
    const audio=fs.readFileSync(new URL(`../public/audio/l${index}.mp3`,import.meta.url));
    assert.ok(audio.length>100000);
    assert.ok(audio.subarray(0,3).toString("ascii")==="ID3"||audio[0]===255);
  }
});

test("foundation batch 18 adds ids 177-184",()=>{
  assert.deepEqual(ids(foundation,"g"),Array.from({length:8},(_,index)=>`g${177+index}`));
  assert.deepEqual(ids(foundation,"d"),Array.from({length:8},(_,index)=>`d${177+index}`));
  const prompts=[...foundation.matchAll(/prompt:\s*"([^"]+)"/g)].map(match=>match[1]);
  assert.equal(prompts.length,16);assert.equal(new Set(prompts).size,16);
});

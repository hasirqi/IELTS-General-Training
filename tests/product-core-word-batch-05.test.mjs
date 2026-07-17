import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildLearningLexicon, lexiconQuality } from "../src/content/lexicon-content.mjs";
import { buildLearningLexicon as buildBaselineLexicon } from "../src/content/lexicon-content-baseline.mjs";
import { verifiedCoreWordBatch01 } from "../src/content/verified-core-word-batch-01.mjs";
import { verifiedCoreWordBatch02 } from "../src/content/verified-core-word-batch-02.mjs";
import { verifiedCoreWordBatch03 } from "../src/content/verified-core-word-batch-03.mjs";
import { verifiedCoreWordBatch04 } from "../src/content/verified-core-word-batch-04.mjs";
import { verifiedCoreWordBatch05 } from "../src/content/verified-core-word-batch-05.mjs";
const read=(relative)=>fs.readFileSync(new URL(relative,import.meta.url),"utf8");
const json=(relative)=>JSON.parse(read(relative));
const raw=json("../src/content/lexicon.json");
const candidates=json("../src/content/core-word-batch-05-candidates.json");
const baselineRaw=json("../src/content/lexicon-baseline-1000.json");
const course=read("../src/content/curriculum-batch-12.ts");
const foundation=read("../src/content/foundation-batch-08.ts");
const ids=(source,prefix)=>[...source.matchAll(new RegExp(`id:\\s*"(${prefix}\\d+)"`,"g"))].map((match)=>match[1]);
const questions=(source)=>[...source.matchAll(/q\(\s*"([^"]+)"\s*,\s*(\[[^\]]+\])\s*,\s*"([^"]+)"\s*,\s*"([^"]*)"\s*\)/g)].map((match)=>({prompt:match[1],options:JSON.parse(match[2]),answer:match[3],explanation:match[4]}));

test("batch 05 follows exact source priority 801-1000 and publishes only reviewed rows",()=>{
  assert.equal(candidates.length,200);
  assert.deepEqual(candidates.map((item)=>item.priorityIndex),Array.from({length:200},(_,index)=>index+801));
  assert.ok(candidates.every((item)=>item.batch===5&&item.sourceStatus==="ready"));
  assert.equal(new Set(candidates.map((item)=>item.term)).size,200);
  assert.deepEqual(Object.keys(verifiedCoreWordBatch05),candidates.map((item)=>item.term));
  assert.ok(raw.length>=2000);
  assert.equal(new Set(raw.map((item)=>item.term.toLowerCase())).size,raw.length);
  assert.deepEqual(raw.slice(1800,2000).map((item)=>item.term),candidates.map((item)=>item.term));
  assert.deepEqual(raw.slice(1800,2000).map((item)=>item.id),Array.from({length:200},(_,index)=>`word-${String(index+1801).padStart(4,"0")}`));
});

test("all batch 05 meanings, contexts and collocations pass every earlier-batch gate",()=>{
  const baseline=buildBaselineLexicon(baselineRaw);
  const previous=[...Object.values(verifiedCoreWordBatch01),...Object.values(verifiedCoreWordBatch02),...Object.values(verifiedCoreWordBatch03),...Object.values(verifiedCoreWordBatch04)];
  const oldExamples=new Set([...baseline.map((item)=>item.example),...previous.map((item)=>item.example)].filter(Boolean));
  const oldCollocations=new Set([...baseline.map((item)=>item.collocation?.toLowerCase()),...previous.map((item)=>item.collocation.toLowerCase())].filter(Boolean));
  const examples=[],collocations=[];
  for(const [term,item] of Object.entries(verifiedCoreWordBatch05)){
    const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    assert.match(item.meaning,/[\u3400-\u9fff]/,term);
    assert.match(item.example.toLowerCase(),new RegExp(`\\b${escaped}\\b`),term);
    assert.ok(item.example.trim().split(/\s+/).length>=5,term);
    assert.match(item.example,/[.!?]$/,term);
    assert.ok(item.collocation.toLowerCase().includes(term),term);
    assert.ok(item.category.length>=4,term);
    assert.ok(!oldExamples.has(item.example),`old example repeated: ${term}`);
    assert.ok(!oldCollocations.has(item.collocation.toLowerCase()),`old collocation repeated: ${term}`);
    examples.push(item.example);collocations.push(item.collocation.toLowerCase());
  }
  assert.equal(new Set(examples).size,200);assert.equal(new Set(collocations).size,200);
  assert.deepEqual(lexiconQuality(buildLearningLexicon(raw)),{total:raw.length,verified:raw.length,coreOnly:0});
});

test("batch 12 synchronously adds four complete lessons per IELTS skill",()=>{
  for(const prefix of ["l","r","w","s"]) assert.deepEqual(ids(course,prefix),Array.from({length:4},(_,index)=>`${prefix}${index+81}`));
  const titles=[...course.matchAll(/title:\s*"([^"]+)"/g)].map((match)=>match[1]);
  assert.equal(titles.length,16);assert.equal(new Set(titles).size,16);
  for(const marker of ["Part 1","Part 2","Part 3","Part 4","Section 1","Section 2","Section 3","Task 1","Task 2"]) assert.match(course,new RegExp(marker));
  assert.doesNotMatch(course,/TODO|TBD|placeholder|待完善|示例内容/i);
});

test("all batch 12 objective questions are English, unique and answerable",()=>{
  const items=questions(course);assert.equal(items.length,32);assert.equal(new Set(items.map((item)=>item.prompt)).size,32);
  for(const item of items){assert.match(item.prompt,/^[A-Za-z]/);assert.doesNotMatch(item.prompt,/[\u3400-\u9fff]/);assert.equal(item.options.length,3);assert.equal(new Set(item.options).size,3);assert.ok(item.options.includes(item.answer));assert.ok(item.explanation.length>=4);}
});

test("batch 12 listening uses four valid fixed MP3 files",()=>{
  for(let index=81;index<=84;index+=1){const bytes=fs.readFileSync(new URL(`../public/audio/l${index}.mp3`,import.meta.url));assert.ok(bytes.length>100_000);assert.ok(bytes.subarray(0,3).toString("ascii")==="ID3"||bytes[0]===0xff);}
});

test("foundation batch 08 adds exact ids 97-104 with unique usable tasks",()=>{
  assert.deepEqual(ids(foundation,"g"),Array.from({length:8},(_,index)=>`g${index+97}`));
  assert.deepEqual(ids(foundation,"d"),Array.from({length:8},(_,index)=>`d${index+97}`));
  const prompts=[...foundation.matchAll(/prompt:\s*"([^"]+)"/g)].map((match)=>match[1]);assert.equal(prompts.length,16);assert.equal(new Set(prompts).size,16);assert.doesNotMatch(foundation,/TODO|TBD|placeholder|待完善|示例内容/i);
});

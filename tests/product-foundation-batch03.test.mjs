import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=(path)=>fs.readFileSync(new URL(path,import.meta.url),"utf8");
const prior=`${read("../src/content/sentence-challenges-base.ts")}\n${read("../src/content/speaking-drills-base.ts")}\n${read("../src/content/foundation-batch-02.ts")}`;
const batch=read("../src/content/foundation-batch-03.ts");
const values=(source,pattern)=>[...source.matchAll(pattern)].map((match)=>match[1]);
test("foundation batch 03 adds exact sentence and speaking ids 49 through 64",()=>{
  assert.deepEqual(values(batch,/id:"(g\d+)"/g),Array.from({length:16},(_,i)=>`g${i+49}`));
  assert.deepEqual(values(batch,/id:"(d\d+)"/g),Array.from({length:16},(_,i)=>`d${i+49}`));
});
test("foundation batch 03 remains unique and substantive",()=>{
  const titles=values(batch,/title:"([^"]+)"/g), prompts=values(batch.slice(batch.indexOf("speakingDrillBatch03")),/prompt:"([^"]+)"/g);
  const priorTitles=new Set(values(prior,/title:\s*"([^"]+)"/g)), priorPrompts=new Set(values(prior,/prompt:\s*"([^"]+)"/g));
  assert.equal(titles.length,32); assert.equal(new Set(titles).size,32); assert.equal(prompts.length,16); assert.equal(new Set(prompts).size,16);
  for(const value of titles) assert.equal(priorTitles.has(value),false,`repeated title: ${value}`); for(const value of prompts) assert.equal(priorPrompts.has(value),false,`repeated prompt: ${value}`);
});
test("all new sentence questions have three options and one valid answer",()=>{
  const sentencePart=batch.slice(0,batch.indexOf("speakingDrillBatch03")); const rows=[...sentencePart.matchAll(/prompt:"([^"]+)",options:(\[[^\]]+\]),correct:"([^"]+)"/g)]; assert.equal(rows.length,16);
  for(const [,prompt,json,correct] of rows){const options=JSON.parse(json);assert.equal(options.length,3,prompt);assert.equal(new Set(options).size,3,prompt);assert.ok(options.includes(correct),prompt)}
  assert.doesNotMatch(batch,/TODO|TBD|lorem ipsum|待完善|示例内容|placeholder/i);
});

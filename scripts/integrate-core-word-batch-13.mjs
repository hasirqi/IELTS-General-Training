import fs from"node:fs";
import path from"node:path";
import{fileURLToPath}from"node:url";
import{verifiedCoreWordBatch13 as verified}from"../src/content/verified-core-word-batch-13.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const file=relative=>path.join(root,relative);
const read=relative=>fs.readFileSync(file(relative),"utf8");
const write=(relative,value)=>fs.writeFileSync(file(relative),value,"utf8");
const plan=JSON.parse(read("ysgpc/extracted/expansion-plan.json"));
const candidates=plan.candidates.filter(item=>item.batch===13&&item.sourceStatus==="ready");
const terms=Object.keys(verified);

if(candidates.length!==200||terms.length!==200)throw new Error("Batch 13 must contain exactly 200 reviewed candidates.");
if(JSON.stringify(candidates.map(item=>item.term.toLowerCase()))!==JSON.stringify(terms))throw new Error("Batch 13 reviewed rows do not follow source priority 2401-2600.");

write("src/content/core-word-batch-13-candidates.json",JSON.stringify(candidates,null,2)+"\n");
const current=JSON.parse(read("src/content/lexicon.json"));
if(current.length!==3400)throw new Error("Batch 13 requires the published 3,400-item baseline.");
const seen=new Set(current.map(item=>item.term.toLowerCase()));
const additions=candidates.map((source,index)=>{
  const term=source.term.toLowerCase();
  if(seen.has(term))throw new Error(`Duplicate term: ${term}`);
  const reviewed=verified[term];
  return{id:`word-${String(3401+index).padStart(4,"0")}`,term,phonetic:"",part:"单词",meaning:reviewed.meaning,category:reviewed.category,kind:"word",level:"B1-B2",sourceBatch:"core-audio-13",valueTier:source.valueTier,sourceAudio:source.audioFile,sourceStart:source.start,sourceEnd:source.end};
});
write("src/content/lexicon.json",JSON.stringify([...current,...additions])+"\n");

let source=read("src/content/lexicon-content.mjs");
source=source.replace('import { verifiedCoreWordBatch12 } from "./verified-core-word-batch-12.mjs";','import { verifiedCoreWordBatch12 } from "./verified-core-word-batch-12.mjs";\nimport { verifiedCoreWordBatch13 } from "./verified-core-word-batch-13.mjs";')
  .replace("  verifiedCoreWordBatch12,\n};","  verifiedCoreWordBatch12,\n  verifiedCoreWordBatch13,\n};")
  .replace("const reviewed = verifiedCoreWordBatch12[item.term.toLowerCase()] ??","const reviewed = verifiedCoreWordBatch13[item.term.toLowerCase()] ?? verifiedCoreWordBatch12[item.term.toLowerCase()] ??");
write("src/content/lexicon-content.mjs",source);

source=read("src/content/course-bank.ts");
source=source.replace('import { curriculumBatch19 } from "./curriculum-batch-19";','import { curriculumBatch19 } from "./curriculum-batch-19";\nimport { curriculumBatch20 } from "./curriculum-batch-20";')
  .replace("...curriculumBatch19];","...curriculumBatch19, ...curriculumBatch20];");
write("src/content/course-bank.ts",source);

source=read("src/content/sentence-challenges.ts");
source=source.replace('import { sentenceChallengeBatch15 } from "./foundation-batch-15";','import { sentenceChallengeBatch15 } from "./foundation-batch-15";\nimport { sentenceChallengeBatch16 } from "./foundation-batch-16";')
  .replace("...sentenceChallengeBatch15];","...sentenceChallengeBatch15, ...sentenceChallengeBatch16];");
write("src/content/sentence-challenges.ts",source);

source=read("src/content/speaking-drills.ts");
source=source.replace('import { speakingDrillBatch15 } from "./foundation-batch-15";','import { speakingDrillBatch15 } from "./foundation-batch-15";\nimport { speakingDrillBatch16 } from "./foundation-batch-16";')
  .replace("...speakingDrillBatch15];","...speakingDrillBatch15, ...speakingDrillBatch16];");
write("src/content/speaking-drills.ts",source);

console.log(`Published ${current.length+additions.length} lexical items.`);

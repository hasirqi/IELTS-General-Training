import fs from"node:fs";
import path from"node:path";
import{fileURLToPath}from"node:url";
import{verifiedCoreWordBatch12 as verified}from"../src/content/verified-core-word-batch-12.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const file=relative=>path.join(root,relative);
const read=relative=>fs.readFileSync(file(relative),"utf8");
const write=(relative,value)=>fs.writeFileSync(file(relative),value,"utf8");
const plan=JSON.parse(read("ysgpc/extracted/expansion-plan.json"));
const candidates=plan.candidates.filter(item=>item.batch===12&&item.sourceStatus==="ready");
const terms=Object.keys(verified);

if(candidates.length!==200||terms.length!==200)throw new Error("Batch 12 must contain exactly 200 reviewed candidates.");
if(JSON.stringify(candidates.map(item=>item.term.toLowerCase()))!==JSON.stringify(terms))throw new Error("Batch 12 reviewed rows do not follow source priority 2201-2400.");

write("src/content/core-word-batch-12-candidates.json",JSON.stringify(candidates,null,2)+"\n");
const current=JSON.parse(read("src/content/lexicon.json"));
if(current.length!==3200)throw new Error("Batch 12 requires the published 3,200-item baseline.");
const seen=new Set(current.map(item=>item.term.toLowerCase()));
const additions=candidates.map((source,index)=>{
  const term=source.term.toLowerCase();
  if(seen.has(term))throw new Error(`Duplicate term: ${term}`);
  const reviewed=verified[term];
  return{id:`word-${String(3201+index).padStart(4,"0")}`,term,phonetic:"",part:"单词",meaning:reviewed.meaning,category:reviewed.category,kind:"word",level:"B1-B2",sourceBatch:"core-audio-12",valueTier:source.valueTier,sourceAudio:source.audioFile,sourceStart:source.start,sourceEnd:source.end};
});
write("src/content/lexicon.json",JSON.stringify([...current,...additions])+"\n");

let source=read("src/content/lexicon-content.mjs");
source=source.replace('import { verifiedCoreWordBatch11 } from "./verified-core-word-batch-11.mjs";','import { verifiedCoreWordBatch11 } from "./verified-core-word-batch-11.mjs";\nimport { verifiedCoreWordBatch12 } from "./verified-core-word-batch-12.mjs";')
  .replace("  verifiedCoreWordBatch11,\n};","  verifiedCoreWordBatch11,\n  verifiedCoreWordBatch12,\n};")
  .replace("const reviewed = verifiedCoreWordBatch11[item.term.toLowerCase()] ??","const reviewed = verifiedCoreWordBatch12[item.term.toLowerCase()] ?? verifiedCoreWordBatch11[item.term.toLowerCase()] ??");
write("src/content/lexicon-content.mjs",source);

source=read("src/content/course-bank.ts");
source=source.replace('import { curriculumBatch18 } from "./curriculum-batch-18";','import { curriculumBatch18 } from "./curriculum-batch-18";\nimport { curriculumBatch19 } from "./curriculum-batch-19";')
  .replace("...curriculumBatch18];","...curriculumBatch18, ...curriculumBatch19];");
write("src/content/course-bank.ts",source);

source=read("src/content/sentence-challenges.ts");
source=source.replace('import { sentenceChallengeBatch14 } from "./foundation-batch-14";','import { sentenceChallengeBatch14 } from "./foundation-batch-14";\nimport { sentenceChallengeBatch15 } from "./foundation-batch-15";')
  .replace("...sentenceChallengeBatch14];","...sentenceChallengeBatch14, ...sentenceChallengeBatch15];");
write("src/content/sentence-challenges.ts",source);

source=read("src/content/speaking-drills.ts");
source=source.replace('import { speakingDrillBatch14 } from "./foundation-batch-14";','import { speakingDrillBatch14 } from "./foundation-batch-14";\nimport { speakingDrillBatch15 } from "./foundation-batch-15";')
  .replace("...speakingDrillBatch14];","...speakingDrillBatch14, ...speakingDrillBatch15];");
write("src/content/speaking-drills.ts",source);

console.log(`Published ${current.length+additions.length} lexical items.`);

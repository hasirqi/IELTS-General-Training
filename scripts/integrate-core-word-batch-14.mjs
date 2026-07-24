import fs from"node:fs";
import path from"node:path";
import{fileURLToPath}from"node:url";
import{verifiedCoreWordBatch14 as verified}from"../src/content/verified-core-word-batch-14.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const file=relative=>path.join(root,relative);
const read=relative=>fs.readFileSync(file(relative),"utf8");
const write=(relative,value)=>fs.writeFileSync(file(relative),value,"utf8");
const plan=JSON.parse(read("ysgpc/extracted/expansion-plan.json"));
const corrections={ghosh:"gosh",manchin:"mansion"};
const candidates=plan.candidates.filter(item=>item.batch===14&&item.sourceStatus==="ready").map(item=>{
  const term=corrections[item.term]??item.term;
  return term===item.term?item:{...item,sourceTerm:item.term,term,canonicalTerm:term,correctionStatus:"verified-audio-correction"};
});
const terms=Object.keys(verified);

if(candidates.length!==200||terms.length!==200)throw new Error("Batch 14 must contain exactly 200 reviewed candidates.");
if(JSON.stringify(candidates.map(item=>item.term.toLowerCase()))!==JSON.stringify(terms))throw new Error("Batch 14 reviewed rows do not follow corrected source priority 2601-2800.");

write("src/content/core-word-batch-14-candidates.json",JSON.stringify(candidates,null,2)+"\n");
const current=JSON.parse(read("src/content/lexicon.json"));
if(current.length!==3600)throw new Error("Batch 14 requires the published 3,600-item baseline.");
const seen=new Set(current.map(item=>item.term.toLowerCase()));
const additions=candidates.map((source,index)=>{
  const term=source.term.toLowerCase();
  if(seen.has(term))throw new Error(`Duplicate term: ${term}`);
  const reviewed=verified[term];
  return{id:`word-${String(3601+index).padStart(4,"0")}`,term,phonetic:"",part:"单词",meaning:reviewed.meaning,category:reviewed.category,kind:"word",level:"B1-B2",sourceBatch:"core-audio-14",valueTier:source.valueTier,sourceAudio:source.audioFile,sourceStart:source.start,sourceEnd:source.end};
});
write("src/content/lexicon.json",JSON.stringify([...current,...additions])+"\n");

let source=read("src/content/lexicon-content.mjs");
source=source.replace('import { verifiedCoreWordBatch13 } from "./verified-core-word-batch-13.mjs";','import { verifiedCoreWordBatch13 } from "./verified-core-word-batch-13.mjs";\nimport { verifiedCoreWordBatch14 } from "./verified-core-word-batch-14.mjs";')
  .replace("  verifiedCoreWordBatch13,\n};","  verifiedCoreWordBatch13,\n  verifiedCoreWordBatch14,\n};")
  .replace("const reviewed = verifiedCoreWordBatch13[item.term.toLowerCase()] ??","const reviewed = verifiedCoreWordBatch14[item.term.toLowerCase()] ?? verifiedCoreWordBatch13[item.term.toLowerCase()] ??");
write("src/content/lexicon-content.mjs",source);

source=read("src/content/course-bank.ts");
source=source.replace('import { curriculumBatch20 } from "./curriculum-batch-20";','import { curriculumBatch20 } from "./curriculum-batch-20";\nimport { curriculumBatch21 } from "./curriculum-batch-21";')
  .replace("...curriculumBatch20];","...curriculumBatch20, ...curriculumBatch21];");
write("src/content/course-bank.ts",source);

source=read("src/content/sentence-challenges.ts");
source=source.replace('import { sentenceChallengeBatch16 } from "./foundation-batch-16";','import { sentenceChallengeBatch16 } from "./foundation-batch-16";\nimport { sentenceChallengeBatch17 } from "./foundation-batch-17";')
  .replace("...sentenceChallengeBatch16];","...sentenceChallengeBatch16, ...sentenceChallengeBatch17];");
write("src/content/sentence-challenges.ts",source);

source=read("src/content/speaking-drills.ts");
source=source.replace('import { speakingDrillBatch16 } from "./foundation-batch-16";','import { speakingDrillBatch16 } from "./foundation-batch-16";\nimport { speakingDrillBatch17 } from "./foundation-batch-17";')
  .replace("...speakingDrillBatch16];","...speakingDrillBatch16, ...speakingDrillBatch17];");
write("src/content/speaking-drills.ts",source);

console.log(`Published ${current.length+additions.length} lexical items.`);

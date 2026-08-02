import fs from "node:fs";
import rawLexicon from "../src/content/lexicon.json" with { type: "json" };
import currentAnchors from "../src/content/vocabulary-anchor-bank-600.json" with { type: "json" };
import familyIndex from "../src/content/word-family-index-20k.json" with { type: "json" };
import familyMap from "../src/content/teaching-lexicon-family-map.json" with { type: "json" };
import { buildLearningLexicon } from "../src/content/lexicon-content.mjs";

const VERSION = "anchor-candidates-1000-2026.08.02-v1";
const EXCLUDED_TERMS = new Set(["as","albeit","one","on","at","by","for","from","of","to","in","with","over","under","after","before","between","without","while","since","than","though","if","unless","until","during","per","via","about","around","through","against","within","across","toward","towards"]);
const TARGETS = Object.fromEntries(Array.from({length:20},(_,index)=>[`${index+1}K`,index<8?80:index<14?40:20]));
const lexicon=buildLearningLexicon(rawLexicon);
const lexiconById=new Map(lexicon.map(item=>[item.id,item]));
const familyById=new Map(familyIndex.map(item=>[item.familyId,item]));
const usedFamilies=new Set(currentAnchors.map(item=>item.familyId));
const currentCounts=currentAnchors.reduce((counts,item)=>({...counts,[item.frequencyBand]:(counts[item.frequencyBand]??0)+1}),{});

function containsTerm(text,term){const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`\\b${escaped}(?:s|es|ed|ing)?\\b`,"i").test(text);}
function candidateFor(mapping){
  if(mapping.outcome!=="direct"||mapping.familyIds.length!==1)return null;
  const item=lexiconById.get(mapping.lexiconId);const family=familyById.get(mapping.familyIds[0]);
  if(!item||!family||usedFamilies.has(family.familyId)||family.properNoun||family.numberLike)return null;
  const term=item.term.toLowerCase();
  if(EXCLUDED_TERMS.has(term)||!/^[a-z]+(?:[-'][a-z]+)?$/.test(term)||family.headword!==term||!TARGETS[family.frequencyBand])return null;
  if(!item.meaning||!item.example||!item.collocation||!containsTerm(item.example,term)||!containsTerm(item.collocation,term))return null;
  return {item,family};
}

function stratified(pool,count,band){
  const bandNumber=Number.parseInt(band,10);const start=(bandNumber-1)*1000+1;const span=1000;
  const selected=[];const used=new Set();
  for(let index=0;index<count;index+=1){
    const target=start+((index+0.5)*span/count);
    const choice=pool.filter(entry=>!used.has(entry.family.familyId)).sort((a,b)=>Math.abs(a.family.frequencyRank-target)-Math.abs(b.family.frequencyRank-target)||a.family.frequencyRank-b.family.frequencyRank)[0];
    if(!choice)throw new Error(`${band} lacks candidate for slot ${index+1}`);
    used.add(choice.family.familyId);selected.push(choice);
  }
  return selected;
}

const eligibleByBand={};
for(const mapping of familyMap){const candidate=candidateFor(mapping);if(candidate)(eligibleByBand[candidate.family.frequencyBand]??=[]).push(candidate);}
const selected=[];
for(const [band,target] of Object.entries(TARGETS)){
  const needed=target-(currentCounts[band]??0);const pool=eligibleByBand[band]??[];
  if(pool.length<needed)throw new Error(`${band} needs ${needed}, only ${pool.length} eligible`);
  selected.push(...stratified(pool,needed,band));
}
const candidates=selected.map(({item,family},index)=>({
  candidateId:`candidate-1000-${String(index+1).padStart(3,"0")}`,plannedAnchorId:`anchor-${String(currentAnchors.length+index+1).padStart(3,"0")}`,
  familyId:family.familyId,lexiconId:item.id,term:item.term,focusedMeaning:item.meaning,meaningNote:item.meaningNote??"",contextSentence:item.example,collocation:item.collocation,
  frequencyRank:family.frequencyRank,frequencyBand:family.frequencyBand,source:{teachingLexiconId:item.id,wordFamilyIndexVersion:family.version},
  reviewStatus:"candidate-unreviewed",scoringEligible:false,version:VERSION,
}));
const additionsByBand=candidates.reduce((counts,item)=>({...counts,[item.frequencyBand]:(counts[item.frequencyBand]??0)+1}),{});
const manifest={version:VERSION,generatedAt:"2026-08-02",scoringEligible:false,currentReviewedCount:600,candidateCount:candidates.length,plannedReviewedTotal:1000,finalTargets:TARGETS,currentCounts,additionsByBand,gate:"Candidates remain excluded until POS, sense, English definition, distractors, context and uniqueness checks pass.",candidates};
fs.writeFileSync(new URL("../src/content/vocabulary-anchor-candidates-1000.json",import.meta.url),`${JSON.stringify(manifest,null,2)}\n`);
console.log(`Wrote ${candidates.length} candidates for a final 1,000-anchor bank`);

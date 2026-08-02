const MIN_THETA=-3.2;
const MAX_THETA=3.2;
const GRID_STEP=.05;
export const READING_CAT_LIMITS={minimumQuestions:38,maximumQuestions:48,minimumPassages:6,maximumMinutes:30,targetStandardError:.38,version:"reading-cat-1pl-v1"};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function readingResponseProbability(theta,difficulty,discrimination=1,guessing=1/3){return guessing+(1-guessing)/(1+Math.exp(-discrimination*(theta-difficulty)));}

export function estimateReadingAbility(answers,initialTheta=0){
  if(!answers.length)return{theta:clamp(initialTheta,MIN_THETA,MAX_THETA),standardError:1.45};
  const points=[];let total=0;
  for(let theta=MIN_THETA;theta<=MAX_THETA+.0001;theta+=GRID_STEP){
    let logWeight=-.5*((theta-initialTheta)/1.25)**2;
    for(const item of answers){const probability=clamp(readingResponseProbability(theta,item.difficulty,item.discrimination,1/item.optionCount),1e-7,1-1e-7);logWeight+=item.correct?Math.log(probability):Math.log(1-probability);}
    points.push({theta,logWeight});
  }
  const maximum=Math.max(...points.map(point=>point.logWeight));
  for(const point of points){point.weight=Math.exp(point.logWeight-maximum);total+=point.weight;}
  const theta=points.reduce((sum,point)=>sum+point.theta*point.weight,0)/total;
  const variance=points.reduce((sum,point)=>sum+(point.theta-theta)**2*point.weight,0)/total;
  return{theta:Number(theta.toFixed(3)),standardError:Number(Math.sqrt(variance).toFixed(3))};
}

function passageDifficulty(passage){return passage.questions.reduce((sum,item)=>sum+item.difficulty,0)/passage.questions.length;}
function uniquePassages(answers){return new Set(answers.map(answer=>answer.passageId));}
function passageKindCount(answers,kind){return new Set(answers.filter(answer=>answer.kind===kind).map(answer=>answer.passageId)).size;}

export function selectNextReadingPassage(bank,answers,theta,seed=1,recentPassageIds=[]){
  const used=uniquePassages(answers);const recent=new Set(recentPassageIds);
  let candidates=bank.filter(passage=>passage.scoringEligible&&!used.has(passage.id)&&!recent.has(passage.id));
  if(!candidates.length)candidates=bank.filter(passage=>passage.scoringEligible&&!used.has(passage.id));
  if(!candidates.length)return null;
  const functional=passageKindCount(answers,"functional");const continuous=passageKindCount(answers,"continuous");
  const requiredKind=functional<2?"functional":continuous<2?"continuous":null;
  const filtered=requiredKind?candidates.filter(passage=>passage.kind===requiredKind):candidates;
  const pool=filtered.length?filtered:candidates;
  return pool.map(passage=>{
    const kindPenalty=requiredKind?0:(theta>.55&&passage.kind==="functional"?.18:theta<-.55&&passage.kind==="continuous"?.18:0);
    const jitter=((passage.id.split("").reduce((sum,char)=>sum+char.charCodeAt(0),0)*31+seed*17)%997)/100000;
    return{passage,score:Math.abs(passageDifficulty(passage)-theta)+kindPenalty+jitter};
  }).sort((a,b)=>a.score-b.score||a.passage.id.localeCompare(b.passage.id))[0].passage;
}

export function shouldFinishReadingCat(answers,estimate,elapsedMs=0){
  const passages=uniquePassages(answers).size;
  if(answers.length>=READING_CAT_LIMITS.maximumQuestions||elapsedMs>=READING_CAT_LIMITS.maximumMinutes*60_000)return true;
  if(answers.length<READING_CAT_LIMITS.minimumQuestions||passages<READING_CAT_LIMITS.minimumPassages)return false;
  if(passageKindCount(answers,"functional")<2||passageKindCount(answers,"continuous")<2)return false;
  return estimate.standardError<=READING_CAT_LIMITS.targetStandardError;
}

export function thetaToInternalReadingValue(theta){return Math.round(clamp(800+theta*250,0,1600)/10)*10;}
export function internalReadingInterval(theta,standardError){const margin=1.64*standardError;return{low:thetaToInternalReadingValue(theta-margin),high:thetaToInternalReadingValue(theta+margin)};}
export function internalReadingLevel(value){return value<350?"L1":value<550?"L2":value<750?"L3":value<950?"L4":value<1200?"L5":"L6";}

export function buildReadingCatResult(answers,startedAt,completedAt=new Date().toISOString(),initialTheta=0){
  const estimate=estimateReadingAbility(answers,initialTheta);const value=thetaToInternalReadingValue(estimate.theta);const interval=internalReadingInterval(estimate.theta,estimate.standardError);
  const kinds=["functional","continuous"];const levels=[1,2,3,4,5,6];
  const profile=Object.fromEntries(kinds.map(kind=>{const items=answers.filter(answer=>answer.kind===kind);return[kind,{correct:items.filter(item=>item.correct).length,total:items.length}];}));
  const levelProfile=Object.fromEntries(levels.map(level=>{const items=answers.filter(answer=>answer.level===level);return[`L${level}`,{correct:items.filter(item=>item.correct).length,total:items.length}];}));
  const confidence=estimate.standardError<=.28?{label:"较高",reasons:["题型覆盖完整","能力区间已收敛"]}:estimate.standardError<=.42?{label:"中等",reasons:["已达到正式题量门槛","建议4–6周后复测"]}:{label:"需谨慎",reasons:["作答表现波动较大","当前区间仍然较宽"]};
  return{id:globalThis.crypto?.randomUUID?.()??`reading-${Date.now()}`,mode:"reading-cat-v1",startedAt,completedAt,engineVersion:READING_CAT_LIMITS.version,bankVersion:"reading-bank-110-v1",sampleSize:answers.length,passageCount:uniquePassages(answers).size,correctCount:answers.filter(item=>item.correct).length,theta:estimate.theta,standardError:estimate.standardError,internalReadingValue:value,interval,internalLevel:internalReadingLevel(value),confidence,profile,levelProfile,sampledPassageIds:[...uniquePassages(answers)],experimental:true,official:false};
}

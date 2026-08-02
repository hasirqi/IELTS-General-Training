export const IRT_CALIBRATION_ENGINE_VERSION="vocabulary-2pl-jml-1";
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const logistic=value=>1/(1+Math.exp(-clamp(value,-30,30)));
const logit=value=>Math.log(clamp(value,.01,.99)/(1-clamp(value,.01,.99)));

export function flattenMeasurementSessions(exportsOrSessions){
  const roots=Array.isArray(exportsOrSessions)?exportsOrSessions:[exportsOrSessions];const sessions=[];
  for(const root of roots){if(root?.schemaVersion==="measurement-responses-1")for(const participant of root.participants??[])for(const session of participant.sessions??[])sessions.push({...session,participantId:session.participantId??participant.participantId});else if(root?.assessment)sessions.push(root);}
  return sessions;
}

export function auditCalibrationData(input,{assessment="vocabulary-cat",minimumParticipants=50,minimumResponsesPerItem=50}={}){
  const sessions=flattenMeasurementSessions(input).filter(session=>session.assessment===assessment);const participants=new Set();const responses=[];const seen=new Set();
  for(const session of sessions){if(!session.participantId||!session.id)continue;participants.add(session.participantId);for(const response of session.responses??[]){const key=`${session.id}:${response.itemId}`;if(seen.has(key)||typeof response.correct!=="boolean"||!response.itemId||response.responseMs<500||response.responseMs>180000)continue;seen.add(key);responses.push({...response,sessionId:session.id,participantId:session.participantId});}}
  const counts={};for(const response of responses)counts[response.itemId]=(counts[response.itemId]??0)+1;const eligibleItemIds=Object.entries(counts).filter(([,count])=>count>=minimumResponsesPerItem).map(([id])=>id);
  const issues=[...(participants.size<minimumParticipants?[`participants ${participants.size}/${minimumParticipants}`]:[]),...(!eligibleItemIds.length?[`no item has ${minimumResponsesPerItem} valid responses`]:[])];
  return{sessions,participants:[...participants],responses,itemResponseCounts:counts,eligibleItemIds,minimumParticipants,minimumResponsesPerItem,passed:issues.length===0,issues};
}

export function calibrate2PL(input,options={}){
  const audit=auditCalibrationData(input,options);if(!audit.passed)return{engineVersion:IRT_CALIBRATION_ENGINE_VERSION,status:"insufficient-data",participantCount:audit.participants.length,responseCount:audit.responses.length,eligibleItemCount:audit.eligibleItemIds.length,minimumParticipants:audit.minimumParticipants,minimumResponsesPerItem:audit.minimumResponsesPerItem,itemResponseCounts:audit.itemResponseCounts,issues:audit.issues,parameters:{}};
  const eligible=new Set(audit.eligibleItemIds);const responses=audit.responses.filter(row=>eligible.has(row.itemId));const personIds=[...new Set(responses.map(row=>row.participantId))];const itemIds=[...eligible];const theta=Object.fromEntries(personIds.map(id=>[id,0]));const parameters={};
  for(const itemId of itemIds){const rows=responses.filter(row=>row.itemId===itemId);const p=rows.filter(row=>row.correct).length/rows.length;parameters[itemId]={difficulty:clamp(-logit(p),-3.8,3.8),discrimination:1,sampleSize:rows.length};}
  for(let iteration=0;iteration<(options.iterations??30);iteration+=1){
    for(const personId of personIds){const rows=responses.filter(row=>row.participantId===personId);let score=-theta[personId],information=1;for(const row of rows){const item=parameters[row.itemId];const p=logistic(item.discrimination*(theta[personId]-item.difficulty));score+=item.discrimination*((row.correct?1:0)-p);information+=item.discrimination**2*p*(1-p);}theta[personId]=clamp(theta[personId]+score/information,-4,4);}
    for(const itemId of itemIds){const rows=responses.filter(row=>row.itemId===itemId);let a=parameters[itemId].discrimination,b=parameters[itemId].difficulty;let beta0=-a*b,beta1=a;for(let step=0;step<5;step+=1){let s0=0,s1=0,i00=.05,i01=0,i11=.05;for(const row of rows){const x=theta[row.participantId];const p=logistic(beta0+beta1*x);const residual=(row.correct?1:0)-p;const weight=p*(1-p);s0+=residual;s1+=residual*x;i00+=weight;i01+=weight*x;i11+=weight*x*x;}const determinant=i00*i11-i01*i01;if(determinant<1e-8)break;beta0+=(s0*i11-s1*i01)/determinant;beta1+=(s1*i00-s0*i01)/determinant;}a=clamp(beta1,.35,2.5);b=clamp(-beta0/a,-4,4);parameters[itemId]={...parameters[itemId],difficulty:Number(b.toFixed(3)),discrimination:Number(a.toFixed(3))};}
  }
  let squaredError=0;for(const row of responses){const item=parameters[row.itemId];const p=logistic(item.discrimination*(theta[row.participantId]-item.difficulty));squaredError+=((row.correct?1:0)-p)**2;}
  return{engineVersion:IRT_CALIBRATION_ENGINE_VERSION,status:"calibrated",model:"2PL with fixed chance handling in production",participantCount:personIds.length,responseCount:responses.length,eligibleItemCount:itemIds.length,minimumParticipants:audit.minimumParticipants,minimumResponsesPerItem:audit.minimumResponsesPerItem,fit:{responseRmse:Number(Math.sqrt(squaredError/responses.length).toFixed(4)),iterations:options.iterations??30},parameters};
}

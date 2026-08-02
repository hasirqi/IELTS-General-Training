import { useEffect, useMemo, useRef, useState } from "react";
import { IconAlertTriangle, IconCheck, IconDatabase, IconDownload, IconHeartbeat, IconUpload } from "@tabler/icons-react";
import { curriculum } from "./content/course-bank";
import { normalizeLearningState, saveLearningState } from "./product-storage";
import type { LearningState, UsageValidationArea } from "./product-types";
import {
  buildLearningBackup, collectCourseArtifacts, downloadLearningBackup, parseLearningBackup,
  restoreCourseArtifacts, summarizeLearningBackup,
} from "./learning-backup.mjs";
import { auditLearningState, elapsedValidationDays, latestValidationByArea, VALIDATION_AREAS } from "./product-health.mjs";
import "./product-health.css";

type UpdateState = (next: Partial<LearningState> | ((state: LearningState) => LearningState)) => void;
type Props = { state:LearningState; update:UpdateState; lexiconIds:string[]; lessonIds:string[]; audioFiles:string[]; lexiconCount:number; anchorCount:number; };

const formatDate=(value:string)=>value?new Date(value).toLocaleString("zh-CN"):"尚未备份";
const contentVersion={learningSchema:8,lexicon:"4133-verified",courses:"512",vocabularyAnchors:"1000",readingBank:"110-passages-720-items"};

export function ProductHealth({state,update,lexiconIds,lessonIds,audioFiles,lexiconCount,anchorCount}:Props){
  const fileRef=useRef<HTMLInputElement|null>(null);
  const [pending,setPending]=useState<any>(null);
  const [message,setMessage]=useState("");
  const [audioStatus,setAudioStatus]=useState<{checking:boolean;missing:string[]}>({checking:true,missing:[]});
  const [storage,setStorage]=useState<{usage:number;quota:number}|null>(null);
  const [area,setArea]=useState<UsageValidationArea>("recommendation");
  const [note,setNote]=useState("");
  const [officialBand,setOfficialBand]=useState("6.0");
  const [readingId,setReadingId]=useState(state.readingAssessments.at(-1)?.id??"");

  useEffect(()=>{if(!state.usageValidationStartedAt)update({usageValidationStartedAt:new Date().toISOString()});},[state.usageValidationStartedAt]);
  useEffect(()=>{let cancelled=false;Promise.all(audioFiles.map(async(file)=>{try{const response=await fetch("./audio/"+file,{method:"HEAD",cache:"no-store"});return response.ok?null:file;}catch{return file;}})).then(results=>{if(!cancelled)setAudioStatus({checking:false,missing:results.filter(Boolean) as string[]});});return()=>{cancelled=true;};},[audioFiles]);
  useEffect(()=>{navigator.storage?.estimate?.().then(value=>setStorage({usage:value.usage??0,quota:value.quota??0})).catch(()=>setStorage(null));},[]);

  const audit=useMemo(()=>auditLearningState(state,{lexiconIds,lessonIds}),[state,lexiconIds,lessonIds]);
  const latest=useMemo(()=>latestValidationByArea(state.usageValidationObservations),[state.usageValidationObservations]) as Record<UsageValidationArea,{status:"stable"|"problem";note:string;createdAt:string}|undefined>;
  const elapsed=elapsedValidationDays(state.usageValidationStartedAt);
  const participantCount=new Set(state.measurementSessions.map(item=>item.participantId)).size;
  const responseCount=state.measurementSessions.reduce((sum,item)=>sum+item.responses.length,0);
  const usedMb=storage?(storage.usage/1024/1024).toFixed(1):"—";
  const quotaMb=storage&&storage.quota?(storage.quota/1024/1024).toFixed(0):"—";

  const exportAll=()=>{
    const payload=buildLearningBackup(state,collectCourseArtifacts(localStorage),contentVersion);
    update({lastBackupAt:payload.exportedAt});
    downloadLearningBackup(payload);
    setMessage("完整学习备份已下载。把这个 JSON 文件带到另一台电脑导入即可继续。");
  };
  const readBackup=async(event:React.ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    try{const payload=parseLearningBackup(JSON.parse(await file.text()));setPending({...payload,summary:summarizeLearningBackup(payload)});setMessage("");}
    catch(error){setMessage(error instanceof Error?error.message:"备份文件无法读取");}
    finally{event.target.value="";}
  };
  const restore=async()=>{
    if(!pending||!window.confirm("导入会用备份中的完整进度替换这台设备当前进度。确定继续吗？"))return;
    const restored=normalizeLearningState({...pending.state,lastRestoreAt:new Date().toISOString()});
    restoreCourseArtifacts(localStorage,pending.courseArtifacts);
    await saveLearningState(restored);
    update(()=>restored);
    setPending(null);
    setMessage("恢复完成：复习、错题、课程、测评、能力结果、写作草稿和 ChatGPT 反馈均已载入。");
  };
  const recordObservation=(status:"stable"|"problem")=>{
    const observation={id:crypto.randomUUID(),area,status,note:note.trim(),createdAt:new Date().toISOString()};
    update(current=>({...current,usageValidationObservations:[...current.usageValidationObservations,observation].slice(-500)}));
    setNote("");
  };
  const recordIeltsSample=()=>{
    if(!readingId)return;
    const result=state.readingAssessments.find(item=>item.id===readingId);if(!result)return;
    const sample={id:crypto.randomUUID(),officialBand:Number(officialBand),testDate:new Date().toISOString().slice(0,10),readingAssessmentId:readingId,recordedAt:new Date().toISOString()};
    update(current=>({...current,ieltsReadingValidationSamples:[...current.ieltsReadingValidationSamples,sample].slice(-100)}));
  };

  return <section className="lesson-content health-page">
    <div className="lesson-kicker">本地数据 · 正式使用验证 · 研究门禁</div><h1>数据与健康</h1>
    <p className="health-intro">这里负责跨电脑接续、数据完整性、2–4 周真实使用记录和实证模型门禁。检查结果只描述当前设备，不伪造尚未发生的使用时间或研究样本。</p>

    <section className="health-section"><div className="health-heading"><div><IconDatabase/><span><strong>完整学习数据</strong><small>手动备份后可在办公室与家里电脑接续</small></span></div><em>最近备份：{formatDate(state.lastBackupAt)}</em></div>
      <div className="backup-actions"><button className="primary-button" onClick={exportAll}><IconDownload/>导出完整备份</button><button className="outline-button" onClick={()=>fileRef.current?.click()}><IconUpload/>选择备份文件</button><input ref={fileRef} className="sr-only" type="file" accept="application/json" onChange={readBackup}/></div>
      <p className="backup-scope">包含复习状态、错题、课程完成、词汇/阅读测评历史、能力结果、匿名逐题响应、写作草稿和粘贴回来的 ChatGPT 反馈。音频与题库属于应用本身，不重复塞进备份。</p>
      {pending&&<div className="restore-preview"><strong>备份可读取 · {new Date(pending.summary.exportedAt).toLocaleString("zh-CN")}</strong><span>{pending.summary.lexiconProgress} 条词汇进度 · {pending.summary.completedLessons} 节课程 · {pending.summary.errors} 条错题 · {pending.summary.vocabularyTests+pending.summary.readingAssessments} 次正式测评 · {pending.summary.courseArtifacts} 份草稿/反馈</span>{pending.content?.lexicon!==contentVersion.lexicon&&<small>提示：备份词库版本与当前应用不同，导入后会迁移并在下方完整性检查中标出失效引用。</small>}<button className="primary-button" onClick={restore}>确认导入并替换本机进度</button></div>}
      {message&&<p className="health-message" role="status">{message}</p>}
    </section>

    <section className="health-section"><div className="health-heading"><div><IconHeartbeat/><span><strong>产品健康检查</strong><small>每次打开本页都检查当前数据和固定音频</small></span></div><em>{audit.ok&&!audioStatus.missing.length?"当前未发现阻断问题":"发现需要处理的项目"}</em></div>
      <div className="health-grid">
        <article className={audit.ok?"healthy":"warning"}><span>本地数据完整性</span><strong>{audit.ok?"通过":audit.issues.length+" 项异常"}</strong><small>{audit.ok?"词条、课程、复习和错题引用有效":audit.issues.join("；")}</small></article>
        <article><span>题库与内容版本</span><strong>{lexiconCount.toLocaleString("zh-CN")} 词 · {anchorCount.toLocaleString("zh-CN")} 锚点</strong><small>{curriculum.length} 节课程 · 110 篇阅读测评文章 · 720 道阅读题</small></article>
        <article className={!audioStatus.checking&&!audioStatus.missing.length?"healthy":audioStatus.missing.length?"warning":""}><span>固定听力音频</span><strong>{audioStatus.checking?"正在检查…":audioStatus.missing.length?"缺失 "+audioStatus.missing.length+" 段":audioFiles.length+" 段均可访问"}</strong><small>{audioStatus.missing.length?audioStatus.missing.slice(0,5).join("、"):"逐一检查课程 MP3 地址"}</small></article>
        <article><span>浏览器存储</span><strong>{usedMb} MB / {quotaMb} MB</strong><small>使用量 / 浏览器估算配额；个人进度默认仅保存在本机</small></article>
      </div>
    </section>

    <section className="health-section"><div className="health-heading"><div><IconCheck/><span><strong>2–4 周真实使用验证</strong><small>起始日 {state.usageValidationStartedAt?new Date(state.usageValidationStartedAt).toLocaleDateString("zh-CN"):"正在建立"}</small></span></div><em>第 {elapsed+1} 天 · {elapsed<14?"至少还需 "+(14-elapsed)+" 天":elapsed<=28?"已达到最短周期":"已超过 4 周"}</em></div>
      <div className="validation-grid">{(Object.entries(VALIDATION_AREAS) as [UsageValidationArea,{label:string;hint:string}][]).map(([key,meta])=>{const item=latest[key];return <article key={key}><span>{item?.status==="stable"?"正常":item?.status==="problem"?"有问题":"待观察"}</span><strong>{meta.label}</strong><small>{item?.note||meta.hint}</small>{item&&<em>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</em>}</article>;})}</div>
      <div className="observation-form"><label><span>记录项目</span><select value={area} onChange={event=>setArea(event.target.value as UsageValidationArea)}>{(Object.entries(VALIDATION_AREAS) as [UsageValidationArea,{label:string}][]).map(([key,meta])=><option value={key} key={key}>{meta.label}</option>)}</select></label><label><span>具体情况（可选）</span><input value={note} onChange={event=>setNote(event.target.value)} placeholder="例如：L4 第3篇明显比 L5 更难"/></label><div><button className="outline-button" onClick={()=>recordObservation("stable")}>记录正常</button><button className="outline-button warning-button" onClick={()=>recordObservation("problem")}>记录问题</button></div></div>
    </section>

    <section className="health-section evidence-section"><div className="health-heading"><div><IconDatabase/><span><strong>实证样本与 M9</strong><small>数据不够时继续使用 1PL，不提前宣称映射关系</small></span></div><em>{participantCount} 名匿名参与者 · {responseCount} 条逐题响应</em></div>
      <div className="evidence-grid"><article><span>词汇 2PL</span><strong>{participantCount>=50?"达到参与者门禁，仍需逐题复核":"保持 1PL"}</strong><small>正式估计至少需要 50 名自愿参与者，且目标题目各至少 50 条有效响应；个人重复作答只用于检查重测稳定性。</small></article><article><span>M9 IELTS GT Reading 区间校验</span><strong>{state.ieltsReadingValidationSamples.length} 条真实对照</strong><small>没有真实官方成绩样本时，不声称某个内部 L 值等于 IELTS 6 分。样本只做区间重叠与趋势研究，不硬换算。</small></article></div>
      {state.readingAssessments.length>0&&<details className="m9-entry"><summary>记录一次真实 IELTS GT Reading 对照</summary><div><label><span>内部阅读测评</span><select value={readingId} onChange={event=>setReadingId(event.target.value)}>{state.readingAssessments.slice().reverse().map(item=><option key={item.id} value={item.id}>{new Date(item.completedAt).toLocaleDateString("zh-CN")} · {item.internalReadingValue}L · {item.internalLevel}</option>)}</select></label><label><span>同阶段真实 IELTS GT Reading Band</span><select value={officialBand} onChange={event=>setOfficialBand(event.target.value)}>{Array.from({length:15},(_,index)=>(2+index*.5).toFixed(1)).map(value=><option key={value}>{value}</option>)}</select></label><button className="primary-button" onClick={recordIeltsSample}>保存本地对照</button></div></details>}
    </section>

    <p className="manual-boundary"><IconAlertTriangle/><span><strong>写作和口语的技术边界</strong>没有 API Key 时，本产品只能复制结构化提示词、打开 ChatGPT 网页，再由你把反馈粘贴回来本地保存；它不能读取 ChatGPT 回答，也不能自动评分。</span></p>
  </section>;
}

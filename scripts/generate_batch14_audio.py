import asyncio,shutil,subprocess
from pathlib import Path
import edge_tts,imageio_ffmpeg
F="en-GB-SoniaNeural";M="en-GB-RyanNeural";RATE="-6%"
LESSONS={
"l89":[(F,"Good morning. Your suitcase weighs twenty-six kilograms, which exceeds the allowance by three."),(M,"What are my options?"),(F,"You can pay forty-five pounds, or move items into your cabin baggage. That bag must remain below ten kilograms."),(M,"I will move my books and jewellery."),(F,"Please do not transfer liquids over one hundred millilitres. After repacking, place the suitcase on the scale again. Your flight boards at Gate Eighteen at eleven twenty."),(M,"Can I take this small musical instrument into the cabin?"),(F,"Yes, provided it fits beneath the seat and your total cabin baggage remains within the limit.")],
"l90":[(F,"Thank you for joining the Riverside flood response. Meet at the highland school hall at six thirty, not the riverside depot. Team A will distribute sandbags to homes in Willow Lane. Team B will check on elderly residents and report anyone who is reluctant to leave. Do not enter water above ankle height, and never work alone. Wear the reflective apparel provided and keep your phone in the waterproof pouch. Foam and debris may disguise an open drain, so use the marked route. The auxiliary generator is reserved for the medical centre. If the warning siren sounds continuously, halt your task and return to the school hall. Hot drinks and a brief rest interval are available every two hours.")],
"l91":[(F,"Your dissertation proposal on recruitment prejudice is relevant, but how will you measure bias?"),(F,"We will create two fictional applications with identical qualifications but different names."),(M,"Then managers will rate each candidate's suitability."),(F,"Keep every other attribute constant, including nationality and employment history."),(F,"Should we tell participants the exact hypothesis?"),(M,"Not beforehand, because that could modify their answers. Explain the general purpose, obtain consent and provide a full debrief afterwards."),(M,"I will prepare the application materials and Hana will distribute the online survey."),(F,"Good. Recruit at least sixty managers, and acknowledge that a simulated decision may not predict real behaviour.")],
"l92":[(M,"During an epidemic, information can spread faster than infection. A vivid personal story may become a potent influence even when comparative data point elsewhere. Public agencies sometimes respond with blunt correction, but contempt for frightened people is counterproductive. It can deepen stigma, strengthen biased communities online and make reluctant patients less willing to seek care. Effective communication begins by interpreting the objection rather than assuming ignorance. Some concerns involve genuine access obstacles, such as transport, parental duties or insufficient clinic hours. Others arise from a literal misunderstanding of risk. The remedy differs. Services can deploy mobile clinics, provide interpreters and publish crisp explanations with absolute numbers. Trusted local figures may offer endorsement, but they should disclose uncertainty rather than promise a finite risk of zero. The foremost aim is continuity of care and informed choice. Persuasion becomes more feasible when people are treated as participants, not targets.")],
}
async def render(i,turns,out,tmp):
 d=tmp/i;d.mkdir(parents=True,exist_ok=True);parts=[]
 for n,(v,t) in enumerate(turns):p=d/f"{n:02d}.mp3";await edge_tts.Communicate(t,v,rate=RATE).save(p);parts.append(p)
 dest=out/f"{i}.mp3"
 if len(parts)==1:shutil.copyfile(parts[0],dest)
 else:
  m=d/"concat.txt";m.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in parts),encoding="utf-8");subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),"-y","-f","concat","-safe","0","-i",str(m),"-c","copy",str(dest)],check=True,capture_output=True)
 if dest.stat().st_size<100000:raise RuntimeError(dest)
 print(i,dest.stat().st_size)
async def main():
 out=Path("public/audio");tmp=Path(".tools/audio-batch14-parts");out.mkdir(parents=True,exist_ok=True)
 if tmp.exists():shutil.rmtree(tmp)
 for i,t in LESSONS.items():await render(i,t,out,tmp)
 shutil.rmtree(tmp)
asyncio.run(main())

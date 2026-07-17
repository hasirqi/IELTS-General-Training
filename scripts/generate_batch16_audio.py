import asyncio,shutil,subprocess
from pathlib import Path
import edge_tts,imageio_ffmpeg
F="en-GB-SoniaNeural";M="en-GB-RyanNeural";RATE="-6%";L={
"l97":[(F,"Good morning, British Consulate."),(M,"My passport was stolen, and I need to travel on Friday."),(F,"We can issue an emergency document if your departure is within five days. What is your surname?"),(M,"Haddad, H-A-D-D-A-D."),(F,"The next appointment is tomorrow at nine forty. Bring a police report, two photographs and proof of your flight. The fee is one hundred pounds, payable by card."),(M,"I only have a digital police report."),(F,"That is acceptable if you can forward the complete file beforehand. The document normally expires after one journey, so check any transit requirements with the airline.")],
"l98":[(F,"Welcome to the aquarium conservation tour. Meet beside the blue whale display at ten fifteen. The tour lasts ninety minutes and includes the water-testing laboratory and poultry-sized seabird rescue area, but not the shark tank roof. Wear waterproof shoes because floors may be humid and slippery. Do not touch aquatic animals, feed them or use flash photography. A guide will distribute protective apparel before you enter the laboratory. If an alarm sounds, refrain from using the visitor lift and follow staff through the adjoining service corridor. The tour ends at the coral gallery, where your ticket includes a hot drink from the café buffet.")],
"l99":[(F,"Your bilingual health project needs a narrower question."),(F,"We want to know whether translated appointment reminders reduce missed visits."),(M,"We can compare two rural clinics, one using bilingual messages and one using English only."),(F,"That is plausible, but clinic populations may differ. Record age, travel distance and preferred dialect."),(F,"I will liaise with the clinics and prepare the consent form."),(M,"I will reconcile appointment records and calculate the missed-visit rate."),(F,"Include at least three months before and after the change. Do not derive causation from a simple difference; staff changes or influenza could coincide with the intervention. State those limitations candidly.")],
"l100":[(M,"Mountain communities contend with hazards that can cascade. Relentless precipitation may weaken a slope, trigger a landslide and block the only road before an impending blizzard. Forecasting remains imperfect, so resilience cannot depend on prediction alone. Authorities need a practical blueprint for warnings, evacuation and recovery. A warning must articulate what is expected, where and when, then tell residents what action to take. Overly dramatic language may provoke panic, while a bland message can conceal jeopardy. Trusted bilingual liaison workers are invaluable where dialect or isolation affects comprehension. Drills should equip residents to descend safely, retrieve essential medication and help neighbours who are susceptible to cold. After an event, teams salvage infrastructure, reconcile records and consolidate lessons. The optimum system is not one that boasts perfect accuracy; it is one that mitigates harm, acknowledges uncertainty and enables communities to rebound.")]};
async def r(i,ts,o,tmp):
 d=tmp/i;d.mkdir(parents=True,exist_ok=True);ps=[]
 for n,(v,t) in enumerate(ts):p=d/f"{n}.mp3";await edge_tts.Communicate(t,v,rate=RATE).save(p);ps.append(p)
 dest=o/f"{i}.mp3"
 if len(ps)==1:shutil.copyfile(ps[0],dest)
 else:m=d/"c.txt";m.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in ps),encoding="utf8");subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),"-y","-f","concat","-safe","0","-i",str(m),"-c","copy",str(dest)],check=True,capture_output=True)
 if dest.stat().st_size<100000:raise RuntimeError(dest)
 print(i,dest.stat().st_size)
async def main():
 o=Path("public/audio");tmp=Path(".tools/audio-batch16-parts");o.mkdir(parents=True,exist_ok=True)
 if tmp.exists():shutil.rmtree(tmp)
 for i,t in L.items():await r(i,t,o,tmp)
 shutil.rmtree(tmp)
asyncio.run(main())

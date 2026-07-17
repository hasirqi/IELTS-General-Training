import asyncio, shutil, subprocess
from pathlib import Path
import edge_tts, imageio_ffmpeg
FEMALE="en-GB-SoniaNeural"; MALE="en-GB-RyanNeural"; RATE="-6%"
LESSONS={
"l85":[(FEMALE,"Good morning, Linden Dental Practice."),(MALE,"Hello. I need to move my check-up because I injured my ankle and cannot travel today."),(FEMALE,"Certainly. Could I take your surname?"),(MALE,"Karim, K-A-R-I-M."),(FEMALE,"Dr Patel is available on Monday at eleven forty, or Wednesday at four fifteen."),(MALE,"Wednesday afternoon, please. I also have a dull pain in my lower jaw."),(FEMALE,"I will add that note. The standard check-up is forty-two pounds. If an X-ray is required, the dentist will explain the extra cost first. Please arrive ten minutes early to update your medical form."),(MALE,"Thank you.")],
"l86":[(FEMALE,"Welcome to the Glen Mora guided hike. The route covers eleven kilometres and reaches an altitude of six hundred metres. Conditions are dry at the visitor centre, but hail is possible above the tree line after midday. Wear robust boots and carry a waterproof exterior layer. Each walker needs at least one litre of water and a packed lunch; there is no café on the trail. We will stop at the ruined abbey after four kilometres, then continue inland rather than taking the exposed coastal ridge. If you leave the group, tell a guide first. In an emergency, remain where you are and use the whistle attached to your map case. The final minibus departs the lower car park at five thirty.")],
"l87":[(FEMALE,"Your autonomous bus project needs a testable hypothesis."),(FEMALE,"We think passengers will feel safer when the vehicle explains each deliberate stop."),(MALE,"We could compare two simulations, one with spoken messages and one without."),(FEMALE,"Good. Recruit at least forty participants and record age and previous experience, but keep names confidential."),(FEMALE,"I will coordinate the simulation sessions."),(MALE,"I can analyze the response times and survey scores."),(FEMALE,"Do not imply that the prototype is ready for public roads. Your equipment tests only passenger communication, not collision avoidance. Include that limitation in the report. Submit the diagram of the test layout on Friday and the full analysis two weeks later.")],
"l88":[(MALE,"Offshore wind is often presented as a straightforward source of clean electricity, yet its local impact is composite. Turbines generate energy without burning fuel, and large projects may sustain skilled employment at ports. However, construction can interfere with fishing routes, alter coastal views and require expensive grid connections inland. Public opposition should not be dismissed as ignorance. Some concerns are robust, while others arise from vague or misleading information. A competent planning process must distinguish between them. Developers should disclose expected noise, cable routes and ecological monitoring, then explain how assumptions were calculated. Communities also ask who receives the economic dividend. A symbolic charitable payment rarely creates lasting support. More desirable arrangements include training local recruits, funding harbour infrastructure and sharing a defined portion of revenue. Consent cannot be manufactured by publicity alone; it depends on transparent evidence, credible remedies and deliberate participation before the final decision.")],
}
async def render(lesson_id,turns,output,temp_root):
 folder=temp_root/lesson_id;folder.mkdir(parents=True,exist_ok=True);parts=[]
 for index,(voice,text) in enumerate(turns):
  part=folder/f"{index:02d}.mp3";await edge_tts.Communicate(text,voice,rate=RATE).save(part);parts.append(part)
 destination=output/f"{lesson_id}.mp3"
 if len(parts)==1:shutil.copyfile(parts[0],destination)
 else:
  manifest=folder/"concat.txt";manifest.write_text("".join(f"file '{part.resolve().as_posix()}'\n" for part in parts),encoding="utf-8")
  subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),"-y","-f","concat","-safe","0","-i",str(manifest),"-c","copy",str(destination)],check=True,capture_output=True)
 if destination.stat().st_size<100_000:raise RuntimeError(f"Audio too small: {destination}")
 print(f"generated {destination} ({destination.stat().st_size} bytes)")
async def main():
 output=Path("public/audio");temp=Path(".tools/audio-batch13-parts");output.mkdir(parents=True,exist_ok=True)
 if temp.exists():shutil.rmtree(temp)
 for lesson_id,turns in LESSONS.items():await render(lesson_id,turns,output,temp)
 shutil.rmtree(temp)
asyncio.run(main())

import asyncio, shutil, subprocess
from pathlib import Path
import edge_tts, imageio_ffmpeg

FEMALE="en-GB-SoniaNeural"; MALE="en-GB-RyanNeural"; RATE="-6%"
LESSONS={
"l77":[(FEMALE,"Good morning, Riverside Heating. How can I help?"),(MALE,"The pump beside our hot-water tank is making a harsh noise, and the upstairs radiators are only slightly warm."),(FEMALE,"Is there any water beneath the pump?"),(MALE,"No, the floor is dry."),(FEMALE,"We can send an engineer on Tuesday between eight and ten, or Wednesday between one and four."),(MALE,"Tuesday morning, please."),(FEMALE,"The inspection fee is sixty pounds, but it will be removed from the bill if you approve the repair. Please make sure an adult can provide access to the storage cabin behind the kitchen."),(MALE,"That is fine. I will be at home.")],
"l78":[(FEMALE,"Welcome to the evening harbour cruise. Boarding begins at Booth Six at half past five, and the vessel will leave at six. Keep your printed ticket available until you enter the main cabin. Small bags may be stored beneath your seat, but larger cases must remain at the terminal. The upper deck provides a striking view of the historic naval buildings. However, passengers should use the handrail because the surface may be wet. Food is not permitted outside the cabin, although drinks in closed bottles are allowed. If fog reduces visibility, the captain will shorten the route rather than cancel the cruise. In an emergency, remain calm and follow the crew in orange jackets.")],
"l79":[(FEMALE,"We need to revise the staff wellbeing survey. Last year, the questions focused mainly on workload."),(MALE,"That was too narrow. This time we should include management support, flexible hours and whether people feel respected."),(FEMALE,"Agreed. Responses must remain anonymous, but we still need to compare broad departments."),(MALE,"We can ask employees to select a department, provided no result is published for a group of fewer than ten people."),(FEMALE,"Good. I also want one blank box for comments, although we should warn staff not to include names."),(MALE,"When will the survey close?"),(FEMALE,"At noon on the eighteenth. We will publish a summary, then hold three discussion sessions to gather possible solutions."),(MALE,"Make it clear that the sessions are not part of the anonymous survey.")],
"l80":[(MALE,"Video surveillance is now widespread in metropolitan transport, retail and public space. Supporters argue that visible cameras can discourage some offences and provide a clue after an incident. Opponents point to privacy, facial recognition and the risk of unequal monitoring. Both positions sometimes exaggerate the evidence. A camera may record an event without preventing it, while an anonymous dataset may still identify individuals when combined with other information. Policy should therefore begin with a precise purpose. Authorities must explain what problem a system is intended to tackle, how long recordings are kept and who may examine them. Independent audits should test whether the benefits justify the intrusion. Public consent is not meaningful when surveillance is hidden or impossible to challenge. Trust depends less on the number of cameras than on transparent limits, secure handling and a genuine route for complaints.")],
}

async def render(lesson_id,turns,output,temp_root):
    folder=temp_root/lesson_id; folder.mkdir(parents=True,exist_ok=True); parts=[]
    for index,(voice,text) in enumerate(turns):
        part=folder/f"{index:02d}.mp3"; await edge_tts.Communicate(text,voice,rate=RATE).save(part); parts.append(part)
    destination=output/f"{lesson_id}.mp3"
    if len(parts)==1: shutil.copyfile(parts[0],destination)
    else:
        manifest=folder/"concat.txt"; manifest.write_text("".join(f"file '{part.resolve().as_posix()}'\n" for part in parts),encoding="utf-8")
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),"-y","-f","concat","-safe","0","-i",str(manifest),"-c","copy",str(destination)],check=True,capture_output=True)
    if destination.stat().st_size<100_000: raise RuntimeError(f"Audio too small: {destination}")
    print(f"generated {destination} ({destination.stat().st_size} bytes)")

async def main():
    output=Path("public/audio"); temp=Path(".tools/audio-batch11-parts"); output.mkdir(parents=True,exist_ok=True)
    if temp.exists(): shutil.rmtree(temp)
    for lesson_id,turns in LESSONS.items(): await render(lesson_id,turns,output,temp)
    shutil.rmtree(temp)
asyncio.run(main())

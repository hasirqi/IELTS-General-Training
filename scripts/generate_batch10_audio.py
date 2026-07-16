import asyncio, shutil, subprocess
from pathlib import Path
import edge_tts, imageio_ffmpeg

FEMALE="en-GB-SoniaNeural"; MALE="en-GB-RyanNeural"; RATE="-6%"
LESSONS={
"l73":[(FEMALE,"Good morning. How can I help?"),(MALE,"I am travelling abroad next Thursday and need some local currency."),(FEMALE,"Which country are you visiting?"),(MALE,"Japan, for twelve days. I would like to exchange six hundred pounds."),(FEMALE,"We can prepare the yen by four tomorrow afternoon. There is no commission for amounts above five hundred pounds."),(MALE,"Great. Does your standard travel insurance cover lost luggage?"),(FEMALE,"Yes, up to one thousand five hundred pounds, but expensive electronic devices need to be listed separately."),(MALE,"I have one camera worth eight hundred pounds."),(FEMALE,"I will add it. Please bring your passport when you collect the currency.")],
"l74":[(FEMALE,"Welcome to the Hillside charity walk. The full route forms a twelve-kilometre loop, while the junior route is five kilometres. Both begin at the sports arena, but only the longer route crosses the narrow wooden bridge. Wear proper walking shoes and carry a waterproof layer, because the forecast includes rough weather after midday. Water is available at kilometres four and nine. The photography team will be visible in orange jackets. If you are injured, do not continue alone: call the number on your belt card and wait beside a route marker. All walkers must return their timing chip at the finish, even if they leave the event early.")],
"l75":[(FEMALE,"The feedback shows that staff found the virtual safety course boring."),(MALE,"The visual content was strong, but each section was too long."),(FEMALE,"I suggest dividing it into six short units and adding a practical choice after every video."),(MALE,"Good. The chemical-handling unit must remain first because it contains fundamental information."),(FEMALE,"Agreed. We can move the fire procedure to unit three and create a final sequence task."),(MALE,"What about the online forum?"),(FEMALE,"Keep it open for questions, but a trainer should reply within one working day."),(MALE,"Let us test the new version with the junior team, collect their input, and compare completion time and error frequency.")],
"l76":[(MALE,"High population density is often regarded as a health risk, but density alone does not define the outcome. Compact neighbourhoods can support frequent public transport, nearby clinics and daily walking. Problems arise when housing is overcrowded, ventilation is poor and green space is scarce. These are distinct conditions, although they may occur together. Research also shows that social connection can protect mental health. A busy district with active community groups may therefore produce better results than a lower-density area where residents feel isolated. Effective policy combines decent housing standards, visible public space, clean transport and access to care. It must also examine equity: an average improvement can hide severe conditions in one ward. The principle is simple. Measure the actual living environment, not only the number of people within a square kilometre.")],
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
    output=Path("public/audio"); temp=Path(".tools/audio-batch10-parts"); output.mkdir(parents=True,exist_ok=True)
    if temp.exists(): shutil.rmtree(temp)
    for lesson_id,turns in LESSONS.items(): await render(lesson_id,turns,output,temp)
    shutil.rmtree(temp)
asyncio.run(main())

import asyncio, shutil, subprocess
from pathlib import Path
import edge_tts, imageio_ffmpeg

FEMALE="en-GB-SoniaNeural"; MALE="en-GB-RyanNeural"; RATE="-6%"
LESSONS={
"l81":[(FEMALE,"Good afternoon, Meadow Court Community Centre."),(MALE,"Hello. I am calling about the shared laundry. The second washing machine is leaking underneath, and the floor is becoming wet."),(FEMALE,"Thank you for reporting it. Is the machine still running?"),(MALE,"No, I switched it off at the wall."),(FEMALE,"Good. An engineer can visit on Wednesday between nine and eleven, or Thursday after three."),(MALE,"Wednesday morning is better."),(FEMALE,"There is no inspection charge because the machine belongs to the centre. Please place the yellow warning sign beside the door and keep the room locked until the engineer arrives."),(MALE,"I will do that now.")],
"l82":[(FEMALE,"Welcome to Harbour Maritime Museum. The main galleries open at ten, but the café and ticket desk are available from half past nine. Large bags must be left in the lockers beside the eastern entrance. Families with children aged six to twelve can collect a free fossil trail sheet at the information desk. The ship model workshop begins at one fifteen in Studio Three and requires advance booking. Visitors using wheelchairs should take the glass lift to the upper deck gallery because the historic staircase is narrow. Photography is allowed without flash, except inside the temporary pirate exhibition. The museum closes at five, and the final guided tour leaves the main hall at three forty-five.")],
"l83":[(FEMALE,"Your proposal for the food bank project is promising, but the objective needs to be more precise."),(FEMALE,"We intend to measure how much fresh food is wasted by local shops."),(MALE,"Then we will ask whether they can donate suitable items."),(FEMALE,"Good, but do not collect food yourselves during the research stage. First interview six shop managers and record the type and approximate weight of waste."),(FEMALE,"I can design the interview form."),(MALE,"I will contact the shops and arrange appointments."),(FEMALE,"Include dairy products as a separate category because they require careful storage. Also, do not publish the names of businesses without written consent. Your interim report is due on the twelfth, and the final presentation will be one week later.")],
"l84":[(MALE,"Extreme heat is becoming a routine public-health challenge rather than an exceptional event. Its effect is not limited to direct illness. Hot nights interrupt sleep, reduce concentration and increase pressure on hospitals. Older adults, infants and people in poorly insulated housing face the greatest risk, but vulnerability also depends on income and access to transport. A viable response combines immediate warnings with long-term adaptation. Cities can open cool public rooms, extend library hours and contact isolated residents during an outbreak of heat. They can also plant shade trees, improve building standards and reduce dark surfaces that store energy. However, a policy should not be judged by the number of measures announced. Officials need transparent data showing who used each service and whether hospital admissions fell. The most elegant plan is useless if residents cannot understand the warning or reach the help provided.")],
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
    output=Path("public/audio"); temp=Path(".tools/audio-batch12-parts"); output.mkdir(parents=True,exist_ok=True)
    if temp.exists(): shutil.rmtree(temp)
    for lesson_id,turns in LESSONS.items(): await render(lesson_id,turns,output,temp)
    shutil.rmtree(temp)
asyncio.run(main())

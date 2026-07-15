import asyncio
import shutil
import subprocess
from pathlib import Path

import edge_tts
import imageio_ffmpeg

FEMALE = "en-GB-SoniaNeural"
MALE = "en-GB-RyanNeural"
RATE = "-6%"

LESSONS = {
    "l5": [
        (FEMALE, "Riverside Community Centre. How can I help?"),
        (MALE, "I'd like to join the weekend cooking course."),
        (FEMALE, "The next course begins on Saturday the ninth of October and runs for four weeks. It starts at eleven fifteen."),
        (MALE, "That's fine. How much is it?"),
        (FEMALE, "Forty-eight pounds, including ingredients. Could I take your surname?"),
        (MALE, "Yes, Dolgor. D O L G O R."),
        (FEMALE, "Thank you. Please pay a twenty-pound deposit by Wednesday."),
    ],
    "l6": [
        (FEMALE, "Northside Property Services."),
        (MALE, "Hello, the heating in my flat has stopped working."),
        (FEMALE, "What's the address?"),
        (MALE, "Flat six, forty-two Cedar Road. The radiators are cold, but the hot water is still working."),
        (FEMALE, "When did the problem start?"),
        (MALE, "Late on Monday evening."),
        (FEMALE, "An engineer can visit tomorrow between one and three, or Thursday morning between eight and ten."),
        (MALE, "Tomorrow afternoon is better."),
        (FEMALE, "Please make sure someone over eighteen is at home."),
    ],
    "l7": [
        (FEMALE, "City Shuttle Bookings."),
        (MALE, "I need a transfer from the airport on the twenty-third of June."),
        (FEMALE, "What is your flight number?"),
        (MALE, "B A two seven four. It lands at eighteen forty. There will be three adults and one child."),
        (FEMALE, "Our driver will meet you outside Exit B, beside the information desk. The total fare is sixty-five pounds, and a child seat is included."),
        (MALE, "Great. Please book it under the name Erdene."),
    ],
    "l8": [
        (FEMALE, "Harbour Fitness Centre."),
        (MALE, "I'd like to become a member."),
        (FEMALE, "We have a monthly plan for thirty-six pounds or an annual plan for three hundred and sixty. The annual plan includes two free sessions with a trainer."),
        (MALE, "I'll take the monthly plan first."),
        (FEMALE, "Fine. May I have your date of birth?"),
        (MALE, "The fourteenth of February, nineteen ninety-two."),
        (FEMALE, "You can pay by card today. The membership will begin on Monday."),
    ],
    "l9": [(MALE, "Before you begin work, collect a yellow safety vest from the office beside the main entrance. Protective shoes are required in every storage area, but gloves are only compulsory in the cold room. Breaks are taken in the staff kitchen on the second floor; food must not be brought into the warehouse. If the fire alarm sounds, leave through the nearest marked exit and meet beside the north car park. Do not return until a manager gives permission.")],
    "l10": [(FEMALE, "The Green Lane Recycling Centre accepts paper, glass, metal and small electrical items. Garden waste should be taken to Bay Four, while paint and household chemicals must be handed directly to a member of staff at Bay Seven. The centre cannot accept building materials from commercial work. Residents may visit without charge, but they should bring proof of address. We open at eight thirty every day except Wednesday, when the centre opens at ten. Last entry is twenty minutes before closing.")],
    "l11": [(FEMALE, "Thank you for volunteering at Saturday's community festival. Registration opens at eight, and all volunteers should arrive by eight fifteen for a short briefing. The public enters at nine thirty. People working at the information tent will wear blue shirts; those helping with children's activities will wear green. Lunch vouchers are provided, but please bring your own water bottle. If heavy rain is expected, the outdoor music will move to the sports hall. Check your phone after seven on Saturday morning for any final change.")],
    "l12": [(MALE, "The coastal walk is six kilometres long and normally takes about two hours. From the visitor centre, follow the red signs towards Lighthouse Point. The path is narrow after the wooden bridge, so cyclists must use the lower road instead. There are toilets at the visitor centre and beside the lighthouse, but the small café is closed on Mondays. At high tide, the final beach section may be unsafe. A blue warning flag means you should return by the inland path.")],
    "l13": [
        (FEMALE, "We need at least eighty responses for our transport survey. I thought we could stand outside the station on Friday evening."),
        (MALE, "That would mainly reach commuters. We also need older residents and people who work from home."),
        (FEMALE, "Good point. Let's use the station on Friday, the market on Saturday morning and an online form for the rest."),
        (MALE, "I'll design the questions, but we should test them with five people first."),
        (FEMALE, "Agreed. I'll contact the market manager for permission and prepare a short information sheet explaining how the data will be used."),
    ],
    "l14": [
        (MALE, "The project management course is available online or as a two-day workshop. The online version is cheaper and we can start at any time."),
        (FEMALE, "True, but several people said the feedback is slow. The workshop costs more, although it includes practice with a tutor."),
        (MALE, "Our department can pay up to two hundred pounds, so the workshop is still possible if we cover the travel ourselves."),
        (FEMALE, "In that case, I prefer the workshop. The next one is in Bristol on the twelfth and thirteenth of November."),
        (MALE, "Let's ask the manager today because registration closes on Friday."),
    ],
    "l15": [(FEMALE, "Sleep is not simply a period of inactivity. During sleep, the brain strengthens some of the connections formed while we were awake. In one study, adults learned pairs of unfamiliar words. Half reviewed the words in the morning and were tested that evening; the others studied in the evening and were tested after a night's sleep. The second group remembered more. However, sleep did not replace practice. Participants who made an active attempt to recall each word before sleeping performed better than those who only reread the list. Researchers also warn that one good night cannot fully correct weeks of poor sleep.")],
    "l16": [(MALE, "Urban trees cool cities in two main ways. Their leaves provide shade, reducing the amount of solar energy absorbed by roads and buildings. Trees also release water vapour, which cools the surrounding air. A survey in three neighbourhoods found that streets with mature trees were up to four degrees cooler on summer afternoons. Yet planting any tree anywhere is not enough. Young trees need water during their first years, and species must suit local soil and rainfall. Planners should also avoid blocking street lights or damaging underground pipes. The strongest results come when tree planting is combined with lighter road surfaces and accessible public parks.")],
}

async def render_lesson(lesson_id, turns, output_dir, temp_root):
    lesson_temp = temp_root / lesson_id
    lesson_temp.mkdir(parents=True, exist_ok=True)
    parts = []
    for index, (voice, text) in enumerate(turns):
        part = lesson_temp / f"{index:02d}.mp3"
        await edge_tts.Communicate(text, voice, rate=RATE).save(part)
        parts.append(part)

    destination = output_dir / f"{lesson_id}.mp3"
    if len(parts) == 1:
        shutil.copyfile(parts[0], destination)
    else:
        concat_file = lesson_temp / "concat.txt"
        concat_file.write_text("".join(f"file '{part.resolve().as_posix()}'\n" for part in parts), encoding="utf-8")
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file), "-c", "copy", str(destination)], check=True)
    print(f"generated {destination} ({destination.stat().st_size} bytes)")

async def main():
    output = Path("public/audio")
    temp_root = Path(".tools/audio-v2-parts")
    output.mkdir(parents=True, exist_ok=True)
    if temp_root.exists():
        shutil.rmtree(temp_root)
    for lesson_id, turns in LESSONS.items():
        await render_lesson(lesson_id, turns, output, temp_root)
    shutil.rmtree(temp_root)

asyncio.run(main())

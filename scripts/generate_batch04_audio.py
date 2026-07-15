import asyncio
import shutil
import subprocess
from pathlib import Path

import edge_tts
import imageio_ffmpeg

FEMALE = "en-GB-SoniaNeural"
MALE = "en-GB-RyanNeural"
SECOND_MALE = "en-GB-ThomasNeural"
RATE = "-6%"

LESSONS = {
    "l33": [
        (FEMALE, "Riverside Dental Practice."),
        (MALE, "I'd like an appointment because a filling has become loose."),
        (FEMALE, "Can I take your name?"),
        (MALE, "Sora Malik. S O R A, M A L I K."),
        (FEMALE, "We have Tuesday at nine twenty or Wednesday at three forty."),
        (MALE, "Tuesday morning, please."),
        (FEMALE, "Arrive ten minutes early to update your medical form. The examination costs thirty-two pounds, but any treatment will be discussed separately."),
    ],
    "l34": [
        (FEMALE, "Rail lost property."),
        (MALE, "I left a backpack on the eight oh five train from Hinton to Crewe this morning. I was in coach C, seat twenty-four."),
        (FEMALE, "Please describe it."),
        (MALE, "It is dark blue with a grey handle. There is a red notebook and a pair of glasses inside, but no money."),
        (FEMALE, "We may receive it after six this evening. Your report number is L P six one eight. If it is found, collect it from Platform Office two and bring photo identification."),
    ],
    "l35": [(FEMALE, "The Central Library will close from the third to the sixteenth of June while new heating is installed. A temporary desk in West Community Hall will open from ten until four on weekdays. You can collect reserved books there, but the general shelves will not be available. Return books through the box beside the library's rear gate; fines will be paused during the closure. Public computers can be used at North College after showing a library card. Children's story time will move online, while the local history workshop has been postponed until July.")],
    "l36": [(MALE, "Wednesday's fire drill will begin at eleven fifteen and should last about twenty minutes. When the alarm sounds, leave by the nearest safe staircase; do not use the lifts or stop to collect personal belongings. Teams on floors one to three should assemble in Zone C of the rear car park. Staff from higher floors should use Zone D. Fire wardens will check meeting rooms and toilets. Employees hosting visitors must keep them together and report their names to the zone marshal. Nobody may re-enter until the safety officer gives a clear verbal instruction.")],
    "l37": [
        (MALE, "How will you study attitudes to food packaging?"),
        (FEMALE, "We first planned to ask whether plastic packaging is harmful."),
        (MALE, "That may push people towards one answer."),
        (SECOND_MALE, "Then we can show three package types and ask which they would choose."),
        (MALE, "Better. Survey eighty shoppers, split equally between the morning and afternoon."),
        (FEMALE, "I'll record age groups and choices in a spreadsheet."),
        (SECOND_MALE, "I'll photograph the packages and calculate price differences."),
        (MALE, "Present a bar chart, not a pie chart, and include two limitations in your report due next Friday."),
    ],
    "l38": [
        (MALE, "We need evidence about transport problems for older residents."),
        (FEMALE, "An online questionnaire would be quick."),
        (SECOND_MALE, "But it could exclude people who rarely use the internet."),
        (MALE, "Exactly. Conduct forty short telephone interviews instead, including residents from all five neighbourhoods."),
        (FEMALE, "I'll prepare the contact list and call the western areas."),
        (SECOND_MALE, "I'll cover the other three."),
        (MALE, "Mark every difficult bus stop on a map and note whether the issue is distance, seating or lighting. Send the interview summary by Monday and the completed map by Wednesday."),
    ],
    "l39": [(FEMALE, "A cool roof uses a pale or specially coated surface to reflect more sunlight than a conventional dark roof. This can reduce indoor temperatures and lower summer demand for air conditioning. In one school study, top-floor classrooms were up to three degrees cooler after the roof changed. The effect was smaller on cloudy days and in rooms on lower floors. Critics note that cool roofs may slightly increase winter heating needs, although this matters less in warm climates. They work best when insulation is also improved and should not replace shade, ventilation or urban trees.")],
    "l40": [(MALE, "Household water meters charge residents for the amount they use rather than a fixed annual fee. Studies often find an initial fall in consumption because people notice everyday habits and repair leaks sooner. However, the size of the reduction varies with climate, household size and the original price system. There is also a fairness concern: large low-income families may need more water for essential use. Some providers therefore offer reduced tariffs and free leak repairs. Researchers warn that comparing metered and unmetered homes can be misleading if the two groups differ before meters are installed.")],
}


async def render(lesson_id, turns, output_dir, temp_root):
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
        concat = lesson_temp / "concat.txt"
        concat.write_text("".join(f"file '{part.resolve().as_posix()}'\n" for part in parts), encoding="utf-8")
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", str(destination)], check=True)
    print(f"generated {destination} ({destination.stat().st_size} bytes)")


async def main():
    output = Path("public/audio")
    temp_root = Path(".tools/audio-batch04-parts")
    output.mkdir(parents=True, exist_ok=True)
    if temp_root.exists():
        shutil.rmtree(temp_root)
    for lesson_id, turns in LESSONS.items():
        await render(lesson_id, turns, output, temp_root)
    shutil.rmtree(temp_root)


asyncio.run(main())

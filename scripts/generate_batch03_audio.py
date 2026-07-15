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
    "l25": [
        (FEMALE, "CityNet support."),
        (MALE, "My home internet stopped working yesterday."),
        (FEMALE, "May I have the account number?"),
        (MALE, "C N four eight two one. The address is Flat seven, thirty-six Mill Road."),
        (FEMALE, "What lights can you see on the router?"),
        (MALE, "The power light is green, but the internet light is red."),
        (FEMALE, "An engineer can visit on Thursday between two and four."),
        (MALE, "That's fine."),
        (FEMALE, "Your reference is R nine one five. Please keep the router switched on."),
    ],
    "l26": [
        (FEMALE, "HomeStore deliveries."),
        (MALE, "I need to change the delivery for order H S seven three six. It is currently booked for Monday the fourteenth."),
        (FEMALE, "We can move it to Wednesday the sixteenth, between eight and noon."),
        (MALE, "Good. The flat is on the fourth floor, and the lift is working."),
        (FEMALE, "Fine. The driver will call thirty minutes before arrival. There is no charge for changing the date once, but another change would cost fifteen pounds."),
    ],
    "l27": [(FEMALE, "From next Monday, the main staff restaurant will close for six weeks while the kitchen is replaced. A temporary canteen will operate in Meeting Hall B from seven thirty until two. Breakfast will be available until ten, and hot lunches from eleven thirty. The temporary site cannot accept cash, so use a staff card or bank card. Free drinking water is provided, but there will be no coffee machine. Please send comments through the facilities page rather than speaking to catering staff during busy periods.")],
    "l28": [(MALE, "Welcome to the beginner swimming course. Meet your instructor beside Pool two, not at the main reception. Changing-room lockers take a one-pound coin, which is returned when you reopen the locker. Bring a towel and swimming goggles, but floats are supplied by the centre. The first lesson includes a short water-safety check, so please tell the instructor about any medical condition before entering the pool. The lesson ends at eight forty-five, and the changing rooms close at nine fifteen.")],
    "l29": [
        (MALE, "What will your local history exhibition focus on?"),
        (FEMALE, "The old railway works. We found photographs in the town archive."),
        (MALE, "I also want to interview former employees."),
        (MALE, "Good, but get written permission before recording anyone."),
        (FEMALE, "I'll select six photographs and write the captions."),
        (MALE, "I'll prepare the interview questions and contact the workers' association."),
        (MALE, "Bring your draft display plan next Tuesday. The final exhibition opens on the third of October, so all audio must be edited a week before that."),
    ],
    "l30": [
        (MALE, "How are you analysing the complaint records?"),
        (MALE, "We grouped them into delivery, product quality and communication."),
        (FEMALE, "Delivery is the largest group, but we only checked one month."),
        (MALE, "Use the last three months so the pattern is more reliable."),
        (MALE, "We planned a pie chart."),
        (MALE, "A bar chart will make the categories easier to compare."),
        (FEMALE, "Then we can examine the five most serious delivery cases and suggest changes."),
        (MALE, "Good. Send me the chart by Thursday morning and present your recommendations on Friday."),
    ],
    "l31": [(FEMALE, "Environmental noise is unwanted sound from sources such as roads, aircraft and construction. Its effect is not limited to hearing. Night-time noise can interrupt sleep even when a person does not fully wake up. One city study linked bedrooms facing busy roads with higher reports of tiredness, although the researchers could not remove every difference between households. Reducing speed limits can lower traffic noise, while trees alone usually provide little sound protection unless they form a very dense barrier. Building design, including quieter sides for bedrooms, may therefore be more effective.")],
    "l32": [(MALE, "A twelve-week food-waste trial gave six hundred households a small kitchen container and a larger outdoor bin. Collections took place every Friday. By week four, about sixty-eight per cent of homes were using the service, but participation then stopped growing. Interviews showed that residents in flats had nowhere convenient to store the outdoor bin. Families also wanted clearer information about whether cooked food was accepted. The council responded with smaller shared bins for apartment buildings and a picture-based guide. In the final month, the average weight collected per participating home increased by fifteen per cent.")],
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
    temp_root = Path(".tools/audio-batch03-parts")
    output.mkdir(parents=True, exist_ok=True)
    if temp_root.exists():
        shutil.rmtree(temp_root)
    for lesson_id, turns in LESSONS.items():
        await render(lesson_id, turns, output, temp_root)
    shutil.rmtree(temp_root)


asyncio.run(main())

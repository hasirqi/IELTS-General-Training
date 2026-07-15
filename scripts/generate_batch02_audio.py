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
    "l17": [
        (FEMALE, "North Power, how can I help?"),
        (MALE, "I'm moving and need to close the account at fourteen Lime Street."),
        (FEMALE, "What date are you leaving?"),
        (MALE, "The twelfth of August. My new address is eighty-two Park Road, Bristol."),
        (FEMALE, "And your final meter reading?"),
        (MALE, "Four six three seven."),
        (FEMALE, "Thank you. Would you like the final bill by post?"),
        (MALE, "Email is better. Please keep the direct debit active until the final payment has been taken."),
    ],
    "l18": [
        (FEMALE, "Riverside Adult College."),
        (MALE, "I'd like to join the evening photography course."),
        (FEMALE, "The eight-week course starts on Tuesday the sixth of September at seven. It is in Room B twelve."),
        (MALE, "How much is it?"),
        (FEMALE, "Ninety-six pounds. You can use the college cameras, but you need to bring your own memory card."),
        (MALE, "That's fine."),
        (FEMALE, "Please arrive fifteen minutes early on the first evening to collect your student card."),
    ],
    "l19": [(FEMALE, "Welcome to Hillview Community Garden. On Saturday, enter through the north gate, which opens at eight. New members should meet beside the greenhouse at eight thirty for a short induction. Tools are kept in the wooden shed, but please return them before the garden closes at one. Your group will work on Plot fourteen near the water tanks. We do not use chemical weed killers here. At midday, tea is provided in the kitchen, although members should bring their own lunch.")],
    "l20": [(MALE, "Thank you for volunteering at Barton Museum. On your first day, arrive at the staff entrance on King Lane at nine fifteen. Do not use the public entrance. At reception you will receive a blue name badge and a locker key. The morning session is in the transport gallery, where you will help visitors find exhibits. Lunch is provided, but bring a bottle of water. If the fire alarm sounds, guide visitors to the courtyard and report to the senior guide wearing a red badge.")],
    "l21": [
        (MALE, "How is your staff orientation project going?"),
        (FEMALE, "We planned to make a video, but editing would take too long."),
        (MALE, "So we suggest a poster and a five-minute talk."),
        (FEMALE, "That is more realistic. What evidence will you use?"),
        (MALE, "We will survey twenty new employees about their first week. I'll design the questions, and Mina will analyse the answers."),
        (FEMALE, "Good. Show me the draft poster on Friday. Your final presentation is next Wednesday, not Monday as written on the old schedule."),
    ],
    "l22": [
        (FEMALE, "Tell me about your transport survey."),
        (MALE, "We want to interview sixty commuters outside Central Station between seven and nine in the morning."),
        (FEMALE, "Our first question asks whether people agree that buses are unreliable."),
        (MALE, "That wording may lead people towards one answer. Ask how often their bus arrives late instead."),
        (FEMALE, "We should test the questions first."),
        (MALE, "Yes, pilot them with five classmates."),
        (FEMALE, "We can do that tomorrow and submit the revised survey on the eighteenth of May."),
    ],
    "l23": [(FEMALE, "Night work can disturb the body's internal clock because light normally tells the brain when to be awake. Workers often try to solve tiredness with coffee, but caffeine during the final four hours of a shift can delay sleep. A short nap before work may help; research suggests about twenty minutes, since a longer nap can leave people less alert. After a night shift, the bedroom should be dark, quiet and cool. Regular meal times also help the body adjust better than eating one large meal before bed.")],
    "l24": [(MALE, "The first Repair Cafe opened in Amsterdam in two thousand and nine. These events bring residents and volunteer repairers together to fix small electrical items, clothes and bicycles. Their purpose is not only to reduce waste but also to share practical skills. Electrical items must pass a safety test before owners take them home. In one local survey, seventy-two per cent of items were repaired successfully. However, participants said the greatest benefit was confidence: after watching a repair, many felt able to maintain other possessions themselves.")],
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
    temp_root = Path(".tools/audio-batch02-parts")
    output.mkdir(parents=True, exist_ok=True)
    if temp_root.exists():
        shutil.rmtree(temp_root)
    for lesson_id, turns in LESSONS.items():
        await render(lesson_id, turns, output, temp_root)
    shutil.rmtree(temp_root)


asyncio.run(main())

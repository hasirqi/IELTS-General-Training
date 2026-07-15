import asyncio
import shutil
import subprocess
from pathlib import Path

import edge_tts
import imageio_ffmpeg

FEMALE = "en-GB-SoniaNeural"
MALE = "en-GB-RyanNeural"
RATE = "-8%"

LESSONS = {
    "l1": [
        (FEMALE, "Good morning, Green Street Clinic. How can I help?"),
        (MALE, "I'd like to make an appointment with a doctor."),
        (FEMALE, "Certainly. Could I take your name?"),
        (MALE, "Yes, it's Naran Bat — N A R A N, B A T."),
        (FEMALE, "Thank you. Doctor Evans is available on Thursday the eighteenth at ten thirty, or Friday at two fifteen."),
        (MALE, "Thursday morning, please."),
        (FEMALE, "Fine. Please arrive ten minutes early and bring photo identification."),
    ],
    "l2": [(FEMALE, "Welcome to Westfield Library. The ground floor has returns and new books. Computers are on the first floor, beside the study room. Members may use a computer for one hour. The children's area closes at six, but the main library remains open until eight from Monday to Thursday. On Friday, the whole building closes at five thirty.")],
    "l3": [
        (FEMALE, "I first chose the customer service course because it was cheaper."),
        (MALE, "But it clashes with your Friday shift."),
        (FEMALE, "Exactly. So I've changed to workplace communication on Tuesday evenings. It costs twenty pounds more, but my manager says the company may pay half."),
        (MALE, "That sounds useful. Are you still doing the online safety module?"),
        (FEMALE, "Yes. It's compulsory, and I must finish it before the end of May."),
    ],
    "l4": [(MALE, "Community gardens do more than produce food. First, they turn unused land into shared space. Second, regular gardening can reduce stress and provide gentle exercise. Our survey found that most new members joined to meet neighbours, not to save money. However, water use remains a concern. The project therefore collects rainwater from the community hall roof and uses wood chips to keep moisture in the soil.")],
}

async def render_lesson(lesson_id, turns, output_dir, temp_root):
    lesson_temp = temp_root / lesson_id
    lesson_temp.mkdir(parents=True, exist_ok=True)
    parts = []
    for index, (voice, text) in enumerate(turns):
        part = lesson_temp / f"{index:02d}.mp3"
        await edge_tts.Communicate(text, voice, rate=RATE).save(part)
        parts.append(part)

    if len(parts) == 1:
        shutil.copyfile(parts[0], output_dir / f"{lesson_id}.mp3")
    else:
        concat_file = lesson_temp / "concat.txt"
        concat_file.write_text("".join(f"file '{part.resolve().as_posix()}'\n" for part in parts), encoding="utf-8")
        subprocess.run([
            imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-f", "concat", "-safe", "0",
            "-i", str(concat_file), "-c", "copy", str(output_dir / f"{lesson_id}.mp3")
        ], check=True)
    print(f"generated {lesson_id}.mp3 ({len(turns)} voice turn(s))")

async def main():
    output = Path("public/audio")
    temp_root = Path(".tools/audio-parts")
    output.mkdir(parents=True, exist_ok=True)
    if temp_root.exists(): shutil.rmtree(temp_root)
    for lesson_id, turns in LESSONS.items():
        await render_lesson(lesson_id, turns, output, temp_root)
    shutil.rmtree(temp_root)

asyncio.run(main())

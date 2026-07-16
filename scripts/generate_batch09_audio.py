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
    "l69": [
        (FEMALE, "Riverside Arts Festival, how can I help?"),
        (MALE, "I would like to join the volunteer team for Saturday."),
        (FEMALE, "Certainly. Can I take your name?"),
        (MALE, "Leo Matsuda, M A T S U D A."),
        (FEMALE, "We have a morning shift from eight thirty until one, or an afternoon shift from twelve thirty until five."),
        (MALE, "The afternoon shift suits me."),
        (FEMALE, "Would you prefer the ticket counter or crowd guidance?"),
        (MALE, "Crowd guidance, please."),
        (FEMALE, "Fine. Meet the crew beside the theatre's east entrance at twelve fifteen. Wear comfortable shoes, and we will provide a yellow vest."),
    ],
    "l70": [(FEMALE, "Because severe rain has damaged the ground-floor electrical system, Central Library will remain closed until Thursday. The mobile library will stop outside the community arts centre from ten until four on Tuesday and Wednesday. It can accept returns, issue reserved books and help members use the online platform, but it cannot create new memberships. Items due during the closure will be renewed automatically, so no late charge will be added. The study room at North Branch has extended opening until eight in the evening. Please do not leave books outside Central Library, because the external return box is also out of service.")],
    "l71": [
        (FEMALE, "The latest staff survey shows increased stress on the night shift."),
        (MALE, "The response rate was poor, though. Only twenty-four people completed it."),
        (FEMALE, "True. For the next survey, we should guarantee that answers are anonymous."),
        (MALE, "And use specific questions. Asking whether work is difficult is too general. We could ask about workload, break length and supervisor support separately."),
        (FEMALE, "Good point. Let us also offer paper copies to staff who rarely use the online platform."),
        (MALE, "What happens after the survey?"),
        (FEMALE, "We will compare departments, then hold two small discussion groups before drafting recommendations."),
        (MALE, "That makes the process more credible."),
    ],
    "l72": [(MALE, "The Blue Cape path has become one of the region's leading attractions. Visitor revenue supports local businesses, but heavy foot traffic has damaged vegetation near the cliff edge. The problem is not simply the total crowd. Most damage occurs at three viewpoints where people leave the marked path to take photographs. Rangers first considered a complete seasonal closure. Instead, they installed low barriers, moved signs to eye level and created two stronger viewing platforms. Independent monitoring found that off-path movement fell by sixty percent in the first year. The project also uses volunteer guides during the summer peak. Its ultimate success, however, depends on constant maintenance and whether visitors continue to respect the route after the guides leave.")],
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
        manifest = lesson_temp / "concat.txt"
        manifest.write_text("".join(f"file '{part.resolve().as_posix()}'\n" for part in parts), encoding="utf-8")
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-f", "concat", "-safe", "0", "-i", str(manifest), "-c", "copy", str(destination)], check=True, capture_output=True)
    if destination.stat().st_size < 100_000:
        raise RuntimeError(f"Generated audio is unexpectedly small: {destination}")
    print(f"generated {destination} ({destination.stat().st_size} bytes)")

async def main():
    output = Path("public/audio")
    temp_root = Path(".tools/audio-batch09-parts")
    output.mkdir(parents=True, exist_ok=True)
    if temp_root.exists():
        shutil.rmtree(temp_root)
    for lesson_id, turns in LESSONS.items():
        await render(lesson_id, turns, output, temp_root)
    shutil.rmtree(temp_root)

asyncio.run(main())

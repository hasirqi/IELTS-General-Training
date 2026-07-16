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
    "l65": [
        (FEMALE, "Good afternoon. How can I help?"),
        (MALE, "I am here to collect a repeat prescription for Mina Dorj."),
        (FEMALE, "Could you confirm your date of birth?"),
        (MALE, "The seventeenth of September, nineteen eighty-eight."),
        (FEMALE, "Thank you. The tablets are ready, but the asthma inhaler will arrive after four thirty. Take one tablet twice a day with food."),
        (MALE, "I am allergic to penicillin."),
        (FEMALE, "That is already shown on your record. This medication does not contain it. If you develop swelling or difficulty breathing, stop taking it and seek urgent medical help."),
        (MALE, "I will return for the inhaler at five."),
    ],
    "l66": [
        (FEMALE, "Residents in the western district can now register for weekly food-waste collection. Each eligible household receives a small kitchen container and a larger outdoor bin without charge. Register online by the twenty-sixth of April, or telephone the council if you need an accessible form. Deliveries begin on the sixth of May, and Tuesday will be the regular collection day. Put fruit, vegetables, cooked food and tea bags in the bin. Do not include plastic packaging, liquids or garden waste. Close the outdoor bin securely and leave it beside your usual rubbish bin before seven in the morning."),
    ],
    "l67": [
        (FEMALE, "We need to revise the orientation for temporary warehouse staff."),
        (MALE, "The current presentation is accurate, but ninety minutes is too long. Could the manual-handling section become a practical demonstration?"),
        (FEMALE, "Yes. That part is mandatory, along with fire procedures and reporting a hazard."),
        (MALE, "What about the online quiz?"),
        (FEMALE, "Keep it, but allow staff to complete it before their first shift. We should also ask for feedback after one week, when they have actually used the equipment."),
        (MALE, "Agreed. I will arrange a thirty-minute demonstration, and you can update the digital module."),
        (FEMALE, "Let us evaluate the new format after the first two groups."),
    ],
    "l68": [
        (MALE, "A detailed inventory protects both a tenant and a landlord. At the start of a lease, inspect every room and compare its condition with the written list. Record stains, broken handles and missing items, even when the damage seems minor. Take dated photographs and submit corrections within the period stated in the agreement, which is often seven days. Before leaving, clean the property, remove personal belongings and ask how keys should be returned. Normal wear should not be charged against the deposit, but new damage may be. If you disagree with a deduction, first request the inspection evidence and the landlord's cost estimate. A deposit-protection service can then provide independent dispute resolution."),
    ],
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
    if destination.stat().st_size < 20_000:
        raise RuntimeError(f"Generated audio is unexpectedly small: {destination}")
    print(f"generated {destination} ({destination.stat().st_size} bytes)")


async def main():
    output = Path("public/audio")
    temp_root = Path(".tools/audio-batch08-parts")
    output.mkdir(parents=True, exist_ok=True)
    if temp_root.exists():
        shutil.rmtree(temp_root)
    for lesson_id, turns in LESSONS.items():
        await render(lesson_id, turns, output, temp_root)
    shutil.rmtree(temp_root)


asyncio.run(main())

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
    "l41": [
        (FEMALE, "Green Wheel Repairs."),
        (MALE, "My city bike needs a service because the rear brake is making a loud noise."),
        (FEMALE, "Is it an electric bike?"),
        (MALE, "No, it is a standard blue Ridgeway model."),
        (FEMALE, "Bring it on Monday after ten. We can inspect it by noon and text you before replacing any parts. A basic service is forty-five pounds. New brake pads would add eighteen pounds."),
        (MALE, "Fine. My mobile number ends in seven four two nine."),
        (FEMALE, "Your booking reference is B R five six."),
    ],
    "l42": [
        (FEMALE, "City Language Exchange."),
        (MALE, "I'd like to join the Japanese and English table."),
        (FEMALE, "Is your Japanese beginner or intermediate?"),
        (MALE, "Intermediate. I lived in Osaka for a year."),
        (FEMALE, "The Thursday session is full, but there are places on Saturday from two thirty to four in Room seven."),
        (MALE, "That works."),
        (FEMALE, "The fee is six pounds, including tea. Bring a notebook, but dictionaries are provided. Please wear the green name label so partners know you want equal time in both languages."),
    ],
    "l43": [(FEMALE, "Stallholders may enter the market site through Gate North from six thirty on Saturday. Vehicles must leave the selling area by eight fifteen and park in Field two. Your numbered table is provided, but bring your own weatherproof cover. Electricity is available only to traders who booked it in advance; extension cables must be covered by safety mats. Separate food waste from cardboard and cooking oil. The public market closes at two, although stalls must remain in place until two fifteen for safety. Before leaving, have your area checked by the coordinator in an orange jacket.")],
    "l44": [(MALE, "Residents moving into Brook House must reserve a two-hour arrival period at least three working days ahead. Use the service entrance on Mason Street, not the glass doors in the courtyard. The large lift will be protected with wall covers, but it cannot carry items longer than two point two metres. Do not leave boxes in corridors or hold fire doors open. Collect the temporary lift key from reception with a fifty-pound refundable deposit. Return it by six that evening; late return means the deposit is kept. Weekend moves are allowed only on Saturday mornings.")],
    "l45": [
        (MALE, "How will you evaluate the staff wellbeing programme?"),
        (FEMALE, "We could ask managers to name employees whose stress improved."),
        (MALE, "That would not be anonymous."),
        (SECOND_MALE, "We'll send a private survey link instead."),
        (FEMALE, "Should we contact only people who attended every workshop?"),
        (MALE, "Include attendees and a comparison group who did not join. Record department and working pattern, but not exact job title because some teams are very small."),
        (SECOND_MALE, "We'll compare sleep quality and sick days before and after the programme."),
        (MALE, "Good. Use two bar charts and explain that the survey shows association, not proof of cause."),
    ],
    "l46": [
        (MALE, "How will you measure the river clean-up?"),
        (FEMALE, "We planned to weigh all the rubbish together."),
        (SECOND_MALE, "But then we cannot tell which type is most common."),
        (MALE, "Sort it into plastic, metal, glass and other waste. Sample three hundred metres upstream and the same distance downstream from the picnic area."),
        (FEMALE, "I'll photograph each section before and after."),
        (SECOND_MALE, "I'll record the weights and interview ten volunteers."),
        (MALE, "Ask volunteers what was difficult, not whether the event was successful. Submit the data table on Tuesday and your recommendations the following Friday."),
    ],
    "l47": [(FEMALE, "Community gardens are shared spaces where residents grow food or flowers. Their value is not limited to fresh produce. Regular sessions can create social contact and provide gentle physical activity. However, benefits depend on access: fixed weekday times may exclude shift workers, while raised beds and firm paths are needed by some older or disabled gardeners. Research often finds better self-reported wellbeing among participants, but volunteers may already be more socially active than non-participants. Strong projects therefore track who stops attending and offer small plots, shared tools and beginner guidance rather than assuming everyone arrives with experience.")],
    "l48": [(MALE, "Electric bike-share schemes can make longer or hilly journeys practical for people who would not use a standard bicycle. Registration data may show rapid growth, but it does not reveal which transport mode is replaced. If most journeys replace walking or buses rather than cars, the environmental gain is smaller than expected. Poorly parked bikes can block pavements, so marked bays and quick removal systems are important. Pricing also affects fairness: a low single-ride fee helps occasional users, while smartphone-only access excludes others. Researchers recommend cash payment points and analysing use by neighbourhood, not just total trip numbers.")],
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
    temp_root = Path(".tools/audio-batch05-parts")
    output.mkdir(parents=True, exist_ok=True)
    if temp_root.exists():
        shutil.rmtree(temp_root)
    for lesson_id, turns in LESSONS.items():
        await render(lesson_id, turns, output, temp_root)
    shutil.rmtree(temp_root)


asyncio.run(main())

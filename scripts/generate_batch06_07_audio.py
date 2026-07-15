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
    "l49": [(FEMALE, "Bright Home Repairs."), (MALE, "My washing machine stops before the final spin."), (FEMALE, "What make and model is it?"), (MALE, "A Henson W four twenty, bought three years ago."), (FEMALE, "We can visit on Tuesday between nine and twelve, or Wednesday between two and five."), (MALE, "Tuesday morning, please."), (FEMALE, "The call-out fee is thirty-eight pounds. Parts are extra, but the engineer will give a price before fitting anything."), (MALE, "Fine. The address is 18 Willow Close, flat three."), (FEMALE, "Your reference is R M six one.")],
    "l50": [(FEMALE, "Eastside Training Centre."), (MALE, "I want to join the basic first-aid course."), (FEMALE, "The next Saturday course is on the seventeenth of September from ten until four."), (MALE, "Do I need any experience?"), (FEMALE, "No. It is for beginners aged sixteen or over. The fee is fifty-two pounds, including the workbook and practice materials. Bring lunch and wear comfortable clothes."), (MALE, "Can I pay on the day?"), (FEMALE, "We need a twenty-pound deposit by Thursday. I will email the payment link to kai dot bat at mail dot com.")],
    "l51": [(FEMALE, "Welcome to Pine Field Campsite. Arrivals before six should check in at reception; later arrivals must collect a labelled envelope from the box beside Gate Two. Your pitch number is shown on the map inside. Park one car beside your tent and leave any second vehicle in the gravel car park. Raised gas stoves are permitted, but open fires and disposable barbecues are not. Drinking water points are marked blue. The shower block is cleaned from eleven until midday, when the accessible bathroom remains available. Quiet hours begin at ten thirty. If you leave before reception opens, return your gate card through the office letter slot.")],
    "l52": [(MALE, "Tonight's museum programme begins at seven. Please enter through the River Door because the main steps are closed for repair. Large bags must be left in the free lockers on the lower ground floor; you will need a one-pound coin, which is returned. The photography talk in Gallery Four has open seating, but the conservation workshop requires the yellow ticket included with selected bookings. Food is available in the courtyard until nine, while drinks must not enter exhibition rooms. The final short tour leaves the clock hall at nine fifteen. Everyone must leave by the River Door at ten.")],
    "l53": [(MALE, "Which office will you study?"), (FEMALE, "The customer-support floor because staff use screens throughout the day."), (SECOND_MALE, "We first planned to compare it with the warehouse."), (MALE, "The work is too different. Compare the east and west sides of the same floor instead."), (FEMALE, "We will measure light at nine, one and four."), (SECOND_MALE, "And ask staff about headaches and eye strain."), (MALE, "Good, but record whether blinds are open and whether desks are beside a window. Do not collect employee names."), (FEMALE, "We will present the light readings in a line graph and summarise anonymous comments by theme.")],
    "l54": [(MALE, "Tell me about your neighbourhood tree survey."), (FEMALE, "We wanted to record every tree in the district."), (MALE, "That is too large. Select four streets with different traffic levels."), (SECOND_MALE, "For each tree we will note the species, trunk condition and distance from the road."), (FEMALE, "I can photograph the leaves, but faces and house numbers must not appear."), (MALE, "Correct. Interview residents about shade and fallen branches, not whether they simply like trees."), (SECOND_MALE, "I will create the map, and my partner will check the identification guide."), (MALE, "Submit your raw table with the report so I can see how conclusions were reached.")],
    "l55": [(FEMALE, "Home insulation reduces the heat that escapes through roofs, walls and floors, but predicted savings are not always achieved. Before improvement, some households heat only one room or tolerate low temperatures because energy is expensive. After insulation, they may choose a warmer and more comfortable home instead of using much less fuel. Researchers call this a rebound effect, although improved comfort is still a real benefit. Installation quality also matters: gaps around loft doors or poorly fitted wall material reduce performance. Reliable evaluation therefore combines energy bills with indoor temperature readings and interviews about heating routines. Comparing bills alone can be misleading when weather or household size changes.")],
    "l56": [(MALE, "City-centre shops often receive separate deliveries from many suppliers, creating repeated van journeys on crowded streets. An urban consolidation centre receives goods at an edge-of-city warehouse, combines them and sends fewer, fuller vehicles to the centre. Electric vans or cargo bicycles can then reduce local noise and pollution. The model is not automatically cheaper. Goods must be handled an extra time, and small businesses may need rapid deliveries that are difficult to combine. Successful schemes define reliable delivery windows, share digital tracking and charge users fairly. Evaluators should measure vehicle kilometres and loading rates, not merely count deliveries, because one poorly loaded large vehicle may offer little improvement.")],
    "l57": [(FEMALE, "SafeBox Storage."), (MALE, "I need space for about twelve moving boxes and a bicycle."), (FEMALE, "A twenty-five-square-foot unit should be enough."), (MALE, "Can I start on the third of March?"), (FEMALE, "Yes. The minimum rental is four weeks at sixty-four pounds, plus a refundable twenty-pound key deposit. Access is from six in the morning until ten at night."), (MALE, "Is insurance included?"), (FEMALE, "Cover up to one thousand pounds is included, but please bring your own padlock."), (MALE, "Fine. Reserve it under Saru Bat."), (FEMALE, "Your unit is C fourteen.")],
    "l58": [(FEMALE, "Meadow Veterinary Clinic."), (MALE, "My dog needs his annual vaccination."), (FEMALE, "What is his name and age?"), (MALE, "Piko, five years old. He is a medium-sized brown spaniel."), (FEMALE, "We have Friday at eleven forty or Saturday at nine twenty."), (MALE, "Saturday, please."), (FEMALE, "The vaccination and health check cost forty-seven pounds. Do not feed him for two hours beforehand, but water is fine. Bring his vaccination card."), (MALE, "I have recently changed address."), (FEMALE, "We can update that when you arrive. Please use the rear entrance because the front car park is being repaired.")],
    "l59": [(MALE, "Polling staff must arrive at the community hall by six fifteen so the station is ready to open at seven. Sign in with the presiding officer and place personal belongings in the locked kitchen. One clerk checks each voter's name and accepted identification; a second clerk issues the ballot paper and records its number. Never suggest how anyone should vote. If a voter needs physical assistance, call the presiding officer rather than entering the booth alone with them. The station closes at ten, but anyone already in the queue may vote. Afterward, count unused papers, seal the ballot box and sign the transport label before leaving.")],
    "l60": [(FEMALE, "Thank you for joining Sunday's park volunteer day. Meet at the east pavilion at eight forty-five for registration and a safety talk. Litter teams will work beside the lake, while planting teams go to the northern flower beds. Gloves, tools and high-visibility vests are provided. Wear strong closed shoes and bring a refillable drink bottle. Do not pick up needles or broken glass; mark the location with a red flag and tell a supervisor. Green waste goes into open trailers, but general litter belongs in clear bags. Light rain will not cancel the event. Check the council message page at seven if strong winds are forecast.")],
    "l61": [(MALE, "How will you study waiting time at the service desk?"), (FEMALE, "We will start timing when a customer enters the building."), (MALE, "That includes browsing. Start when the person takes a queue ticket and stop when an adviser begins speaking."), (SECOND_MALE, "We will sample Monday morning and Friday afternoon."), (MALE, "Add Wednesday lunchtime because staffing is lower then."), (FEMALE, "May we record the reason for each visit?"), (MALE, "Use broad categories such as payment, booking or complaint, but do not write names or account numbers."), (SECOND_MALE, "We will compare the median, not only the average, because one very long case could distort it."), (MALE, "Then link recommendations to the busiest category.")],
    "l62": [(MALE, "Who will you interview for the oral-history project?"), (FEMALE, "People who have lived near the old market for at least twenty years."), (SECOND_MALE, "We planned ten interviews, but six detailed ones are more realistic."), (MALE, "Begin with open questions about daily life, then ask about specific changes. Do not lead people by calling the past better."), (FEMALE, "We will record audio on our phones."), (MALE, "Use the college recorders and obtain written consent for recording and archive use."), (SECOND_MALE, "I will transcribe the first half and my partner the second."), (MALE, "Both of you must check every transcript against the audio, and participants should be allowed to correct names or private details before publication.")],
    "l63": [(FEMALE, "Food labels contain more information than shoppers can process during a quick decision. People usually notice price, brand and one or two prominent claims before reading a detailed nutrition table. Serving size creates difficulty: a package that appears to contain one portion may display values for half the pack. Front-of-pack colour systems make comparisons faster, but a single green symbol can create a health halo around a product that remains high in another ingredient. Researchers test labels using simulated shops and purchase tasks, yet stated intentions do not always predict real buying. Strong studies therefore compare actual sales before and after a label change while controlling for price promotions and product position.")],
    "l64": [(MALE, "Coastal paths face erosion from waves, rainfall and unstable cliffs. Rebuilding the same edge section after every storm may be expensive and can disturb habitats without providing lasting safety. Managers increasingly use adaptive routes: they monitor ground movement and prepare an inland alignment before the old path becomes dangerous. This approach requires agreements with landowners and clear signs so walkers understand that a diversion is planned, not a maintenance failure. Hard barriers remain appropriate near essential infrastructure, but they may shift erosion along the coast. Decisions should combine engineering evidence, habitat surveys and the social value of access. Publishing inspection dates and trigger points helps communities understand why a path moves or closes.")],
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
    temp_root = Path(".tools/audio-batch06-07-parts")
    output.mkdir(parents=True, exist_ok=True)
    if temp_root.exists():
        shutil.rmtree(temp_root)
    for lesson_id, turns in LESSONS.items():
        await render(lesson_id, turns, output, temp_root)
    shutil.rmtree(temp_root)


asyncio.run(main())

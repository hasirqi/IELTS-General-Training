import asyncio
from pathlib import Path

import edge_tts

TEXTS={
117:"Clerk. Civic Services, how can I help? Resident. I need a certified photocopy of my tenancy agreement. Clerk. Appointments are available on Monday at eleven twenty or Thursday at three forty. Resident. Thursday, please. Clerk. Bring the original agreement and photo identification. The first copy costs twelve pounds and each additional copy costs four pounds. Resident. I need two copies. Clerk. That will be sixteen pounds. Please use the south entrance because the main hall is being renovated. Resident. Could you spell the clerk's name for my notes? Clerk. Certainly. It is Patel, P A T E L.",
118:"Welcome to the West Cape coastal walk. The complete circuit is nine kilometres and normally takes three hours. The first section is a balmy, sheltered path through woodland, but the exposed cliff section can be windy. Do not approach the cliff edge or climb over the barrier. Drinking water is available beside the visitor centre, not at the lighthouse. At marker six, recent rain has made the lower path unsafe, so follow the yellow diversion uphill. If visibility deteriorates, turn back rather than trying to grope along the narrow track. The final bus leaves the visitor centre at five ten. Walkers who miss it must arrange their own transport.",
119:"Tutor. Your proposal says community gardens rejuvenate every neighbourhood. That claim may overstate the evidence. Mina. We could compare three established gardens with three unused sites. Leo. And interview residents living within five hundred metres. Tutor. Good, but do not use only enthusiastic volunteers; that would bias the sample. Mina. We will select addresses at random and ask about social contact, food costs and wellbeing. Leo. Should we measure soil quality too? Tutor. Yes. It may elucidate why some gardens germinate successfully while others fail. Submit the questionnaire on Tuesday. The risk assessment can follow on Friday, but both students must sign it.",
120:"Cities increasingly treat wastewater as a resource rather than an unwanted effluent. In a modern plant, screens first segregate large objects. Settling tanks then allow solids to sink, while biological treatment uses microorganisms to deplete dissolved pollutants. Further filtration and sterilization make the water suitable for industry, irrigation or, under stricter controls, household supply. Public trepidation often persists because a strong image of sewage can overshadow evidence about the final product. Authorities should not assuage concern with slogans alone. They need transparent testing, independent oversight and clear explanations of where the water will be used. Reuse can reduce pressure on rivers during drought, but it is no excuse to abdicate responsibility for conserving water. A resilient system combines lower demand, repaired pipes, rainwater storage and carefully regulated recycling."
}

async def main():
    output=Path(__file__).resolve().parents[1]/"public"/"audio"
    output.mkdir(parents=True,exist_ok=True)
    for lesson_id,text in TEXTS.items():
        destination=output/f"l{lesson_id}.mp3"
        await edge_tts.Communicate(text,"en-GB-SoniaNeural",rate="-8%").save(str(destination))
        if destination.stat().st_size<=100_000:
            raise RuntimeError(f"Audio too small: {destination}")
        print(destination.name,destination.stat().st_size)

asyncio.run(main())

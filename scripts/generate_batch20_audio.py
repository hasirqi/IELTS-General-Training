import asyncio
from pathlib import Path

import edge_tts

TEXTS={
113:"Agent. City Home Repairs. How can I help? Tenant. The bedroom is stuffy and there is a pungent odour near the vent. Agent. Has the problem affected any other room? Tenant. No, but it is worse after rain. Agent. An engineer can visit on Tuesday between nine and eleven or Wednesday between two and four. Tenant. Wednesday afternoon, please. Agent. The inspection is free. Please detach any furniture from the wall near the vent, but do not remove the cover yourself. Tenant. Fine. Agent. If you feel dizzy or the smell becomes stronger, leave the room, open a window and call our emergency number.",
114:"Welcome to the Riverside Food Market. Fresh produce is in the east hall, while prepared meals are sold in the covered courtyard. Traders must garnish food only with ingredients listed on the menu because several visitors have allergies. Free drinking water is beside the information desk. Please place glass in the blue containers and food waste in the green ones. The narrow overpass behind the courtyard is closed today, so use the main gate to reach the car park. At twelve thirty, a chef will demonstrate how to preserve vegetables without excessive salt. The market closes at three, but hot-food stalls stop serving at two forty-five.",
115:"Tutor. Your fieldwork proposal compares soil quality on arable land beside the new bypass. Aisha. We will collect samples at five distances from the road. Ben. We also planned to interview one farmer. Tutor. One interview is too tenuous a basis for generalizing about the whole district. Contact at least four farms with dissimilar soil types. Aisha. Should we test for insecticide residue? Tutor. Yes, but store every sample in an airtight container and label it immediately. Ben. Our first draft says the bypass caused all the pollution. Tutor. Retract that claim. Your design can identify a relationship, not prove a single cause. Submit the revised method on Monday, and complete the risk assessment by Friday.",
116:"Heat does not affect every urban district equally. Dark roofs and impervious roads absorb energy, then radiate it after sunset. In dense streets, limited airflow allows warmth to persist. Affluent households may use efficient cooling, while underprivileged residents often occupy stuffy flats and face exorbitant energy costs. This disparity can exacerbate existing ailments. Planting trees helps, but innumerable young trees will not provide immediate shade. Cities should also fortify health services, subsidize home insulation and create cool public rooms in libraries. Warning systems must use succinct, unambiguous messages rather than emotive slogans. Evaluation should measure indoor temperature, emergency admissions and whether assistance reaches socially isolated residents. No intervention is infallible, but layered action can prevent extreme heat from alienating vulnerable people from work, school and community life."
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

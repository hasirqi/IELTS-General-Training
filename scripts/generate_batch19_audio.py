import asyncio
from pathlib import Path

import edge_tts

TEXTS={
109:"Receptionist. Green Lane Health Centre. How can I help? Patient. My physiotherapist suggested acupuncture for persistent shoulder pain. Receptionist. Our first appointment is an assessment, so treatment may not begin that day. Patient. Do I need a doctor's referral? Receptionist. No, but please bring your medication list. We have Thursday at eleven twenty or Friday at four ten. Patient. Friday afternoon, please. Receptionist. The assessment costs forty-five pounds and lasts fifty minutes. Wear a loose top so the practitioner can examine your shoulder, and avoid a strenuous workout beforehand. Patient. Fine. Receptionist. If you cancel with less than twenty-four hours' notice, we deduct fifteen pounds from your advance payment.",
110:"Welcome to Riverside Wildlife Centre. The zoology gallery is straight ahead, while the outdoor trail begins beyond the café. Recent drizzle has made the wooden bridge slippery, so walk at a brisk but careful pace and use the handrail. At eleven, a keeper will discuss courtship behaviour among wetland birds beside Pool Two. Please do not feed any animal or obstruct the paths while taking photographs. Families can collect a free activity leaflet from the education hut. The amphibious rescue vehicle will be demonstrated at half past one, unless river levels become unsafe. If you hear the emergency bell, leave the trail and huddle at the stone shelter, where staff will count visitors. The centre closes at four thirty, but the final bus departs at four fifteen.",
111:"Tutor. Your project on the old market should evaluate the regeneration proposal, not merely describe it. Mei. We plan to compare the council's claims with traders' experience. Daniel. We also want to infer changes in footfall from mobile-phone data. Tutor. That could help, but anonymised figures may still exclude older visitors. Mei. Then we can conduct short interviews at different times. Tutor. Good. Use a heterogeneous sample and do not let an impromptu conversation replace recorded evidence. Daniel. Should we examine the proposed business-rate discount? Tutor. Yes. Ask whether it will entice fledgling firms or mainly benefit established chains. Mei. Our draft includes a caricature of the current market to make the slides lively. Tutor. Remove it. A visual should impart information, not perpetuate a stereotype. Submit your method on the twenty-first and the full presentation one week later.",
112:"Intense rainfall can overwhelm drains within minutes, but urban flooding is rarely an instantaneous natural event. Paved surfaces impede absorption, rubbish may obstruct channels, and building on a tributary's floodplain deprives water of space. Traditional policy relied on higher embankments. These can deflect water from one district while increasing pressure downstream. A more tenacious strategy combines engineering with restored wetlands, permeable streets and accurate warnings. Authorities must also examine inequality. A household with scant savings bears the brunt of damaged furniture and temporary accommodation. Tenants may be unable to renovate or insure their homes, while inaccessible information can lead residents astray during evacuation. Community drills help people decipher alerts and identify a safe rendezvous. No measure can banish risk, yet coordinated preparation makes headway without alleging that every resident has equal resources. Evaluation should track recovery time, repeated loss and whether support reaches those most exposed."
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

import asyncio
from pathlib import Path
import edge_tts

TEXTS={
101:"Housing officer. Housing repairs, how can I help? Tenant. Black mould has returned in my bedroom after last month's leak. Housing officer. Is the wall wet now? Tenant. No, but the room smells damp and I feel dizzy when I wake up. Housing officer. Please avoid cleaning it before our inspection. What is your address? Tenant. Flat eight, fourteen Clement Street. Housing officer. An inspector can visit next Tuesday between nine and eleven. Move the wardrobe away from the wall, but do not disturb the mould. Tenant. Should I send photographs? Housing officer. Yes, use the online form and include the earlier repair reference, R Q six two one nine.",
102:"Welcome to the North Gorge trail. The walk begins at the visitor centre and follows blue markers for eight kilometres. You will traverse an uphill woodland section before reaching the inlet panorama. Recent rain has made the path greasy, while sediment has covered one marker near the footbridge. Wear firm waterproof footwear and carry two litres of water. Do not enter the narrow gorge if the amber weather light is flashing. An intermittent torrent can make the crossing unsafe. If the siren becomes audible, return by the signed eastern diversion rather than attempting to reclaim the shortest route. Mobile coverage is sparse, so tell a ranger before you embark.",
103:"Tutor. Your proposal links insomnia with cognition, but a two-week survey cannot show a longitudinal pattern. Mina. Could we follow students for one term? Tutor. Yes. Record sleep duration weekly and use the same short memory task. Joel. Should we enlist only students who already report insomnia? Tutor. No, that would inhibit comparison. Recruit a broader sample and record caffeine, work hours and medication, including herbal products. Mina. Our tentative sample is eighty participants. Tutor. Expect some to discard the diary or miss sessions, so enroll at least one hundred. Explain that participation is voluntary and obtain authorization before collecting health information.",
104:"A cosmopolitan city may celebrate multicultural life yet retain a stark disparity in access to housing, transport and health services. Trust does not prosper through charisma or lavish campaigns alone. It depends on procedures that are audible, pertinent and impartial. Authorities should spell out every acronym, replace opaque consultation language and publish the legality and foreseeable impact of decisions. They must also enlist residents who are often overlooked, irrespective of literacy, income or upbringing. Participation should not become a bogus exercise in which officials authorize a plan before hearing objections. A holistic appraisal records who contributed, which evidence changed the proposal and why some requests were overridden. These habits cannot eliminate discord, but they cultivate an abiding belief that public institutions will listen and explain."
}
async def main():
 out=Path(__file__).resolve().parents[1]/"public"/"audio";out.mkdir(parents=True,exist_ok=True)
 for number,text in TEXTS.items():
  target=out/f"l{number}.mp3"
  if target.exists() and target.stat().st_size>100000: print("skip",target.name);continue
  await edge_tts.Communicate(text,"en-GB-SoniaNeural",rate="-8%").save(str(target));print(target.name,target.stat().st_size)
asyncio.run(main())

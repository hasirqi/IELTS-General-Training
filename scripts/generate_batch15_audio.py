import asyncio,shutil,subprocess
from pathlib import Path
import edge_tts,imageio_ffmpeg
F="en-GB-SoniaNeural";M="en-GB-RyanNeural";RATE="-6%"
L={
"l93":[(F,"Good afternoon, Westfield Pavilion."),(M,"Hello. I need to modify our charity banquet booking. We now expect eighty guests rather than sixty."),(F,"The main hall can accommodate ninety, but the smaller kitchen cannot prepare hot meals for more than seventy."),(M,"We could use an outside caterer."),(F,"That is permitted if they provide insurance beforehand. Your booking is for Saturday the seventeenth from six until eleven. The extra tables cost forty pounds, and a refundable cleaning deposit of one hundred pounds is required."),(M,"Please add the tables. Do we need to bring decoration?"),(F,"You may, but nothing can be attached to the fire doors.")],
"l94":[(F,"The Pine Ridge forestry trail will partly reopen on Friday after last month's blaze. The western loop remains closed because damaged trees may fall without warning. Visitors should use the eastern route, marked by blue arrows, and remain inside the temporary perimeter. The path is rugged and damp, so wear suitable boots. Do not remove timber, blossom or any archaeological object. An invasive beetle is susceptible to transport on firewood; therefore, no wood may leave the site. The hilltop pavilion is open, but its café remains suspended until the water supply is tested. If smoke or a fresh flame becomes noticeable, move against the wind towards the lower car park and call the number printed on every trail sign.")],
"l95":[(F,"Your study of addictive phone use needs a tangible measure."),(M,"We could record total screen time."),(F,"But that may confuse study use with entertainment."),(M,"Exactly. Ask participants to classify apps beforehand, then collect both duration and the number of interruptions."),(F,"Should we include only adolescents?"),(M,"Compare adolescents with adults, but align the groups by employment or education status."),(F,"I will prepare the questionnaire and Amir can analyze the usage logs."),(M,"Remember that volunteers may already be skeptical or unusually motivated. State that limitation. Do not label anyone an addict; measure behaviour and let the evidence govern your conclusion.")],
"l96":[(M,"An urban garden is often described as an oasis, but attractive aesthetics alone do not guarantee better health. Green space may stimulate physical activity, provide social contact and relieve stress. Yet these benefits depend on access, safety and maintenance. A splendid pavilion surrounded by damp paths may exclude an older or disabled resident. Likewise, a superficial measure of park area can veil inequality when most greenery lies on the peripheral edge of a city. Researchers therefore combine satellite data with interviews, route mapping and direct observation. They examine whether residents can navigate the space, whether lighting feels secure and whether facilities remain vibrant throughout the year. Policy should not presume that one design suits every neighbourhood. A versatile park may include quiet seating, energetic activity, edible gardens and aquatic habitat. The imperative is to align investment with local needs and then assess tangible outcomes rather than promotional spectacle.")],}
async def r(i,turns,out,tmp):
 d=tmp/i;d.mkdir(parents=True,exist_ok=True);ps=[]
 for n,(v,t) in enumerate(turns):p=d/f"{n:02d}.mp3";await edge_tts.Communicate(t,v,rate=RATE).save(p);ps.append(p)
 dest=out/f"{i}.mp3"
 if len(ps)==1:shutil.copyfile(ps[0],dest)
 else:m=d/"c.txt";m.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in ps),encoding="utf8");subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),"-y","-f","concat","-safe","0","-i",str(m),"-c","copy",str(dest)],check=True,capture_output=True)
 if dest.stat().st_size<100000:raise RuntimeError(dest)
 print(i,dest.stat().st_size)
async def main():
 out=Path("public/audio");tmp=Path(".tools/audio-batch15-parts");out.mkdir(parents=True,exist_ok=True)
 if tmp.exists():shutil.rmtree(tmp)
 for i,t in L.items():await r(i,t,out,tmp)
 shutil.rmtree(tmp)
asyncio.run(main())

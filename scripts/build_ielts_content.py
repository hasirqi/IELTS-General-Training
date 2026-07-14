import csv, json, re, sys
from pathlib import Path

SOURCE = Path(sys.argv[1])
OUTPUT = Path(sys.argv[2])

# High-value General Training phrases. These are authored for this project.
CHUNKS = [
('make an appointment','预约','health'),('confirm a booking','确认预订','travel'),('cancel a reservation','取消预订','travel'),('apply for a refund','申请退款','shopping'),('full refund','全额退款','shopping'),('proof of purchase','购买凭证','shopping'),('customer service','客户服务','shopping'),('out of stock','缺货','shopping'),('in good condition','状况良好','shopping'),('opening hours','营业时间','daily'),
('public transport','公共交通','travel'),('return ticket','往返票','travel'),('single ticket','单程票','travel'),('departure time','出发时间','travel'),('arrival time','到达时间','travel'),('platform number','站台号','travel'),('traffic delay','交通延误','travel'),('miss the bus','错过公交车','travel'),('catch a train','赶上火车','travel'),('get off at','在某站下车','travel'),
('rental agreement','租赁合同','housing'),('pay the rent','支付房租','housing'),('security deposit','押金','housing'),('utility bill','水电煤账单','housing'),('shared accommodation','合租住房','housing'),('available immediately','可立即入住','housing'),('fully furnished','家具齐全','housing'),('report a problem','报告问题','housing'),('make a complaint','提出投诉','daily'),('give notice','提前通知','housing'),
('job vacancy','职位空缺','work'),('work experience','工作经验','work'),('full-time position','全职职位','work'),('part-time position','兼职职位','work'),('flexible hours','弹性工时','work'),('annual leave','年假','work'),('sick leave','病假','work'),('staff training','员工培训','work'),('health and safety','健康与安全','work'),('meet a deadline','按时完成','work'),
('take responsibility for','负责','work'),('work as part of a team','团队协作','work'),('deal with customers','接待客户','work'),('fill in a form','填写表格','daily'),('provide information','提供信息','daily'),('contact details','联系方式','daily'),('emergency contact','紧急联系人','daily'),('date of birth','出生日期','daily'),('valid identification','有效身份证明','daily'),('terms and conditions','条款与条件','daily'),
('medical appointment','就医预约','health'),('health insurance','医疗保险','health'),('side effects','副作用','health'),('take medicine','服药','health'),('balanced diet','均衡饮食','health'),('regular exercise','规律运动','health'),('mental health','心理健康','health'),('feel unwell','感觉不适','health'),('call an ambulance','呼叫救护车','health'),('recover from','从……康复','health'),
('local community','当地社区','community'),('community centre','社区中心','community'),('volunteer work','志愿工作','community'),('public library','公共图书馆','community'),('recycling centre','回收中心','community'),('environmental impact','环境影响','environment'),('reduce waste','减少浪费','environment'),('save energy','节约能源','environment'),('public space','公共空间','community'),('local residents','当地居民','community'),
('take part in','参加','daily'),('look forward to','期待','writing'),('I am writing to','我写信是为了','writing'),('I would be grateful if','如果您能……我将不胜感激','writing'),('I am sorry to inform you','很抱歉通知您','writing'),('please let me know','请告知我','writing'),('as soon as possible','尽快','writing'),('for this reason','因此','writing'),('in my opinion','在我看来','writing'),('on the other hand','另一方面','writing'),
('for example','例如','writing'),('as a result','结果是','writing'),('in addition','此外','writing'),('however','然而','writing'),('to sum up','总而言之','writing'),('one possible solution','一个可行的解决办法','writing'),('advantages and disadvantages','优点与缺点','writing'),('play an important role','发挥重要作用','writing'),('have access to','能够使用／获得','writing'),('quality of life','生活质量','writing'),
('Could you repeat that','您能重复一遍吗','speaking'),('What do you mean by','您说的……是什么意思','speaking'),('Let me think','让我想一想','speaking'),('The main reason is','主要原因是','speaking'),('From my experience','根据我的经验','speaking'),('It depends on','这取决于','speaking'),('I agree to some extent','我在一定程度上同意','speaking'),('That is a good question','这是个好问题','speaking'),('What I mean is','我的意思是','speaking'),('Compared with','与……相比','speaking'),
('according to','根据','reading'),('be required to','被要求','reading'),('be responsible for','负责','reading'),('free of charge','免费','reading'),('subject to availability','视供应情况而定','reading'),('no later than','不迟于','reading'),('in advance','提前','reading'),('at least','至少','reading'),('up to','最多／高达','reading'),('instead of','而不是','reading'),
('due to','由于','reading'),('in case of','如果发生','reading'),('on behalf of','代表','writing'),('with regard to','关于','writing'),('in order to','为了','writing'),('as well as','以及','reading'),('rather than','而不是','reading'),('even though','尽管','reading'),('provided that','只要','reading'),('unless otherwise stated','除非另有说明','reading')
]

FEATURED = {
 'appointment': ('预约；约定','我明天有一个医生预约。',"I have a doctor's appointment tomorrow.",'make an appointment'),
 'available': ('可用的；有空的','这个座位有人吗？','Is this seat available?','available from Monday'),
 'confirm': ('确认','请确认你的预订。','Please confirm your booking.','confirm the details'),
 'delay': ('延误；推迟','火车延误了二十分钟。','The train has a twenty-minute delay.','a slight delay'),
 'require': ('需要；要求','这份工作需要经验。','This job requires experience.','be required to'),
 'refund': ('退款','我可以申请退款吗？','Can I get a refund?','full refund'),
 'local': ('当地的','当地公交车每小时一班。','The local bus runs every hour.','local facilities'),
 'provide': ('提供','酒店提供免费早餐。','The hotel provides free breakfast.','provide information'),
 'rent': ('租金；租用','这里租一套公寓要多少钱？','How much is it to rent a flat here?','pay the rent'),
 'notice': ('通知；注意到','请阅读墙上的通知。','Please read the notice on the wall.','give notice'),
 'instead': ('代替；反而','我们改坐公交车吧。',"Let's take the bus instead.",'instead of'),
 'improve': ('改善；提高','我想提高英语。','I want to improve my English.','improve steadily')
}

def clean_translation(value):
    value = (value or '').replace('\\r',' ').replace('\\n',' ')
    value = re.sub(r'\[[^\]]+\][^;；]*', '', value)
    value = re.sub(r'\s+', ' ', value).strip(' ;；,，')
    value = re.sub(r'^(n|v|vt|vi|a|ad|adv|prep|pron|conj|art)\.\s*', '', value, flags=re.I)
    return value[:78].rstrip(' ;；,，')

rows=[]
with SOURCE.open(encoding='utf-8', newline='') as f:
    for x in csv.DictReader(f):
        word=x['word'].strip()
        if not re.fullmatch(r"[A-Za-z][A-Za-z-]{1,24}", word): continue
        if word.lower()!=word: continue
        translation=clean_translation(x['translation'])
        if not translation or not re.search(r'[\u4e00-\u9fff]',translation): continue
        frq=int(x['frq'] or 999999) if (x['frq'] or '').isdigit() and int(x['frq'] or 0)>0 else 999999
        bnc=int(x['bnc'] or 999999) if (x['bnc'] or '').isdigit() and int(x['bnc'] or 0)>0 else 999999
        tags=set((x['tag'] or '').split())
        priority=(0 if 'ielts' in tags else 1 if x['oxford']=='1' else 2, min(frq,bnc))
        if priority[0] == 2 or min(frq,bnc)>14000: continue
        rows.append((priority,word,x['phonetic'].strip(),translation,x.get('pos','').strip(),tags))

rows.sort(key=lambda z:z[0])
items=[]
seen=set()

for phrase,meaning,category in CHUNKS:
    key=phrase.lower()
    if key in seen: continue
    seen.add(key)
    items.append({'id':f'chunk-{len(items)+1:04d}','term':phrase,'phonetic':'','part':'词块','meaning':meaning,'category':category,'kind':'chunk','level':'A2-B1'})

preferred=list(FEATURED)
ordered=[]
lookup={r[1]:r for r in rows}
for w in preferred:
    if w in lookup: ordered.append(lookup[w])
ordered += [r for r in rows if r[1] not in FEATURED]

for _,word,phonetic,translation,pos,tags in ordered:
    if len(items)>=1000: break
    if word in seen: continue
    seen.add(word)
    entry={'id':f'word-{len(items)+1:04d}','term':word,'phonetic':phonetic,'part':pos or '单词','meaning':translation,'category':'ielts' if 'ielts' in tags else 'foundation','kind':'word','level':'A1-B1'}
    if word in FEATURED:
        meaning,cue,example,collocation=FEATURED[word]
        entry.update({'meaning':meaning,'cue':cue,'example':example,'collocation':collocation})
    items.append(entry)

assert len(items)==1000, len(items)
assert len({x['term'].lower() for x in items})==1000
OUTPUT.parent.mkdir(parents=True,exist_ok=True)
OUTPUT.write_text(json.dumps(items,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(f'wrote {len(items)} items: {sum(x["kind"]=="chunk" for x in items)} chunks + {sum(x["kind"]=="word" for x in items)} words')

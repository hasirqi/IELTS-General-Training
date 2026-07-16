import csv
import json
import math
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PLAN_PATH = ROOT / 'ysgpc' / 'extracted' / 'expansion-plan.json'
PLAN = json.loads(PLAN_PATH.read_text(encoding='utf-8'))

# Ordered by General Training usefulness, not raw frequency alone.
CATEGORY_TERMS = {
    'forms-services': [
        'accurate','agenda','announcement','approve','arrange','assistant','assure','available',
        'cancel','classification','communicate','comparison','compensation','comply','consent',
        'convenient','criteria','delivery','departure','deposit','destination','discount','display',
        'duration','efficient','eligible','enable','ensure','estimate','evaluate','expense','explicit',
        'extension','facilitate','feedback','fill','forecast','format','framework','guarantee','guideline',
        'handle','implement','include','indicate','inquiry','inspect','install','inventory','invoice',
        'label','layout','mandatory','manual','membership','monitor','notify','obtain','operate','optional',
        'orientation','outcome','pending','permit','portable','preference','preliminary','premium',
        'presentation','profile','proof','protocol','purchase','qualify','quantity','reception','recommend',
        'register','reliable','resolution','secure','submission','submit','substitute','terminal',
        'transaction','transition','uniform','valid','verify','warranty','wholesale','vacant','vendor',
    ],
    'work-money': [
        'active','advance','advantage','aid','alert','appreciate','barrier','behalf','brief','capable',
        'caution','collaboration','compromise','cooperation','crucial','determine','district','employ',
        'encourage','fund','hire','income','infrastructure','initiative','lease','liability','license',
        'locate','logistics','manufacture','municipal','negotiate','overtime','personnel','prevent',
        'progress','protection','responsible','volunteer','allowance','archive','bulletin','clearance',
        'coupon','dispatch','enforce','exempt','fulfill','incentive','intake','junction','mandate',
        'probation','reimburse','statutory','subsidy','taxation','ownership','fraud','disposal',
    ],
    'health-safety': [
        'acute','adjust','allergic','appetite','asthma','bacterial','casualty','chronic','diabetes',
        'diagnose','discharge','dose','fatigue','infection','injection','medication','patient',
        'precautions','prescription','psychiatric','symptom','vaccine','ventilation','vegetarian',
        'hazard','harmful','distress','emergency','equipment','safety','insurance','medical',
    ],
    'community-environment': [
        'awareness','climate','congestion','construct','ecology','ecosystem','erosion','intersection',
        'landfill','litter','neighboring','renewable','urban','welfare','drought','flood','habitat',
        'recycling','resident','community','transport','vehicle','public','local','route','schedule',
        'access','accommodation','landlord','tenant','housing','maintenance','utility','fare',
    ],
    'communication-reading': [
        'apparent','aspect','consider','concept','contain','contemporary','contrary','controversy',
        'define','despite','distinct','diversity','domain','emphasize','evidence','examine','express',
        'external','interpret','justify','leading','meaning','particular','principle','publish',
        'reflect','regard','reveal','sequence','significant','similar','specific','subsequent',
        'summary','theoretical','transparent','typical','varied','visible','widespread','according',
        'clarify','convey','illustrate','imply','persuade','relevant','objective','source','context',
    ],
    'consumer-daily': [
        'bargain','commodity','customer','receipt','refund','replace','service','payment','contract',
        'document','identification','notice','policy','reservation','staff','deadline','training',
        'contact','appointment','application','complaint','repair','rent','booking','available',
    ],
}

candidates = {item['term']: item for item in PLAN['candidates'] if item['sourceStatus'] == 'ready'}
selected = []
seen = set()
missing = []
for category, terms in CATEGORY_TERMS.items():
    for term in terms:
        if term in seen:
            continue
        item = candidates.get(term)
        if item is None:
            missing.append(term)
            continue
        seen.add(term)
        selected.append({**item, 'contentCategory': category})

if len(selected) < 200:
    raise RuntimeError(f'Curated list produced only {len(selected)} source-backed candidates')
selected = selected[:200]
selected_terms = {item['term'] for item in selected}

for index, item in enumerate(selected, 1):
    item['priorityIndex'] = index
    item['batch'] = 1
    item['learningPriority'] = 'high'
    item['recommendedTier'] = 'active' if item['contentCategory'] != 'communication-reading' else 'receptive'

STOP_OR_HOLD = {'the','for','not','anna','harris','harry','ken','rome','roth','porn'}
remaining = [
    item for item in PLAN['candidates']
    if item['sourceStatus'] == 'ready' and item['term'] not in selected_terms
]
remaining.sort(key=lambda item: (
    item['term'] in STOP_OR_HOLD,
    {'active': 0, 'receptive': 1, 'extension': 2}[item['valueTier']],
    -item['score'], item['sourceGlobalIndex'], item['term'],
))
for index, item in enumerate(remaining, 201):
    item['priorityIndex'] = index
    item['batch'] = math.ceil(index / 200)
    item['learningPriority'] = 'hold' if item['term'] in STOP_OR_HOLD else (
        'medium' if item['valueTier'] != 'extension' else 'low'
    )

ordered = selected + remaining + [item for item in PLAN['candidates'] if item['sourceStatus'] == 'print-check']
PLAN['candidates'] = ordered
PLAN['curation'] = {
    'firstBatchCount': len(selected),
    'rule': 'General Training usefulness, active usability, source readiness, then frequency',
    'machineFrequencyOnlyRejected': True,
    'heldTerms': sorted(STOP_OR_HOLD & candidates.keys()),
}

batch_rows = []
ready = selected + remaining
for batch_number in range(1, math.ceil(len(ready) / 200) + 1):
    batch = [item for item in ready if item['batch'] == batch_number]
    tiers = Counter(item.get('recommendedTier', item['valueTier']) for item in batch)
    priorities = Counter(item.get('learningPriority', 'medium') for item in batch)
    batch_rows.append({
        'batch': batch_number, 'count': len(batch),
        'startPriority': batch[0]['priorityIndex'], 'endPriority': batch[-1]['priorityIndex'],
        'active': tiers['active'], 'receptive': tiers['receptive'], 'extension': tiers['extension'],
        'high': priorities['high'], 'medium': priorities['medium'], 'low': priorities['low'], 'hold': priorities['hold'],
    })
PLAN['batches'] = batch_rows
PLAN_PATH.write_text(json.dumps(PLAN, ensure_ascii=False, indent=2), encoding='utf-8')
(ROOT / 'src' / 'content' / 'core-word-batch-01-candidates.json').write_text(
    json.dumps(selected, ensure_ascii=False, indent=2), encoding='utf-8'
)

with (ROOT / 'ysgpc' / 'extracted' / 'expansion-batches.csv').open('w', encoding='utf-8-sig', newline='') as handle:
    columns = ['priorityIndex','batch','term','canonicalTerm','valueTier','recommendedTier','learningPriority','contentCategory','frequency','score','sourceStatus','sourceGlobalIndex','wordList','unit','unitIndex','sourceOccurrences','audioFile','start','end']
    writer = csv.DictWriter(handle, fieldnames=columns, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(ordered)

print(json.dumps({
    'selected': len(selected),
    'categories': dict(Counter(item['contentCategory'] for item in selected)),
    'recommendedTiers': dict(Counter(item['recommendedTier'] for item in selected)),
    'heldTerms': PLAN['curation']['heldTerms'],
    'missingCuratedTerms': missing,
    'firstBatch': [item['term'] for item in selected],
}, ensure_ascii=False, indent=2))

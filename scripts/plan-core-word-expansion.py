import csv
import json
import math
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, r'C:\tmp\en-master-wordfreq')

from wordfreq import zipf_frequency


SPELLING_GROUPS = [
    {'behavior', 'behaviour'}, {'center', 'centre'}, {'color', 'colour'},
    {'favor', 'favour'}, {'honor', 'honour'}, {'humor', 'humour'},
    {'labor', 'labour'}, {'liter', 'litre'}, {'maneuver', 'manoeuvre'},
    {'meter', 'metre'}, {'neighbor', 'neighbour'}, {'organise', 'organize'},
    {'organisation', 'organization'}, {'program', 'programme'},
    {'recognise', 'recognize'}, {'theater', 'theatre'}, {'traveling', 'travelling'},
    {'vigor', 'vigour'}, {'analyze', 'analyse'}, {'realise', 'realize'},
]
SPELLING_ALIAS = {
    term: sorted(group)[0]
    for group in SPELLING_GROUPS
    for term in group
}

GT_PRIORITY = {
    'access', 'accommodation', 'application', 'appointment', 'available', 'cancel',
    'community', 'complaint', 'confirm', 'contact', 'contract', 'customer', 'deadline',
    'delay', 'deposit', 'document', 'emergency', 'employee', 'employer', 'equipment',
    'fare', 'fee', 'form', 'health', 'housing', 'identification', 'insurance', 'interview',
    'invoice', 'landlord', 'local', 'maintenance', 'medical', 'notice', 'payment', 'permit',
    'policy', 'public', 'receipt', 'refund', 'register', 'rent', 'repair', 'replace',
    'require', 'reservation', 'resident', 'route', 'safety', 'schedule', 'service',
    'staff', 'submit', 'tenant', 'training', 'transport', 'valid', 'vacancy', 'volunteer',
}


def normalize(term: str) -> str:
    return re.sub(r'\s+', ' ', term.strip().lower().replace('’', "'"))


def canonical(term: str) -> str:
    normalized = normalize(term)
    return SPELLING_ALIAS.get(normalized, normalized)


baseline_path = ROOT / 'src' / 'content' / 'lexicon-baseline-1000.json'
if not baseline_path.exists():
    baseline_path = ROOT / 'src' / 'content' / 'lexicon.json'
existing = json.loads(baseline_path.read_text(encoding='utf-8'))
source = json.loads((ROOT / 'ysgpc' / 'extracted' / 'word-lists.json').read_text(encoding='utf-8'))
source_rows = [
    word
    for word_list in source['wordLists']
    for unit in word_list['units']
    for word in unit['words']
]

existing_by_canonical = defaultdict(list)
for item in existing:
    existing_by_canonical[canonical(item['term'])].append(item)

source_groups = defaultdict(list)
for item in source_rows:
    source_groups[canonical(item['word'])].append(item)

candidates = []
exact_overlap = 0
alias_overlap = 0
for canonical_term, occurrences in source_groups.items():
    first = min(occurrences, key=lambda item: item['globalIndex'])
    existing_matches = existing_by_canonical.get(canonical_term, [])
    if existing_matches:
        if any(normalize(item['term']) == normalize(first['word']) for item in existing_matches):
            exact_overlap += 1
        else:
            alias_overlap += 1
        continue

    term = normalize(first['word'])
    frequency = zipf_frequency(term, 'en')
    if frequency >= 4.0:
        tier = 'active'
        tier_rank = 0
    elif frequency >= 3.0:
        tier = 'receptive'
        tier_rank = 1
    else:
        tier = 'extension'
        tier_rank = 2
    gt_bonus = 0.65 if term in GT_PRIORITY else 0.0
    source_status_penalty = 1.5 if any(item['status'] == 'print-check' for item in occurrences) else 0.0
    score = round(frequency + gt_bonus - source_status_penalty, 3)
    candidates.append({
        'term': term,
        'canonicalTerm': canonical_term,
        'frequency': frequency,
        'valueTier': tier,
        'score': score,
        'sourceStatus': 'print-check' if any(item['status'] == 'print-check' for item in occurrences) else 'ready',
        'sourceGlobalIndex': first['globalIndex'],
        'wordList': first['wordList'],
        'unit': first['unit'],
        'unitIndex': first['index'],
        'audioFile': first['audioFile'],
        'start': first['start'],
        'end': first['end'],
        'sourceOccurrences': len(occurrences),
        '_tierRank': tier_rank,
    })

ready = [item for item in candidates if item['sourceStatus'] == 'ready']
ready.sort(key=lambda item: (item['_tierRank'], -item['score'], item['sourceGlobalIndex'], item['term']))
for index, item in enumerate(ready, 1):
    item['priorityIndex'] = index
    item['batch'] = math.ceil(index / 200)

print_checks = [item for item in candidates if item['sourceStatus'] == 'print-check']
print_checks.sort(key=lambda item: item['sourceGlobalIndex'])
ordered_candidates = ready + print_checks
for item in ordered_candidates:
    item.pop('_tierRank', None)

batch_rows = []
for batch_number in range(1, math.ceil(len(ready) / 200) + 1):
    batch = [item for item in ready if item['batch'] == batch_number]
    tiers = Counter(item['valueTier'] for item in batch)
    batch_rows.append({
        'batch': batch_number,
        'count': len(batch),
        'startPriority': batch[0]['priorityIndex'],
        'endPriority': batch[-1]['priorityIndex'],
        'active': tiers['active'],
        'receptive': tiers['receptive'],
        'extension': tiers['extension'],
    })

source_unique_count = len(source_groups)
net_new_count = len(candidates)
report = {
    'baseline': {
        'existingLexicon': len(existing),
        'sourceAudioSlots': len(source_rows),
        'sourceUniqueCanonicalTerms': source_unique_count,
        'sourceDuplicateSlots': len(source_rows) - source_unique_count,
    },
    'merge': {
        'exactExistingOverlap': exact_overlap,
        'spellingAliasOverlap': alias_overlap,
        'netNewUniqueTerms': net_new_count,
        'mergedLexiconPotential': len(existing) + net_new_count,
        'readyForBatches': len(ready),
        'heldForPrintCheck': len(print_checks),
    },
    'valueTiers': dict(Counter(item['valueTier'] for item in candidates)),
    'batchSize': 200,
    'batchCount': len(batch_rows),
    'batches': batch_rows,
    'candidates': ordered_candidates,
}

output_root = ROOT / 'ysgpc' / 'extracted'
(output_root / 'expansion-plan.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
with (output_root / 'expansion-batches.csv').open('w', encoding='utf-8-sig', newline='') as handle:
    columns = ['priorityIndex', 'batch', 'term', 'canonicalTerm', 'valueTier', 'frequency', 'score', 'sourceStatus', 'sourceGlobalIndex', 'wordList', 'unit', 'unitIndex', 'sourceOccurrences', 'audioFile', 'start', 'end']
    writer = csv.DictWriter(handle, fieldnames=columns, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(ordered_candidates)

first_batch = [item for item in ready if item['batch'] == 1]
(ROOT / 'src' / 'content' / 'core-word-batch-01-candidates.json').write_text(
    json.dumps(first_batch, ensure_ascii=False, indent=2), encoding='utf-8'
)

summary = {
    'existing': len(existing), 'sourceSlots': len(source_rows), 'sourceUnique': source_unique_count,
    'sourceDuplicateSlots': len(source_rows) - source_unique_count,
    'exactOverlap': exact_overlap, 'aliasOverlap': alias_overlap,
    'netNew': net_new_count, 'mergedPotential': len(existing) + net_new_count,
    'ready': len(ready), 'printCheck': len(print_checks),
    'tiers': report['valueTiers'], 'batches': len(batch_rows),
}
print(json.dumps(summary, ensure_ascii=False, indent=2))
print('FIRST_BATCH=' + ', '.join(item['term'] for item in first_batch))

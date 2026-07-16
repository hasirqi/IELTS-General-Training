import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = ROOT / 'ysgpc' / 'extracted'
sys.path.insert(0, str(ROOT / '.tools' / 'word-audit-lib'))

from wordfreq import zipf_frequency


payload = json.loads((OUTPUT_ROOT / 'word-lists.json').read_text(encoding='utf-8'))
assert len(payload['wordLists']) == 7
units = [unit for word_list in payload['wordLists'] for unit in word_list['units']]
assert len(units) == 35
words = [word for unit in units for word in unit['words']]
assert len(words) == payload['extraction']['wordCount'] == 3461
assert [word['globalIndex'] for word in words] == list(range(1, 3462))

for word_list in payload['wordLists']:
    assert [unit['unit'] for unit in word_list['units']] == [1, 2, 3, 4, 5]
    assert sum(unit['wordCount'] for unit in word_list['units']) == word_list['wordCount']
for unit in units:
    assert (ROOT / unit['audioFile']).is_file(), unit['audioFile']
    assert [word['index'] for word in unit['words']] == list(range(1, unit['wordCount'] + 1))
    assert all(word['start'] < word['end'] for word in unit['words'])
    assert all(
        unit['words'][index]['start'] > unit['words'][index - 1]['end']
        for index in range(1, len(unit['words']))
    )

valid_word = re.compile(r"[a-z]+(?:[-'][a-z]+)*")
assert all(valid_word.fullmatch(word['word']) for word in words)
assert not any(word['word'] in {'placeholder', 'todo', 'unknown'} for word in words)

with (OUTPUT_ROOT / 'word-lists.csv').open(encoding='utf-8-sig', newline='') as handle:
    csv_rows = list(csv.DictReader(handle))
assert len(csv_rows) == len(words)
assert [row['word'] for row in csv_rows] == [word['word'] for word in words]

markdown = (OUTPUT_ROOT / 'word-lists.md').read_text(encoding='utf-8')
assert markdown.count('## Word List ') == 7
assert markdown.count('### Unit ') == 35

lexical_review = []
for word in words:
    frequency = zipf_frequency(word['word'], 'en')
    if frequency < 1.5:
        lexical_review.append({
            'wordList': word['wordList'], 'unit': word['unit'], 'index': word['index'],
            'word': word['word'], 'zipfFrequency': frequency, 'status': word['status'],
        })
(ROOT / 'audit' / 'ysgpc' / 'final-lexical-review.json').write_text(
    json.dumps(lexical_review, ensure_ascii=False, indent=2), encoding='utf-8'
)

duplicates = Counter(word['word'] for word in words)
duplicate_spellings = {word: count for word, count in duplicates.items() if count > 1}
status_counts = Counter(word['status'] for word in words)
print(
    f'PASS lists=7 units=35 words={len(words)} csv={len(csv_rows)} '
    f'statuses={dict(status_counts)} rare={len(lexical_review)} duplicates={len(duplicate_spellings)}'
)
for item in lexical_review:
    print(
        f'RARE WL{item["wordList"]} U{item["unit"]} #{item["index"]}: '
        f'{item["word"]} zipf={item["zipfFrequency"]} status={item["status"]}'
    )

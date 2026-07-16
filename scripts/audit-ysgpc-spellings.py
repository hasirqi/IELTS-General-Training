import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools' / 'word-audit-lib'))

from wordfreq import zipf_frequency


RAW_ROOT = ROOT / 'audit' / 'ysgpc' / 'raw'
OUTPUT = ROOT / 'audit' / 'ysgpc' / 'lexical-audit.json'

rows = []
for path in sorted(RAW_ROOT.glob('word-list-*.json')):
    unit = json.loads(path.read_text(encoding='utf-8'))
    for item in unit['words']:
        word = item['word'].strip().lower()
        frequency = zipf_frequency(word, 'en') if re.fullmatch(r"[a-z]+(?:[-'][a-z]+)*", word) else 0.0
        rows.append({
            'wordList': unit['wordList'],
            'unit': unit['unit'],
            'index': item['index'],
            'word': word,
            'asrStatus': item['status'],
            'zipfFrequency': frequency,
            'flag': item['status'] == 'auto' and (not word or frequency < 1.5),
        })

counts = Counter(row['word'] for row in rows if row['word'])
for row in rows:
    row['globalOccurrences'] = counts[row['word']] if row['word'] else 0

result = {
    'total': len(rows),
    'asrReview': sum(row['asrStatus'] == 'review' for row in rows),
    'additionalLexicalReview': sum(row['flag'] for row in rows),
    'duplicateSpellings': [
        {'word': word, 'count': count}
        for word, count in sorted(counts.items())
        if count > 1
    ],
    'additionalReviewItems': [row for row in rows if row['flag']],
}
OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(
    f'total={result["total"]} asr_review={result["asrReview"]} '
    f'lexical_review={result["additionalLexicalReview"]} duplicates={len(result["duplicateSpellings"])}'
)
for row in result['additionalReviewItems']:
    print(f'WL{row["wordList"]} U{row["unit"]} #{row["index"]}: {row["word"]!r} zipf={row["zipfFrequency"]}')

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = ROOT / 'ysgpc' / 'extracted'
CORRECTIONS = {
    (2, 3, 35): 'pullulate',
    (2, 5, 8): 'dissentious',
    (3, 2, 81): 'luggage',
    (4, 2, 6): 'mollify',
}

path = OUTPUT_ROOT / 'word-lists.json'
payload = json.loads(path.read_text(encoding='utf-8'))
rows = []
for word_list in payload['wordLists']:
    for unit in word_list['units']:
        for word in unit['words']:
            key = (word['wordList'], word['unit'], word['index'])
            if key in CORRECTIONS:
                previous = word['word']
                word['word'] = CORRECTIONS[key]
                word['status'] = 'corrected'
                word['evidence'] = f'{word["evidence"]}+final-lexical-decision'
                note = f'final lexical correction: {previous} -> {word["word"]}'
                word['notes'] = f'{word["notes"]}; {note}'.strip('; ')
            rows.append(word)
path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')

columns = ['globalIndex', 'wordList', 'unit', 'index', 'word', 'start', 'end', 'audioFile', 'status', 'evidence', 'confidence', 'notes']
with (OUTPUT_ROOT / 'word-lists.csv').open('w', encoding='utf-8-sig', newline='') as handle:
    writer = csv.DictWriter(handle, fieldnames=columns)
    writer.writeheader()
    writer.writerows(rows)

markdown = [
    '# 7 个 Word List、35 个 Unit 单词清单', '',
    f'- 实际独立发音词位：{len(rows):,}',
    f'- 已识别：{payload["extraction"]["recognizedCount"]:,}',
    f'- 经复听或词形检查修正：{payload["extraction"]["correctedCount"]:,}',
    f'- 建议与纸质原书再核对：{payload["extraction"]["printCheckCount"]:,}', '',
]
for word_list in payload['wordLists']:
    markdown.extend([f'## Word List {word_list["wordList"]}（{word_list["wordCount"]} 词）', ''])
    for unit in word_list['units']:
        markdown.extend([f'### Unit {unit["unit"]}（{unit["wordCount"]} 词）', ''])
        for start in range(0, len(unit['words']), 10):
            chunk = unit['words'][start:start + 10]
            markdown.append(' · '.join(f'{item["index"]}. {item["word"]}' for item in chunk))
        markdown.append('')
(OUTPUT_ROOT / 'word-lists.md').write_text('\n'.join(markdown), encoding='utf-8')
print(f'Applied {len(CORRECTIONS)} final lexical corrections.')

import csv
import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW_ROOT = ROOT / 'audit' / 'ysgpc' / 'raw'
OUTPUT_ROOT = ROOT / 'ysgpc' / 'extracted'


# Decisions where isolated-word recognition needs spelling or compound normalization.
OVERRIDES = {
    (1, 1, 55): 'discern',
    (1, 1, 71): 'narrate',
    (1, 2, 41): 'four',
    (1, 3, 97): 'prolusion',
    (1, 4, 50): 'fibre',
    (1, 4, 62): 'wonder',
    (1, 5, 75): 'encumber',
    (2, 1, 17): 'erratic',
    (2, 1, 35): 'inculcate',
    (2, 3, 3): 'inexorable',
    (2, 3, 52): 'outweigh',
    (2, 4, 62): 'tamper',
    (3, 2, 21): 'megacity',
    (3, 2, 41): 'abuse',
    (3, 3, 65): 'far-reaching',
    (3, 3, 78): 'loth',
    (3, 4, 60): 'surmount',
    (3, 5, 33): 'appendicitis',
    (3, 5, 42): 'disavowal',
    (3, 5, 47): 'bequeath',
    (3, 5, 69): 'impasse',
    (4, 1, 58): 'loth',
    (4, 2, 19): 'inaugurate',
    (4, 3, 20): 'bass',
    (4, 3, 34): 'efface',
    (4, 4, 11): 'overgrazed',
    (4, 4, 15): 'fetter',
    (4, 5, 18): 'inflammatory',
    (4, 5, 87): 'makeup',
    (4, 5, 88): 'overexploit',
    (5, 3, 50): 'emend',
    (5, 3, 81): 'lunar',
    (5, 4, 1): 'effuse',
    (5, 4, 44): 'foreland',
    (5, 5, 7): 'uproarious',
    (6, 1, 87): 'flexitime',
    (6, 2, 47): 'inurbane',
    (6, 2, 48): 'begrimed',
    (6, 3, 17): 'overestimate',
    (6, 3, 76): 'revegetate',
    (6, 3, 86): 'numerous',
    (6, 4, 49): 'bow',
    (6, 5, 7): 'mulish',
    (6, 5, 15): 'supersede',
    (7, 1, 51): 'bare',
    (7, 2, 41): 'wonder',
    (7, 4, 62): 'illicit',
    (7, 4, 93): 'heighten',
    (7, 5, 5): 'marshal',
    (7, 5, 31): 'govern',
    (7, 5, 45): 'jargon',
    (7, 5, 53): 'exhume',
    (7, 5, 58): 'gullibly',
    (7, 5, 60): 'unfeigned',
    (7, 5, 67): 'callous',
    (7, 5, 81): 'well-rounded',
}

# These are fully identified from audio but deserve comparison with the printed book.
NEEDS_PRINT_CHECK = {
    (1, 1, 26): 'two consecutive pronunciations both resolve to abstract; likely noun/verb stress pair',
    (1, 1, 27): 'two consecutive pronunciations both resolve to abstract; likely noun/verb stress pair',
    (1, 1, 76): 'two consecutive pronunciations both resolve to export; likely noun/verb stress pair',
    (1, 1, 77): 'two consecutive pronunciations both resolve to export; likely noun/verb stress pair',
    (2, 4, 62): 'isolated passes split between tamper and temper',
    (6, 4, 13): 'two consecutive pronunciations both resolve to patronage',
    (6, 4, 14): 'two consecutive pronunciations both resolve to patronage',
    (7, 1, 51): 'homophone: isolated recognition split between bare and bear',
}


def first_token(pass_data):
    tokens = pass_data.get('tokens', [])
    return tokens[0]['token'] if tokens else ''


isolated_rows = json.loads((ROOT / 'audit' / 'ysgpc' / 'isolated-review.json').read_text(encoding='utf-8'))
isolated = {
    (row['wordList'], row['unit'], row['index']): row
    for row in isolated_rows
}
additional_rows = json.loads((ROOT / 'audit' / 'ysgpc' / 'additional-review.json').read_text(encoding='utf-8'))
additional = {
    (row['wordList'], row['unit'], row['index']): row
    for row in additional_rows
}

word_lists = []
flat_rows = []
global_index = 0
for word_list_number in range(1, 8):
    units = []
    for unit_number in range(1, 6):
        raw_path = RAW_ROOT / f'word-list-{word_list_number}-unit-{unit_number}.json'
        raw = json.loads(raw_path.read_text(encoding='utf-8'))
        words = []
        for item in raw['words']:
            global_index += 1
            key = (word_list_number, unit_number, item['index'])
            original = item['word']
            final_word = original
            evidence = 'whole-track-asr'
            confidence = None
            notes = []

            if item['status'] == 'review':
                review = isolated[key]
                pass_one = first_token(review['passes'][0])
                pass_two = first_token(review['passes'][1])
                final_word = pass_one or pass_two
                evidence = 'isolated-word-double-pass'
                if pass_one and pass_two and pass_one != pass_two:
                    notes.append(f'isolated candidates: {pass_one} / {pass_two}')
                probabilities = [
                    candidate['probability']
                    for pass_data in review['passes']
                    for candidate in pass_data.get('tokens', [])[:1]
                ]
                confidence = round(sum(probabilities) / len(probabilities), 5) if probabilities else None

            if key in additional:
                review = additional[key]
                candidate = first_token(review['isolatedPass'])
                if candidate:
                    final_word = candidate
                evidence = f'{evidence}+additional-{review["reason"]}-check'
                if candidate and candidate != original:
                    notes.append(f'additional candidate: {candidate}')

            if key in OVERRIDES:
                final_word = OVERRIDES[key]
                evidence = f'{evidence}+spelling-decision'

            final_word = final_word.lower().strip()
            if not final_word:
                raise ValueError(f'Empty final word at {key}')
            if not re.fullmatch(r"[a-z]+(?:[-'][a-z]+)*", final_word):
                raise ValueError(f'Invalid final spelling {final_word!r} at {key}')

            status = 'print-check' if key in NEEDS_PRINT_CHECK else ('corrected' if final_word != original or item['status'] == 'review' else 'recognized')
            if key in NEEDS_PRINT_CHECK:
                notes.append(NEEDS_PRINT_CHECK[key])
            row = {
                'globalIndex': global_index,
                'wordList': word_list_number,
                'unit': unit_number,
                'index': item['index'],
                'word': final_word,
                'start': item['start'],
                'end': item['end'],
                'audioFile': raw['audioFile'],
                'status': status,
                'evidence': evidence,
                'confidence': confidence,
                'notes': '; '.join(notes),
            }
            words.append(row)
            flat_rows.append(row)
        units.append({
            'unit': unit_number,
            'audioFile': raw['audioFile'],
            'duration': raw['duration'],
            'wordCount': len(words),
            'words': words,
        })
    word_lists.append({
        'wordList': word_list_number,
        'wordCount': sum(unit['wordCount'] for unit in units),
        'units': units,
    })

OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
payload = {
    'source': {
        'title': '7天搞定雅思高频核心词',
        'isbn': '9787553650340',
        'input': '35 MP3 tracks containing isolated English word pronunciations',
    },
    'extraction': {
        'wordListCount': len(word_lists),
        'unitCount': sum(len(item['units']) for item in word_lists),
        'wordCount': len(flat_rows),
        'recognizedCount': sum(item['status'] == 'recognized' for item in flat_rows),
        'correctedCount': sum(item['status'] == 'corrected' for item in flat_rows),
        'printCheckCount': sum(item['status'] == 'print-check' for item in flat_rows),
        'method': 'voice-boundary segmentation, whole-track ASR, isolated-word rechecks, lexical and duplicate audit',
    },
    'wordLists': word_lists,
}
(OUTPUT_ROOT / 'word-lists.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')

columns = ['globalIndex', 'wordList', 'unit', 'index', 'word', 'start', 'end', 'audioFile', 'status', 'evidence', 'confidence', 'notes']
with (OUTPUT_ROOT / 'word-lists.csv').open('w', encoding='utf-8-sig', newline='') as handle:
    writer = csv.DictWriter(handle, fieldnames=columns)
    writer.writeheader()
    writer.writerows(flat_rows)

with (OUTPUT_ROOT / 'print-check.csv').open('w', encoding='utf-8-sig', newline='') as handle:
    writer = csv.DictWriter(handle, fieldnames=columns)
    writer.writeheader()
    writer.writerows(item for item in flat_rows if item['status'] == 'print-check')

markdown = [
    '# 7 个 Word List、35 个 Unit 单词清单',
    '',
    f'- 实际独立发音词位：{len(flat_rows):,}',
    f'- 已识别：{payload["extraction"]["recognizedCount"]:,}',
    f'- 经复听或词形检查修正：{payload["extraction"]["correctedCount"]:,}',
    f'- 建议与纸质原书再核对：{payload["extraction"]["printCheckCount"]:,}',
    '',
]
for word_list in word_lists:
    markdown.extend([f'## Word List {word_list["wordList"]}（{word_list["wordCount"]} 词）', ''])
    for unit in word_list['units']:
        markdown.extend([f'### Unit {unit["unit"]}（{unit["wordCount"]} 词）', ''])
        for start in range(0, len(unit['words']), 10):
            chunk = unit['words'][start:start + 10]
            markdown.append(' · '.join(f'{item["index"]}. {item["word"]}' for item in chunk))
        markdown.append('')
(OUTPUT_ROOT / 'word-lists.md').write_text('\n'.join(markdown), encoding='utf-8')

readme = f'''# ysgpc 单词提取结果

本目录整理自 `ysgpc/Word List1` 至 `Word List7` 的 35 个纯英语单词发音 MP3。

## 文件

- `word-lists.md`：便于人工阅读，按 7 个 Word List、35 个 Unit 分组。
- `word-lists.csv`：便于 Excel、脚本和后续词库导入。
- `word-lists.json`：保留分组、音频路径、时间戳和审核状态的完整结构化数据。
- `print-check.csv`：{payload['extraction']['printCheckCount']} 个建议将来与纸质原书拼写再核对的同音或连续重复词位。

## 当前结果

- 7 个 Word List
- 35 个 Unit
- {len(flat_rows):,} 个实际独立发音词位
- {payload['extraction']['correctedCount']:,} 个词位经过单词级复听或词形校正
- {payload['extraction']['printCheckCount']} 个词位保留纸质版核对标记

“约 3,500 词”是出版物的概数；本目录按音频中的真实独立发音边界计数，不补词凑数。
'''
(OUTPUT_ROOT / 'README.md').write_text(readme, encoding='utf-8')

counts = Counter(item['status'] for item in flat_rows)
print(f'lists={len(word_lists)} units={sum(len(item["units"]) for item in word_lists)} words={len(flat_rows)} statuses={dict(counts)}')

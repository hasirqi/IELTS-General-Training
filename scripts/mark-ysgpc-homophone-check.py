import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'ysgpc' / 'extracted'
payload_path = OUTPUT / 'word-lists.json'
payload = json.loads(payload_path.read_text(encoding='utf-8'))
rows = [word for word_list in payload['wordLists'] for unit in word_list['units'] for word in unit['words']]

target = next(word for word in rows if (word['wordList'], word['unit'], word['index']) == (1, 1, 6))
target['status'] = 'print-check'
note = 'homophone cannot be distinguished from audio alone: complement / compliment'
if note not in target['notes']:
    target['notes'] = f'{target["notes"]}; {note}'.strip('; ')

payload['extraction']['recognizedCount'] = sum(word['status'] == 'recognized' for word in rows)
payload['extraction']['correctedCount'] = sum(word['status'] == 'corrected' for word in rows)
payload['extraction']['printCheckCount'] = sum(word['status'] == 'print-check' for word in rows)
payload_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')

columns = ['globalIndex', 'wordList', 'unit', 'index', 'word', 'start', 'end', 'audioFile', 'status', 'evidence', 'confidence', 'notes']
for filename, selected in (
    ('word-lists.csv', rows),
    ('print-check.csv', [word for word in rows if word['status'] == 'print-check']),
):
    with (OUTPUT / filename).open('w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        writer.writerows(selected)

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
(OUTPUT / 'word-lists.md').write_text('\n'.join(markdown), encoding='utf-8')

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
- {len(rows):,} 个实际独立发音词位
- {payload['extraction']['correctedCount']:,} 个词位经过单词级复听或词形校正
- {payload['extraction']['printCheckCount']} 个词位保留纸质版核对标记

“约 3,500 词”是出版物的概数；本目录按音频中的真实独立发音边界计数，不补词凑数。
'''
(OUTPUT / 'README.md').write_text(readme, encoding='utf-8')
print(f'print-check count={payload["extraction"]["printCheckCount"]}')

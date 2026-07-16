import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path('.tools/faster-whisper-lib').resolve()))

import av
import numpy as np
from faster_whisper import WhisperModel


ROOT = Path(__file__).resolve().parents[1]
RAW_ROOT = ROOT / 'audit' / 'ysgpc' / 'raw'
OUTPUT = ROOT / 'audit' / 'ysgpc' / 'additional-review.json'
MODEL_ROOT = ROOT / '.tools' / 'whisper-models'


def load_audio(path: Path, sample_rate: int = 16_000) -> np.ndarray:
    container = av.open(str(path))
    resampler = av.AudioResampler(format='s16', layout='mono', rate=sample_rate)
    chunks = []
    for frame in container.decode(container.streams.audio[0]):
        for output in resampler.resample(frame):
            chunks.append(output.to_ndarray().reshape(-1).copy())
    for output in resampler.resample(None):
        chunks.append(output.to_ndarray().reshape(-1).copy())
    return np.concatenate(chunks).astype(np.float32) / 32768.0


def clean(value: str):
    value = value.strip().lower().replace('’', "'")
    return re.sub(r'^[^a-z]+|[^a-z\-\']+$', '', value)


def transcribe_one(model, audio, start, end):
    sample_rate = 16_000
    left = max(0, int((start - 0.35) * sample_rate))
    right = min(len(audio), int((end + 0.35) * sample_rate))
    transcript, _ = model.transcribe(
        audio[left:right], language='en', beam_size=8, best_of=8,
        condition_on_previous_text=False, word_timestamps=True,
        vad_filter=False,
        initial_prompt='One isolated English dictionary word, pronounced clearly.',
    )
    tokens = []
    text = []
    for segment in transcript:
        text.append(segment.text.strip())
        for word in segment.words or []:
            token = clean(word.word)
            if token:
                tokens.append({'token': token, 'probability': round(float(word.probability), 5)})
    return {'text': ' '.join(text), 'tokens': tokens}


def main():
    lexical = json.loads((ROOT / 'audit' / 'ysgpc' / 'lexical-audit.json').read_text(encoding='utf-8'))
    coordinates = {
        (item['wordList'], item['unit'], item['index']): 'lexical'
        for item in lexical['additionalReviewItems']
    }
    duplicate_words = {item['word'] for item in lexical['duplicateSpellings']}
    units = {}
    for path in sorted(RAW_ROOT.glob('word-list-*.json')):
        unit = json.loads(path.read_text(encoding='utf-8'))
        units[(unit['wordList'], unit['unit'])] = unit
        for item in unit['words']:
            if item['status'] == 'auto' and item['word'] in duplicate_words:
                key = (unit['wordList'], unit['unit'], item['index'])
                coordinates[key] = 'duplicate' if key not in coordinates else 'lexical+duplicate'

    model = WhisperModel('small.en', device='cpu', compute_type='int8', download_root=str(MODEL_ROOT))
    results = []
    started = time.time()
    current_unit = None
    audio = None
    for position, (key, reason) in enumerate(sorted(coordinates.items()), 1):
        word_list, unit_number, index = key
        unit = units[(word_list, unit_number)]
        if current_unit != (word_list, unit_number):
            audio = load_audio(ROOT / unit['audioFile'])
            current_unit = (word_list, unit_number)
        item = unit['words'][index - 1]
        result = transcribe_one(model, audio, item['start'], item['end'])
        results.append({
            'wordList': word_list, 'unit': unit_number, 'index': index,
            'start': item['start'], 'end': item['end'], 'reason': reason,
            'firstPass': item['word'], 'isolatedPass': result,
        })
        if position % 10 == 0 or position == len(coordinates):
            OUTPUT.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
            print(f'[{position}/{len(coordinates)}] {time.time() - started:.1f}s', flush=True)
    print(f'DONE: {len(results)} additional review slots')


if __name__ == '__main__':
    main()

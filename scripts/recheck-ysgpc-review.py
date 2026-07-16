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
OUTPUT = ROOT / 'audit' / 'ysgpc' / 'isolated-review.json'
MODEL_ROOT = ROOT / '.tools' / 'whisper-models'


def load_audio(path: Path, sample_rate: int = 16_000) -> np.ndarray:
    container = av.open(str(path))
    stream = container.streams.audio[0]
    resampler = av.AudioResampler(format='s16', layout='mono', rate=sample_rate)
    chunks = []
    for frame in container.decode(stream):
        for output in resampler.resample(frame):
            chunks.append(output.to_ndarray().reshape(-1).copy())
    for output in resampler.resample(None):
        chunks.append(output.to_ndarray().reshape(-1).copy())
    return np.concatenate(chunks).astype(np.float32) / 32768.0


def clean(value: str):
    value = value.strip().lower().replace('’', "'")
    return re.sub(r'^[^a-z]+|[^a-z\-\']+$', '', value)


def transcribe_one(model, audio, start, end, padding):
    sample_rate = 16_000
    left = max(0, int((start - padding) * sample_rate))
    right = min(len(audio), int((end + padding) * sample_rate))
    clip = audio[left:right]
    transcript, _ = model.transcribe(
        clip,
        language='en',
        beam_size=8,
        best_of=8,
        condition_on_previous_text=False,
        word_timestamps=True,
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
    return {'padding': padding, 'text': ' '.join(text), 'tokens': tokens}


def main():
    model = WhisperModel('small.en', device='cpu', compute_type='int8', download_root=str(MODEL_ROOT))
    results = []
    started = time.time()
    files = sorted(RAW_ROOT.glob('word-list-*.json'))
    total = sum(
        sum(item['status'] == 'review' for item in json.loads(path.read_text(encoding='utf-8'))['words'])
        for path in files
    )
    complete = 0
    for raw_path in files:
        unit = json.loads(raw_path.read_text(encoding='utf-8'))
        review = [item for item in unit['words'] if item['status'] == 'review']
        if not review:
            continue
        audio = load_audio(ROOT / unit['audioFile'])
        for item in review:
            passes = [transcribe_one(model, audio, item['start'], item['end'], padding) for padding in (0.35, 0.75)]
            results.append({
                'wordList': unit['wordList'],
                'unit': unit['unit'],
                'index': item['index'],
                'start': item['start'],
                'end': item['end'],
                'firstPass': item['word'],
                'passes': passes,
            })
            complete += 1
            if complete % 10 == 0 or complete == total:
                print(f'[{complete}/{total}] {time.time() - started:.1f}s', flush=True)
                OUTPUT.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    OUTPUT.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'DONE: {len(results)} review slots')


if __name__ == '__main__':
    main()

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
AUDIO_ROOT = ROOT / 'ysgpc'
OUTPUT_ROOT = ROOT / 'audit' / 'ysgpc' / 'raw'
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


def find_voice_segments(audio: np.ndarray, sample_rate: int = 16_000):
    frame_ms = 10
    frame_size = sample_rate * frame_ms // 1000
    frames = audio[:len(audio) // frame_size * frame_size].reshape(-1, frame_size)
    rms = np.sqrt(np.mean(frames * frames, axis=1))
    voiced = rms >= (100 / 32768)

    # A pause shorter than 250 ms is inside a pronunciation, not between words.
    starts = np.flatnonzero((~voiced) & np.r_[True, voiced[:-1]])
    for start in starts:
        end = start
        while end < len(voiced) and not voiced[end]:
            end += 1
        if start > 0 and end < len(voiced) and end - start < 25:
            voiced[start:end] = True

    changes = np.diff(np.r_[False, voiced, False].astype(np.int8))
    starts = np.flatnonzero(changes == 1)
    ends = np.flatnonzero(changes == -1)
    return [
        {'start': round(start * frame_ms / 1000, 3), 'end': round(end * frame_ms / 1000, 3)}
        for start, end in zip(starts, ends)
        if end - start >= 12
    ]


def clean_token(value: str) -> str:
    value = value.strip().lower().replace('’', "'")
    value = re.sub(r'^[^a-z]+|[^a-z\-\']+$', '', value)
    return value


def nearest_segment(midpoint: float, segments):
    containing = [
        index for index, item in enumerate(segments)
        if item['start'] - 0.18 <= midpoint <= item['end'] + 0.18
    ]
    if containing:
        return min(containing, key=lambda index: abs(midpoint - (segments[index]['start'] + segments[index]['end']) / 2))
    distances = [abs(midpoint - (item['start'] + item['end']) / 2) for item in segments]
    index = int(np.argmin(distances))
    return index if distances[index] <= 0.75 else None


def extract_file(model: WhisperModel, path: Path):
    audio = load_audio(path)
    voice_segments = find_voice_segments(audio)
    transcript, info = model.transcribe(
        audio,
        language='en',
        beam_size=5,
        best_of=5,
        condition_on_previous_text=False,
        word_timestamps=True,
        vad_filter=True,
        vad_parameters={'min_silence_duration_ms': 500},
        initial_prompt='Isolated advanced English vocabulary words, clearly pronounced one at a time.',
    )

    asr_tokens = []
    mapped = [[] for _ in voice_segments]
    transcript_segments = []
    for item in transcript:
        transcript_segments.append({'start': item.start, 'end': item.end, 'text': item.text.strip()})
        for word in item.words or []:
            token = clean_token(word.word)
            if not token:
                continue
            row = {
                'token': token,
                'start': round(word.start, 3),
                'end': round(word.end, 3),
                'probability': round(float(word.probability), 5),
            }
            asr_tokens.append(row)
            index = nearest_segment((word.start + word.end) / 2, voice_segments)
            if index is not None:
                mapped[index].append(row)

    slots = []
    # The first two voice segments are "Word List N" and "Unit N".
    for slot_index, segment_index in enumerate(range(2, len(voice_segments)), 1):
        candidates = mapped[segment_index]
        unique_tokens = []
        for candidate in candidates:
            if candidate['token'] not in unique_tokens:
                unique_tokens.append(candidate['token'])
        status = 'auto'
        if len(unique_tokens) != 1:
            status = 'review'
        elif candidates[0]['probability'] < 0.45:
            status = 'review'
        slots.append({
            'index': slot_index,
            **voice_segments[segment_index],
            'word': unique_tokens[0] if len(unique_tokens) == 1 else ' '.join(unique_tokens),
            'status': status,
            'candidates': candidates,
        })

    match = re.search(r'Word List(\d+)-Unit(\d+)', path.stem)
    assert match
    return {
        'wordList': int(match.group(1)),
        'unit': int(match.group(2)),
        'audioFile': path.relative_to(ROOT).as_posix(),
        'duration': round(float(info.duration), 3),
        'voiceSegmentCount': len(voice_segments),
        'headerSegments': [
            {**voice_segments[index], 'tokens': mapped[index]}
            for index in range(min(2, len(voice_segments)))
        ],
        'wordCount': len(slots),
        'reviewCount': sum(item['status'] == 'review' for item in slots),
        'words': slots,
        'asrTokens': asr_tokens,
        'asrSegments': transcript_segments,
    }


def main():
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    model = WhisperModel('small.en', device='cpu', compute_type='int8', download_root=str(MODEL_ROOT))
    files = sorted(AUDIO_ROOT.glob('Word List*/*.mp3'))
    started = time.time()
    summary = []
    for file_index, path in enumerate(files, 1):
        match = re.search(r'Word List(\d+)-Unit(\d+)', path.stem)
        output = OUTPUT_ROOT / f'word-list-{match.group(1)}-unit-{match.group(2)}.json'
        result = extract_file(model, path)
        output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
        summary.append({key: result[key] for key in ('wordList', 'unit', 'wordCount', 'reviewCount')})
        elapsed = time.time() - started
        print(
            f'[{file_index:02d}/{len(files)}] Word List {result["wordList"]} Unit {result["unit"]}: '
            f'{result["wordCount"]} words, {result["reviewCount"]} review, {elapsed:.1f}s elapsed',
            flush=True,
        )
    (OUTPUT_ROOT.parent / 'raw-summary.json').write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8'
    )
    print(f'DONE: {sum(item["wordCount"] for item in summary)} words across {len(summary)} units')


if __name__ == '__main__':
    main()

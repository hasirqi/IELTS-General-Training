import sys
from pathlib import Path

sys.path.insert(0, str(Path('.tools/faster-whisper-lib').resolve()))

import av
import numpy as np


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
    return np.concatenate(chunks).astype(np.float32)


def find_segments(audio: np.ndarray, sample_rate: int = 16_000):
    frame_ms = 10
    frame_size = sample_rate * frame_ms // 1000
    frames = audio[:len(audio) // frame_size * frame_size].reshape(-1, frame_size)
    rms = np.sqrt(np.mean(frames * frames, axis=1))
    voiced = rms >= 100
    max_gap = 25
    starts = np.flatnonzero((~voiced) & np.r_[True, voiced[:-1]])
    for start in starts:
        end = start
        while end < len(voiced) and not voiced[end]:
            end += 1
        if start > 0 and end < len(voiced) and end - start < max_gap:
            voiced[start:end] = True
    changes = np.diff(np.r_[False, voiced, False].astype(np.int8))
    starts = np.flatnonzero(changes == 1)
    ends = np.flatnonzero(changes == -1)
    return [
        (start * frame_ms / 1000, end * frame_ms / 1000)
        for start, end in zip(starts, ends)
        if end - start >= 12
    ]


files = sorted(Path('ysgpc').glob('Word List*/*.mp3'))
total = 0
for path in files:
    audio = load_audio(path)
    segments = find_segments(audio)
    vocabulary_count = len(segments) - 2
    total += vocabulary_count
    unit = path.stem.split('Unit')[-1]
    print(f'{path.parent.name}\tUnit {unit}\t{len(audio) / 16000:.2f}s\t{len(segments)} segments\t{vocabulary_count} words')
print(f'TOTAL\t{len(files)} files\t{total} vocabulary slots')

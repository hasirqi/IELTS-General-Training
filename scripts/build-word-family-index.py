"""Build the versioned 20K measurement index.

This script deliberately creates frequency-seeded *candidates*, not scored
assessment content. A family can enter scoring only after the separate anchor
review gate changes its status to ``item-authored`` or later.

The build uses wordfreq 3.1.1. Its code is Apache-2.0 and its bundled frequency
data is redistributable under CC BY-SA 4.0 with the upstream attributions
documented in THIRD_PARTY_NOTICES.md.
"""

from __future__ import annotations

import json
import math
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCAL_RUNTIME = ROOT / ".tools" / "wordfreq-runtime"
TEMP_RUNTIME = Path(os.environ.get("WORDFREQ_RUNTIME", r"C:\\tmp\\wordfreq-runtime"))

try:
    from wordfreq import top_n_list, zipf_frequency
except (ModuleNotFoundError, ImportError):
    for runtime in (TEMP_RUNTIME, LOCAL_RUNTIME):
        try:
            if (runtime / "wordfreq" / "__init__.py").exists():
                sys.path.insert(0, str(runtime))
                break
        except PermissionError:
            continue
    try:
        from wordfreq import top_n_list, zipf_frequency
    except (ModuleNotFoundError, ImportError) as error:
        raise SystemExit(
            "wordfreq 3.1.1 is required. Install it outside the web runtime or set WORDFREQ_RUNTIME."
        ) from error

SOURCE_ID = "wordfreq-en-3.1.1"
INDEX_VERSION = "wf20k-2026.07.24-v1"
WORD_RE = re.compile(r"^[a-z]+(?:'[a-z]+)?$")

IRREGULAR = {
    "am": "be", "are": "be", "been": "be", "being": "be", "is": "be",
    "was": "be", "were": "be", "has": "have", "had": "have", "having": "have",
    "does": "do", "did": "do", "done": "do", "doing": "do", "goes": "go",
    "went": "go", "gone": "go", "says": "say", "said": "say", "made": "make",
    "making": "make", "takes": "take", "took": "take", "taken": "take",
    "gets": "get", "got": "get", "gotten": "get", "comes": "come", "came": "come",
    "sees": "see", "saw": "see", "seen": "see", "knows": "know", "knew": "know",
    "known": "know", "thinks": "think", "thought": "think", "gives": "give",
    "gave": "give", "given": "give", "finds": "find", "found": "find",
    "writes": "write", "wrote": "write", "written": "write", "reads": "read",
    "children": "child", "men": "man", "women": "woman", "people": "person",
    "feet": "foot", "teeth": "tooth", "mice": "mouse", "better": "good",
    "best": "good", "worse": "bad", "worst": "bad",
}


def candidates_for_surface(word: str) -> list[tuple[str, str]]:
    """Return conservative possible heads, ordered from safest to broadest."""
    result: list[tuple[str, str]] = []
    if word in IRREGULAR:
        result.append((IRREGULAR[word], "irregular-inflection"))
    if word.endswith("'s") and len(word) > 3:
        result.append((word[:-2], "possessive"))
    if word.endswith("ies") and len(word) > 4:
        result.append((word[:-3] + "y", "plural"))
    if word.endswith("ves") and len(word) > 4:
        result.extend([(word[:-3] + "f", "plural"), (word[:-3] + "fe", "plural")])
    if word.endswith("es") and len(word) > 4:
        result.append((word[:-2], "plural"))
    if word.endswith("s") and not word.endswith(("ss", "us", "is")) and len(word) > 3:
        result.append((word[:-1], "plural"))
    if word.endswith("ied") and len(word) > 4:
        result.append((word[:-3] + "y", "past"))
    if word.endswith("ed") and len(word) > 4:
        stem = word[:-2]
        result.extend([(stem, "past"), (stem + "e", "past")])
        if len(stem) > 2 and stem[-1] == stem[-2]:
            result.append((stem[:-1], "past"))
    if word.endswith("ing") and len(word) > 5:
        stem = word[:-3]
        result.extend([(stem, "participle"), (stem + "e", "participle")])
        if len(stem) > 2 and stem[-1] == stem[-2]:
            result.append((stem[:-1], "participle"))
    if word.endswith("er") and len(word) > 4:
        result.extend([(word[:-2], "comparative"), (word[:-1], "agent-noun")])
    if word.endswith("est") and len(word) > 5:
        result.append((word[:-3], "superlative"))
    if word.endswith("ly") and len(word) > 4:
        result.extend([(word[:-2], "transparent-adverb"), (word[:-2] + "y", "transparent-adverb")])
    for suffix, replacement, label in (
        ("ness", "", "transparent-noun"),
        ("ment", "", "transparent-noun"),
        ("tion", "te", "transparent-noun"),
        ("ation", "ate", "transparent-noun"),
        ("ity", "", "transparent-noun"),
        ("able", "", "transparent-adjective"),
        ("less", "", "transparent-adjective"),
        ("ful", "", "transparent-adjective"),
    ):
        if word.endswith(suffix) and len(word) > len(suffix) + 3:
            result.append((word[:-len(suffix)] + replacement, label))
    return result


def syllable_count(word: str) -> int:
    cleaned = re.sub(r"[^a-z]", "", word)
    if not cleaned:
        return 0
    groups = re.findall(r"[aeiouy]+", cleaned)
    count = max(1, len(groups))
    if cleaned.endswith("e") and not cleaned.endswith(("le", "ye")) and count > 1:
        count -= 1
    return count


def frequency_band(rank: int) -> str:
    if rank <= 8_000:
        return f"{math.ceil(rank / 1_000)}K"
    if rank <= 14_000:
        return f"{math.ceil(rank / 1_000)}K"
    return f"{math.ceil(rank / 1_000)}K"


surfaces = [
    word.lower()
    for word in top_n_list("en", 80_000, wordlist="best")
    if WORD_RE.fullmatch(word.lower())
]
surface_set = set(surfaces)
surface_rank = {word: index + 1 for index, word in enumerate(surfaces)}


def resolve_head(word: str) -> tuple[str, str]:
    for candidate, relation in candidates_for_surface(word):
        if candidate in surface_set and surface_rank[candidate] < surface_rank[word]:
            return candidate, relation
    return word, "surface-headword"


families: dict[str, dict] = {}
members: dict[str, list[str]] = defaultdict(list)
relations: dict[str, set[str]] = defaultdict(set)
for word in surfaces:
    head, relation = resolve_head(word)
    members[head].append(word)
    relations[head].add(relation)
    if head not in families:
        families[head] = {
            "headword": head,
            "sourceRank": surface_rank.get(head, surface_rank[word]),
            "zipfFrequency": round(zipf_frequency(head, "en", wordlist="best"), 3),
        }

ordered_heads = sorted(
    families,
    key=lambda head: (families[head]["sourceRank"], head),
)[:20_000]
head_to_id = {head: f"wf-{index:05d}" for index, head in enumerate(ordered_heads, 1)}

index_rows = []
for index, head in enumerate(ordered_heads, 1):
    row_members = sorted(set(members[head]), key=lambda item: (surface_rank[item], item))
    index_rows.append({
        "familyId": head_to_id[head],
        "headword": head,
        "members": row_members,
        "frequencyRank": index,
        "frequencyBand": frequency_band(index),
        "zipfFrequency": families[head]["zipfFrequency"],
        "partsOfSpeech": [],
        "syllables": syllable_count(head),
        "ageOfAcquisition": None,
        "concreteness": None,
        "derivationType": sorted(relations[head]),
        "properNoun": False,
        "numberLike": False,
        "teachingLexiconIds": [],
        "source": SOURCE_ID,
        "licence": "Apache-2.0 code; CC-BY-SA-4.0 bundled frequency data",
        "reviewStatus": "frequency-seeded",
        "version": INDEX_VERSION,
    })

row_by_head = {row["headword"]: row for row in index_rows}
member_to_head = {
    member: row["headword"]
    for row in index_rows
    for member in row["members"]
}

lexicon = json.loads((ROOT / "src" / "content" / "lexicon.json").read_text(encoding="utf-8"))
mapping = []
for item in lexicon:
    normalized = item["term"].strip().lower()
    tokens = re.findall(r"[a-z]+(?:'[a-z]+)?", normalized)
    matched_heads: list[str] = []
    outcome = "unmatched"
    if len(tokens) == 1:
        token = tokens[0]
        head = member_to_head.get(token)
        if not head:
            proposed, _ = resolve_head(token) if token in surface_set else (token, "unmatched")
            head = proposed if proposed in row_by_head else None
        if head:
            matched_heads = [head]
            outcome = "direct" if token == head else "member"
    elif tokens:
        matched_heads = list(dict.fromkeys(
            member_to_head[token]
            for token in tokens
            if token in member_to_head
        ))
        outcome = "components" if matched_heads else "unmatched"
    family_ids = [head_to_id[head] for head in matched_heads]
    for head in matched_heads:
        row_by_head[head]["teachingLexiconIds"].append(item["id"])
    mapping.append({
        "lexiconId": item["id"],
        "term": item["term"],
        "kind": item["kind"],
        "outcome": outcome,
        "familyIds": family_ids,
        "version": INDEX_VERSION,
    })

for row in index_rows:
    row["teachingLexiconIds"].sort()

counts = {
    "families": len(index_rows),
    "teachingItems": len(mapping),
    "direct": sum(item["outcome"] == "direct" for item in mapping),
    "member": sum(item["outcome"] == "member" for item in mapping),
    "components": sum(item["outcome"] == "components" for item in mapping),
    "unmatched": sum(item["outcome"] == "unmatched" for item in mapping),
}
meta = {
    "version": INDEX_VERSION,
    "generatedAt": "2026-07-24",
    "measurementUnit": "frequency-seeded word-family candidate",
    "scoringEligibleStatuses": ["item-authored", "pilot-active", "calibrated"],
    "nonScoringStatuses": ["frequency-seeded", "expert-reviewed"],
    "source": {
        "id": SOURCE_ID,
        "name": "wordfreq",
        "version": "3.1.1",
        "upstream": "https://github.com/rspeer/wordfreq",
        "codeLicence": "Apache-2.0",
        "dataLicence": "CC-BY-SA-4.0 with upstream source attributions",
        "redistribution": "Derived ranks may be redistributed with attribution and share-alike notice",
    },
    "familyPolicy": {
        "status": "frequency-seeded; every scored anchor requires human review",
        "inflections": "conservative rule-based grouping plus explicit irregular forms",
        "transparentDerivations": "candidate grouping only; false merges are corrected during expert review",
        "multiwordChunks": "mapped to component families; never counted as an extra word family",
        "properNouns": "excluded by lowercase source filtering unless explicitly reviewed later",
        "numbers": "excluded from the 20K family count and handled separately",
    },
    "counts": counts,
}

content_dir = ROOT / "src" / "content"
(content_dir / "word-family-index-20k.json").write_text(
    json.dumps(index_rows, ensure_ascii=False, separators=(",", ":")) + "\n",
    encoding="utf-8",
)
(content_dir / "teaching-lexicon-family-map.json").write_text(
    json.dumps(mapping, ensure_ascii=False, separators=(",", ":")) + "\n",
    encoding="utf-8",
)
(content_dir / "word-family-index.meta.json").write_text(
    json.dumps(meta, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(json.dumps(counts, ensure_ascii=False))

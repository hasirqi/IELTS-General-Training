import csv
import json
import math
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PLAN_PATH = ROOT / "ysgpc" / "extracted" / "expansion-plan.json"
CSV_PATH = ROOT / "ysgpc" / "extracted" / "expansion-batches.csv"
PLAN = json.loads(PLAN_PATH.read_text(encoding="utf-8"))

held_terms = set(PLAN["curation"]["heldTerms"])
print_check = [item for item in PLAN["candidates"] if item["sourceStatus"] == "print-check"]
held = [item for item in PLAN["candidates"] if item["term"] in held_terms]
eligible = [
    item for item in PLAN["candidates"]
    if item["sourceStatus"] == "ready" and item["term"] not in held_terms
]

# Preserve the manually curated first 200, then retain the previous value ordering.
eligible.sort(key=lambda item: (
    0 if item.get("learningPriority") == "high" else 1,
    item.get("priorityIndex", 999999),
    item["sourceGlobalIndex"],
))
for index, item in enumerate(eligible, 1):
    item["priorityIndex"] = index
    item["batch"] = math.ceil(index / 200)
for item in held:
    item["priorityIndex"] = None
    item["batch"] = None
    item["learningPriority"] = "hold"

batches = []
for batch_number in range(1, math.ceil(len(eligible) / 200) + 1):
    batch = [item for item in eligible if item["batch"] == batch_number]
    tiers = Counter(item.get("recommendedTier", item["valueTier"]) for item in batch)
    priorities = Counter(item.get("learningPriority", "medium") for item in batch)
    batches.append({
        "batch": batch_number,
        "count": len(batch),
        "startPriority": batch[0]["priorityIndex"],
        "endPriority": batch[-1]["priorityIndex"],
        "active": tiers["active"],
        "receptive": tiers["receptive"],
        "extension": tiers["extension"],
        "high": priorities["high"],
        "medium": priorities["medium"],
        "low": priorities["low"],
        "hold": 0,
    })

PLAN["merge"]["sourceReadyBeforeCuration"] = PLAN["merge"]["readyForBatches"]
PLAN["merge"]["curationHeld"] = len(held)
PLAN["merge"]["eligibleForBatches"] = len(eligible)
PLAN["merge"]["remainingAfterBatch01"] = len(eligible) - 200
PLAN["batchCount"] = len(batches)
PLAN["batches"] = batches
PLAN["candidates"] = eligible + held + print_check
PLAN_PATH.write_text(json.dumps(PLAN, ensure_ascii=False, indent=2), encoding="utf-8")

columns = [
    "priorityIndex", "batch", "term", "canonicalTerm", "valueTier", "recommendedTier",
    "learningPriority", "contentCategory", "frequency", "score", "sourceStatus",
    "sourceGlobalIndex", "wordList", "unit", "unitIndex", "sourceOccurrences",
    "audioFile", "start", "end",
]
with CSV_PATH.open("w", encoding="utf-8-sig", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=columns, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(PLAN["candidates"])

print(json.dumps({
    "netNew": PLAN["merge"]["netNewUniqueTerms"],
    "printCheck": len(print_check),
    "curationHeld": len(held),
    "eligible": len(eligible),
    "batches": len(batches),
    "lastBatch": batches[-1]["count"],
    "remainingAfterPublishedBatch01": len(eligible) - 200,
}, ensure_ascii=False, indent=2))

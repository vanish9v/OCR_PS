from collections import Counter
from Levenshtein import distance as levenshtein_distance
from app.types.entities import Form

def collect_canonical_variants(forms: list[Form]) -> dict[str, list[dict]]:
    """Group extracted field values by their canonical_key across forms, deduplicating by value."""
    raw: dict[str, dict[str, dict]] = {}  # key -> value -> {value, sources[], confidence}
    for form in forms:
        for field in form.extracted_fields:
            if field.canonical_key and field.value is not None:
                val = str(field.value)
                conf = field.confidence or 0.0
                bucket = raw.setdefault(field.canonical_key, {})
                if val in bucket:
                    bucket[val]["sources"].append(form.type.value)
                    bucket[val]["confidence"] = max(bucket[val]["confidence"], conf)
                else:
                    bucket[val] = {
                        "value": val,
                        "sources": [form.type.value],
                        "confidence": conf,
                    }
    # Convert to list per key
    return {key: list(entries.values()) for key, entries in raw.items()}

def reconcile_canonical(variants: dict[str, list[dict]]) -> dict[str, dict]:
    """For each canonical key, pick the best value. Returns {key: {chosen, conflict, variants}}."""
    result: dict[str, dict] = {}
    for key, entries in variants.items():
        unique_values = [e["value"] for e in entries]
        if len(unique_values) == 1:
            result[key] = {"chosen": unique_values[0], "conflict": False, "variants": entries}
        else:
            # Pick value with most sources; break ties by highest confidence
            best = max(entries, key=lambda e: (len(e["sources"]), e["confidence"]))
            result[key] = {"chosen": best["value"], "conflict": True, "variants": entries}
    return result

def detect_form_mixing(variants: dict[str, list[dict]]) -> list[str]:
    """Check for wildly different canonical values that suggest pages from different candidates."""
    warnings: list[str] = []
    for key, entries in variants.items():
        unique_values = [e["value"] for e in entries]
        if len(unique_values) < 2:
            continue
        if "ssn" in key:
            # Any SSN digit mismatch is a hard warning
            if len(unique_values) > 1:
                warnings.append(
                    f"SSN values differ significantly across forms ({key}): {unique_values}. "
                    f"Possible form mixing — verify all pages belong to the same candidate."
                )
        elif "name" in key:
            for i in range(len(unique_values)):
                for j in range(i + 1, len(unique_values)):
                    dist = levenshtein_distance(unique_values[i].lower(), unique_values[j].lower())
                    if dist > 3:
                        warnings.append(
                            f"Name values differ significantly across forms ({key}): "
                            f"'{unique_values[i]}' vs '{unique_values[j]}' (distance={dist}). "
                            f"Possible form mixing — verify all pages belong to the same candidate."
                        )
    return warnings

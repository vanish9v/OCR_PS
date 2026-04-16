# apps/api/app/services/classifier.py
from pathlib import Path
from app.types.entities import FormType
from app.services.anthropic_client import classify_image

VALID_LABELS = {ft.value for ft in FormType}

SYSTEM_PROMPT = """You are a document classifier for ProService Hawaii new-hire employment packets.
Given a scanned page image, identify which form type it is.
Return EXACTLY one label from this list, nothing else:
COVER, EMPLOYMENT_FORM, EMPLOYMENT_AGREEMENT, I9_SEC1, I9_SEC2, I9_LISTS, I9_SUPP,
W4, HW4, HW4_WORKSHEET, MARKETPLACE_NOTICE, HC5, DIRECT_DEPOSIT, HANDBOOK_ACK, OTHER"""

USER_PROMPT = "Classify this scanned form page. Return only the label."

def classify_pages(page_paths: list[str | Path]) -> list[tuple[int, FormType]]:
    """Classify each page image. Returns list of (page_number, FormType), 1-indexed."""
    results: list[tuple[int, FormType]] = []
    for i, path in enumerate(page_paths, start=1):
        raw = classify_image(path, system=SYSTEM_PROMPT, prompt=USER_PROMPT)
        label = raw.strip().upper()
        if label in VALID_LABELS:
            results.append((i, FormType(label)))
        else:
            results.append((i, FormType.OTHER))
    return results

# apps/api/app/services/extractor.py
import json
import re
from pathlib import Path
from app.types.entities import FormType, Field, BBox
from app.services.extraction_schemas import get_schema, FieldDef, SKIP_EXTRACTION
from app.services.anthropic_client import extract_from_image

SYSTEM_PROMPT = """You are a document extraction specialist for ProService Hawaii new-hire employment packets.
Extract ONLY the fields listed below from the scanned form image.
Return a JSON object where each key is the field name and the value is an object with:
  - "value": the extracted value (string, number, or boolean as appropriate)
  - "confidence": a float 0.0-1.0 indicating how confident you are in the extraction

If a field is blank, missing, or completely illegible, return {"value": null, "confidence": 0.0}.
For boolean fields (signature_present etc.), return true/false with confidence.
For dates, return exactly what is written (do not reformat).
Return ONLY valid JSON, no markdown, no explanation."""

def _build_prompt(fields: list[FieldDef]) -> str:
    lines = ["Extract these fields from the form image:\n"]
    for f in fields:
        req = " (REQUIRED)" if f.required else " (optional)"
        lines.append(f"- {f.name}: {f.description} [type: {f.field_type}]{req}")
    lines.append("\nReturn JSON only.")
    return "\n".join(lines)

def _parse_response(raw: str, schema: list[FieldDef]) -> list[Field]:
    """Parse Claude's JSON response into Field objects."""
    # Try to extract JSON from response (handle markdown code blocks)
    json_match = re.search(r'\{[\s\S]*\}', raw)
    if not json_match:
        return [Field(name=f.name, value=None, confidence=0.0, canonical_key=f.canonical_key) for f in schema]

    try:
        data = json.loads(json_match.group())
    except json.JSONDecodeError:
        return [Field(name=f.name, value=None, confidence=0.0, canonical_key=f.canonical_key) for f in schema]

    fields: list[Field] = []
    for f_def in schema:
        entry = data.get(f_def.name, {})
        if isinstance(entry, dict):
            val = entry.get("value")
            conf = float(entry.get("confidence", 0.0))
        else:
            val = entry
            conf = 0.5  # value present but not in expected format
        fields.append(Field(
            name=f_def.name,
            value=val,
            confidence=conf,
            canonical_key=f_def.canonical_key,
            raw_value=val,
        ))
    return fields

def extract_form_fields(image_path: str | Path, form_type: FormType) -> list[Field]:
    """Extract fields from a single page image given its classified form type."""
    if form_type in SKIP_EXTRACTION:
        return []
    schema = get_schema(form_type)
    if not schema:
        return []
    prompt = _build_prompt(schema)
    raw = extract_from_image(image_path, system=SYSTEM_PROMPT, prompt=prompt)
    return _parse_response(raw, schema)

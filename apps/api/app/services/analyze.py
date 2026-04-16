# apps/api/app/services/analyze.py
from app.types.entities import Form, Field, FormType, FieldStatus, CandidateState
from app.services.classifier import classify_pages
from app.services.extraction_schemas import get_schema, SKIP_EXTRACTION
from app.services.extractor import extract_form_fields
from app.services.normalizer import normalize_field_value
from app.services.validator import validate_form_fields
from app.services.mapper import apply_all_mappings
from app.services.reconciler import collect_canonical_variants, reconcile_canonical, detect_form_mixing
from app.types.entities import Client
import uuid

def run_analyze(page_image_paths: list[str], client: Client) -> dict:
    """Run the full analyze pipeline. Returns a review bundle dict."""
    # Stage 1: Classify
    classifications = classify_pages(page_image_paths)

    # Stage 2: Extract + Normalize
    forms: list[Form] = []
    for page_num, form_type in classifications:
        if form_type in SKIP_EXTRACTION:
            forms.append(Form(id=f"form_{uuid.uuid4().hex[:8]}", packet_id="", type=form_type, page_range=[page_num]))
            continue
        fields = extract_form_fields(page_image_paths[page_num - 1], form_type)
        # Normalize extracted values
        schema = get_schema(form_type) or []
        schema_map = {fd.name: fd for fd in schema}
        for f in fields:
            fd = schema_map.get(f.name)
            if fd:
                normalized = normalize_field_value(f.value, fd.field_type)
                if normalized is not None:
                    f.raw_value = f.value
                    f.value = normalized

        # Stage 3: Validate
        fields = validate_form_fields(fields, schema, client.codes)

        # Build confidence summary
        summary = {"green": 0, "orange": 0, "red": 0, "yellow": 0}
        for f in fields:
            summary[f.status.value] = summary.get(f.status.value, 0) + 1

        forms.append(Form(
            id=f"form_{uuid.uuid4().hex[:8]}", packet_id="", type=form_type,
            page_range=[page_num], extracted_fields=fields, confidence_summary=summary,
        ))

    # Stage 4: Map + Derive Prism codes
    employment_form = next((f for f in forms if f.type == FormType.EMPLOYMENT_FORM), None)
    position_title = None
    org_level = None
    employment_status = None
    if employment_form:
        field_map = {f.name: f.value for f in employment_form.extracted_fields}
        position_title = field_map.get("position_title")
        org_level = field_map.get("org_level_1") or field_map.get("org_level_2")
        employment_status = field_map.get("employment_status")
    prism_codes = apply_all_mappings(position_title, org_level, employment_status, client)

    # Stage 5: Cross-form reconcile
    variants = collect_canonical_variants(forms)
    reconciliation = reconcile_canonical(variants)
    warnings = detect_form_mixing(variants)

    # Stage 6: Determine suggested state
    all_green = all(
        f.status == FieldStatus.GREEN
        for form in forms
        for f in form.extracted_fields
    )
    candidate_state = CandidateState.READY.value if (all_green and not warnings) else CandidateState.UNDER_REVIEW.value

    return {
        "forms": [f.model_dump() for f in forms],
        "prism_codes": prism_codes,
        "reconciliation": reconciliation,
        "warnings": warnings,
        "candidate_state": candidate_state,
    }

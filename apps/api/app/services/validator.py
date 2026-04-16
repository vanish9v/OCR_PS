# apps/api/app/services/validator.py
from app.types.entities import Field, FieldStatus
from app.services.extraction_schemas import FieldDef
from app.services.normalizer import normalize_ssn, normalize_phone, validate_routing_aba

CONFIDENCE_THRESHOLD = 0.80

def validate_field(
    field: Field,
    field_def: FieldDef,
    codes: dict,
    business_code_field: str | None = None,
) -> tuple[FieldStatus, str]:
    """Validate a single field. Returns (status, message)."""
    # Optional field with null value is always green
    if not field_def.required and field.value is None:
        return FieldStatus.GREEN, ""

    # Required field missing
    if field_def.required and field.value is None:
        return FieldStatus.RED, f"Missing required field: {field_def.name}"

    # Low confidence
    if field.confidence is not None and field.confidence < CONFIDENCE_THRESHOLD:
        return FieldStatus.RED, f"Low confidence ({field.confidence:.2f}) on {field_def.name}"

    # Signature fields -- false means not present
    if field_def.field_type == "boolean" and "signature" in field_def.name:
        if field.value is False or field.value == "false":
            return FieldStatus.RED, f"Signature not present: {field_def.name}"
        return FieldStatus.GREEN, ""

    # Format validation by type
    if field_def.field_type == "ssn":
        normalized = normalize_ssn(str(field.value))
        if normalized is None:
            return FieldStatus.ORANGE, f"SSN format invalid (expected 9 digits): {field.value}"

    if field_def.field_type == "phone":
        normalized = normalize_phone(str(field.value))
        if normalized is None:
            return FieldStatus.ORANGE, f"Phone format invalid (expected 10 digits): {field.value}"

    if field_def.field_type == "routing":
        if not validate_routing_aba(str(field.value)):
            return FieldStatus.ORANGE, f"Routing number failed ABA checksum: {field.value}"

    # Business code check
    if business_code_field and business_code_field in codes:
        valid_codes = codes[business_code_field]
        if str(field.value).upper() not in [c.upper() for c in valid_codes]:
            return FieldStatus.ORANGE, f"{field_def.name} value '{field.value}' not in valid codes: {valid_codes}"

    return FieldStatus.GREEN, ""

def validate_form_fields(
    fields: list[Field],
    field_defs: list[FieldDef],
    codes: dict,
) -> list[Field]:
    """Validate all fields in a form, updating each field's status."""
    def_map = {fd.name: fd for fd in field_defs}
    for f in fields:
        fd = def_map.get(f.name)
        if fd is None:
            continue
        status, msg = validate_field(f, fd, codes)
        f.status = status
        if msg:
            f.raw_value = f.raw_value  # preserve pre-normalization
    return fields

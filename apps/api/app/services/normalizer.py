# apps/api/app/services/normalizer.py
import re
from datetime import datetime

MONTH_MAP = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
    "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6,
    "jul": 7, "july": 7, "aug": 8, "august": 8, "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12,
}

def normalize_ssn(value: str | None) -> str | None:
    if value is None:
        return None
    digits = re.sub(r'\D', '', str(value))
    return digits if len(digits) == 9 else None

def normalize_phone(value: str | None) -> str | None:
    if value is None:
        return None
    digits = re.sub(r'\D', '', str(value))
    return digits if len(digits) == 10 else None

def normalize_date(value: str | None) -> str | None:
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None

    # Try: MM/DD/YY or MM/DD/YYYY or M/D/YY
    m = re.match(r'^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$', s)
    if m:
        month, day, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if year < 100:
            year = year + 2000 if year < 50 else year + 1900
        try:
            return datetime(year, month, day).strftime("%Y-%m-%d")
        except ValueError:
            return None

    # Try: Month DD, YYYY or Month DD YYYY or Mon DD YY
    m = re.match(r'^([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{2,4})$', s)
    if m:
        month_str, day_str, year_str = m.group(1), m.group(2), m.group(3)
        month = MONTH_MAP.get(month_str.lower().rstrip('.'))
        if month is None:
            return None
        day, year = int(day_str), int(year_str)
        if year < 100:
            year = year + 2000 if year < 50 else year + 1900
        try:
            return datetime(year, month, day).strftime("%Y-%m-%d")
        except ValueError:
            return None

    return None

def validate_routing_aba(routing: str | None) -> bool:
    if routing is None:
        return False
    digits = re.sub(r'\D', '', str(routing))
    if len(digits) != 9:
        return False
    d = [int(c) for c in digits]
    checksum = (3*(d[0]+d[3]+d[6]) + 7*(d[1]+d[4]+d[7]) + (d[2]+d[5]+d[8])) % 10
    return checksum == 0

def normalize_zip(value: str | None) -> str | None:
    if value is None:
        return None
    s = str(value).strip()
    # Check for ZIP+4 pattern first
    m = re.match(r'^(\d{5})\s*[-\u2013]\s*(\d{4})$', s)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    digits = re.sub(r'\D', '', s)
    if len(digits) == 5:
        return digits
    if len(digits) == 9:
        return f"{digits[:5]}-{digits[5:]}"
    return s  # return as-is if unrecognizable

def normalize_field_value(value, field_type: str):
    """Dispatch normalization by field type."""
    if value is None:
        return None
    if field_type == "ssn":
        return normalize_ssn(value)
    if field_type == "phone":
        return normalize_phone(value)
    if field_type == "date":
        return normalize_date(value)
    if field_type == "routing":
        digits = re.sub(r'\D', '', str(value))
        return digits if len(digits) == 9 else str(value)
    if field_type == "string":
        return str(value).strip()
    return value  # currency, integer, boolean, account -- pass through

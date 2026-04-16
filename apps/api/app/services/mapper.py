# apps/api/app/services/mapper.py
from app.types.entities import Client

def map_position_to_job_code(position_title: str | None, client: Client) -> str | None:
    if not position_title:
        return None
    title_lower = position_title.strip().lower()
    for key, code in client.position_title_to_job_code.items():
        if key.lower() == title_lower:
            return code
    return None

def map_org_level_to_location(org_level_text: str | None, client: Client) -> str | None:
    if not org_level_text:
        return None
    text_lower = org_level_text.strip().lower()
    for keyword, code in client.organization_level_to_location.items():
        if keyword.lower() in text_lower:
            return code
    return None

def map_status_to_employee_type(status_text: str | None, client: Client) -> str | None:
    if not status_text:
        return None
    text_lower = status_text.strip().lower()
    for key, code in client.status_to_employee_type.items():
        if key.lower() == text_lower:
            return code
    return None

def derive_benefit_group(position_title: str | None, client: Client) -> str:
    if not position_title:
        return "PRIMARY"
    title_lower = position_title.strip().lower()
    for rule in client.benefit_group_rules:
        match_key = rule.get("if_position_title_contains")
        if match_key and match_key.lower() in title_lower:
            return rule["benefit_group"]
        if "default" in rule:
            return rule["default"]
    return "PRIMARY"

def apply_all_mappings(
    position_title: str | None,
    org_level: str | None,
    employment_status: str | None,
    client: Client,
) -> dict[str, str | None]:
    """Apply all mappings and return Prism-ready codes."""
    return {
        "job_code": map_position_to_job_code(position_title, client),
        "location_code": map_org_level_to_location(org_level, client),
        "employee_type": map_status_to_employee_type(employment_status, client),
        "benefit_group": derive_benefit_group(position_title, client),
        "pay_group": client.pay_group_constant,
        "employee_status": "A",  # all new hires are Active
    }

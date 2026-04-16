"""Build PrismHR API payloads from the analyze bundle."""


def _get_field(forms: list[dict], form_type: str, field_name: str):
    """Extract a field value from the bundle's forms."""
    for form in forms:
        if form.get("type") == form_type:
            for f in form.get("extracted_fields", []):
                if f.get("name") == field_name:
                    return f.get("value")
    # Fallback: search all forms
    for form in forms:
        for f in form.get("extracted_fields", []):
            if f.get("name") == field_name:
                return f.get("value")
    return None


def build_prism_payloads(bundle: dict, client_id: str) -> dict:
    """Build the 5 PrismHR API payloads from the analyze bundle."""
    forms = bundle.get("forms", [])
    codes = bundle.get("prism_codes", {})

    first = _get_field(forms, "EMPLOYMENT_FORM", "first_name")
    last = _get_field(forms, "EMPLOYMENT_FORM", "last_name")
    ssn = _get_field(forms, "EMPLOYMENT_FORM", "ssn")
    dob = _get_field(forms, "EMPLOYMENT_FORM", "dob")
    start_date = _get_field(forms, "EMPLOYMENT_FORM", "start_date_company")
    pay_type = _get_field(forms, "EMPLOYMENT_FORM", "pay_type")
    pay_amount = _get_field(forms, "EMPLOYMENT_FORM", "pay_amount")

    get_client_codes = {
        "method": "getClientCodes",
        "clientId": client_id,
        "note": "Fetches valid codes for this client. Already loaded in our system.",
    }

    import_employees = {
        "method": "importEmployees",
        "clientId": client_id,
        "firstName": first,
        "lastName": last,
        "ssn": ssn,
        "dateOfBirth": dob,
        "hireDate": start_date,
        "jobCode": codes.get("job_code"),
        "locationCode": codes.get("location_code"),
        "employeeType": codes.get("employee_type"),
        "benefitGroup": codes.get("benefit_group"),
        "payGroup": codes.get("pay_group"),
        "employeeStatus": codes.get("employee_status"),
        "payType": pay_type,
        "payAmount": pay_amount,
    }

    commit_employees = {
        "method": "commitEmployees",
        "clientId": client_id,
        "employeeId": "{{auto-assigned by importEmployees}}",
        "note": "Two-phase commit: importEmployees stages, commitEmployees finalizes.",
    }

    # W-4
    filing = _get_field(forms, "W4", "filing_status")
    dependents = _get_field(forms, "W4", "step3_dependents_amount")
    extra = _get_field(forms, "W4", "step4c_extra_withholding")
    update_w4 = {
        "method": "updateW4",
        "employeeId": "{{from importEmployees}}",
        "filingStatus": filing,
        "dependentsAmount": dependents,
        "extraWithholding": extra,
    }

    # Direct Deposit
    routing = _get_field(forms, "DIRECT_DEPOSIT", "bank1_routing")
    account = _get_field(forms, "DIRECT_DEPOSIT", "bank1_account")
    acct_type = _get_field(forms, "DIRECT_DEPOSIT", "bank1_type")
    if routing and account:
        update_dd = {
            "method": "updateDirectDeposit",
            "employeeId": "{{from importEmployees}}",
            "routingNumber": routing,
            "accountNumber": account,
            "accountType": acct_type,
        }
    else:
        update_dd = None

    return {
        "getClientCodes": get_client_codes,
        "importEmployees": import_employees,
        "commitEmployees": commit_employees,
        "updateW4": update_w4,
        "updateDirectDeposit": update_dd,
    }

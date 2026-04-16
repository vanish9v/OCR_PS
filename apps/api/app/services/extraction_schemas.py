# apps/api/app/services/extraction_schemas.py
from dataclasses import dataclass
from app.types.entities import FormType

@dataclass
class FieldDef:
    name: str
    description: str
    field_type: str = "string"  # string, date, ssn, phone, currency, integer, boolean, routing, account
    required: bool = True
    canonical_key: str | None = None  # links to CanonicalEmployee/Employer field

# Forms that are reference-only — no extraction
SKIP_EXTRACTION = {FormType.COVER, FormType.I9_LISTS, FormType.MARKETPLACE_NOTICE, FormType.I9_SUPP, FormType.OTHER}

FORM_SCHEMAS: dict[FormType, list[FieldDef]] = {
    FormType.EMPLOYMENT_FORM: [
        # Supervisor section
        FieldDef("company_name", "Employer/company name", canonical_key="employer.company_name"),
        FieldDef("effective_date_proservice", "Effective date with ProService", field_type="date"),
        FieldDef("start_date_company", "Start date with company", field_type="date"),
        FieldDef("pay_type", "Hourly or Salary"),
        FieldDef("pay_amount", "Dollar amount of pay", field_type="currency"),
        FieldDef("pay_period", "Year, Month, Week, or Pay Period"),
        FieldDef("position_title", "Position title (e.g. Retail Worker, Instructor, Owner)"),
        FieldDef("job_title", "Job title if different from position", required=False),
        FieldDef("employment_status", "Full-Time, Part-Time, or Relief"),
        FieldDef("flsa_status", "Exempt or Non-Exempt"),
        FieldDef("org_level_1", "Organization Level 1", required=False),
        FieldDef("org_level_2", "Organization Level 2", required=False),
        FieldDef("supervisor_signature_present", "Is supervisor signature present?", field_type="boolean"),
        FieldDef("supervisor_date", "Date next to supervisor signature", field_type="date"),
        # Employee section
        FieldDef("last_name", "Employee last name", canonical_key="employee.last_name"),
        FieldDef("first_name", "Employee first name", canonical_key="employee.first_name"),
        FieldDef("middle_initial", "Middle initial", required=False, canonical_key="employee.middle_initial"),
        FieldDef("ssn", "Social Security Number", field_type="ssn", canonical_key="employee.ssn"),
        FieldDef("dob", "Date of birth", field_type="date", canonical_key="employee.dob"),
        FieldDef("residence_address", "Street address including apt", canonical_key="employee.residence_address"),
        FieldDef("city", "City"),
        FieldDef("state", "State"),
        FieldDef("zip_code", "ZIP code", field_type="string"),
        FieldDef("phone", "Telephone number", field_type="phone", canonical_key="employee.phone"),
        FieldDef("mobile_phone", "Mobile telephone", field_type="phone", required=False),
        FieldDef("email", "Email address", required=False, canonical_key="employee.email"),
        FieldDef("gender", "Male or Female", required=False),
        FieldDef("emergency_contact_name", "Emergency contact name", required=False),
        FieldDef("emergency_contact_relationship", "Relationship", required=False),
        FieldDef("emergency_contact_phone", "Emergency contact phone", field_type="phone", required=False),
    ],
    FormType.EMPLOYMENT_AGREEMENT: [
        FieldDef("effective_date", "Agreement effective date", field_type="date"),
        FieldDef("company_name", "Company name", canonical_key="employer.company_name"),
        FieldDef("employee_name", "Employee full name", canonical_key="employee.legal_name"),
        FieldDef("employee_signature_present", "Is employee signature present?", field_type="boolean"),
        FieldDef("signature_date", "Date of employee signature", field_type="date", required=False),
    ],
    FormType.I9_SEC1: [
        FieldDef("last_name", "Last/family name", canonical_key="employee.last_name"),
        FieldDef("first_name", "First/given name", canonical_key="employee.first_name"),
        FieldDef("middle_initial", "Middle initial", required=False, canonical_key="employee.middle_initial"),
        FieldDef("address", "Street address", canonical_key="employee.residence_address"),
        FieldDef("city", "City or town"),
        FieldDef("state", "State"),
        FieldDef("zip_code", "ZIP code"),
        FieldDef("dob", "Date of birth", field_type="date", canonical_key="employee.dob"),
        FieldDef("ssn", "Social Security Number", field_type="ssn", canonical_key="employee.ssn"),
        FieldDef("email", "Email address", required=False, canonical_key="employee.email"),
        FieldDef("phone", "Telephone number", field_type="phone", canonical_key="employee.phone"),
        FieldDef("citizenship_status", "Which box checked: citizen, noncitizen_national, permanent_resident, alien_authorized"),
        FieldDef("employee_signature_present", "Is employee signature present in Section 1?", field_type="boolean"),
        FieldDef("signature_date", "Today's date in Section 1", field_type="date", required=False),
    ],
    FormType.I9_SEC2: [
        FieldDef("list_a_document", "List A document title if used", required=False),
        FieldDef("list_a_issuing_authority", "List A issuing authority", required=False),
        FieldDef("list_a_doc_number", "List A document number", required=False),
        FieldDef("list_a_expiration", "List A expiration date", field_type="date", required=False),
        FieldDef("list_b_document", "List B document title if used", required=False),
        FieldDef("list_b_issuing_authority", "List B issuing authority", required=False),
        FieldDef("list_b_doc_number", "List B document number", required=False),
        FieldDef("list_b_expiration", "List B expiration date", field_type="date", required=False),
        FieldDef("list_c_document", "List C document title if used", required=False),
        FieldDef("list_c_issuing_authority", "List C issuing authority", required=False),
        FieldDef("list_c_doc_number", "List C document number", required=False),
        FieldDef("list_c_expiration", "List C expiration date", field_type="date", required=False),
        FieldDef("employer_name", "Employer name in Section 2", canonical_key="employer.company_name"),
        FieldDef("employer_address", "Employer address in Section 2", canonical_key="employer.business_address"),
        FieldDef("first_day_employment", "First day of employment", field_type="date"),
        FieldDef("employer_signature_present", "Is employer signature present?", field_type="boolean"),
        FieldDef("employer_signature_date", "Employer signature date", field_type="date", required=False),
    ],
    FormType.W4: [
        FieldDef("first_name", "First name and middle initial", canonical_key="employee.first_name"),
        FieldDef("last_name", "Last name", canonical_key="employee.last_name"),
        FieldDef("address", "Address", canonical_key="employee.residence_address"),
        FieldDef("city_state_zip", "City, state, ZIP"),
        FieldDef("ssn", "Social security number", field_type="ssn", canonical_key="employee.ssn"),
        FieldDef("filing_status", "Single, Married filing jointly, or Head of household"),
        FieldDef("step3_dependents_amount", "Step 3 total dependents claim amount", field_type="currency", required=False),
        FieldDef("step4a_other_income", "Step 4a other income", field_type="currency", required=False),
        FieldDef("step4b_deductions", "Step 4b deductions", field_type="currency", required=False),
        FieldDef("step4c_extra_withholding", "Step 4c extra withholding per period", field_type="currency", required=False),
        FieldDef("employee_signature_present", "Is employee signature present?", field_type="boolean"),
        FieldDef("signature_date", "Date of signature", field_type="date"),
    ],
    FormType.HW4: [
        FieldDef("full_name", "Employee full name from Section A", canonical_key="employee.legal_name"),
        FieldDef("ssn", "Social security number", field_type="ssn", canonical_key="employee.ssn"),
        FieldDef("address", "Home address", canonical_key="employee.residence_address"),
        FieldDef("city_state_zip", "City, state, ZIP"),
        FieldDef("marital_status", "Single, Married, Married at higher single rate, Certified Disabled, Nonresident Military Spouse"),
        FieldDef("allowances", "Total number of allowances (line 4)", field_type="integer"),
        FieldDef("additional_amount", "Additional amount per pay period (line 5)", field_type="currency", required=False),
        FieldDef("employee_signature_present", "Is Section A signed?", field_type="boolean"),
        FieldDef("signature_date", "Date in Section A", field_type="date", required=False),
        FieldDef("employer_name", "Employer name from Section B", canonical_key="employer.company_name"),
        FieldDef("employer_address", "Employer address from Section B", canonical_key="employer.business_address"),
        FieldDef("hawaii_tax_id", "Hawaii tax identification number from Section B", required=False),
    ],
    FormType.HW4_WORKSHEET: [
        FieldDef("line_a", "Line A value", field_type="integer", required=False),
        FieldDef("line_b", "Line B value", field_type="integer", required=False),
        FieldDef("line_i_total", "Line I total allowances", field_type="integer", required=False),
    ],
    FormType.HC5: [
        FieldDef("employer_name", "Employer name", canonical_key="employer.company_name"),
        FieldDef("employer_address", "Employer address", canonical_key="employer.business_address"),
        FieldDef("selected_option", "Which main option (1-5) is checked: principal_employer, secondary_employer, exempt, waive_coverage, coverage_no_longer_applicable"),
        FieldDef("exempt_sub_option", "If option 3, which sub-option: federally_covered, dependent_covered, public_assistance, religious", required=False),
        FieldDef("employee_name", "Printed employee name", canonical_key="employee.legal_name"),
        FieldDef("employee_address", "Employee address", canonical_key="employee.residence_address"),
        FieldDef("employee_signature_present", "Is employee signature present?", field_type="boolean"),
        FieldDef("signature_date", "Date of employee signature", field_type="date", required=False),
    ],
    FormType.DIRECT_DEPOSIT: [
        FieldDef("company_name", "Company name", canonical_key="employer.company_name"),
        FieldDef("last_name", "Employee last name", canonical_key="employee.last_name"),
        FieldDef("first_name", "Employee first name", canonical_key="employee.first_name"),
        FieldDef("middle_initial", "Middle initial", required=False, canonical_key="employee.middle_initial"),
        FieldDef("bank1_routing", "Bank 1 routing/transit number", field_type="routing", required=False),
        FieldDef("bank1_account", "Bank 1 account number", field_type="account", required=False),
        FieldDef("bank1_type", "Bank 1 account type: Savings or Checking", required=False),
        FieldDef("bank1_deposit_type", "Full Check Amount or Portion", required=False),
        FieldDef("bank2_routing", "Bank 2 routing number", field_type="routing", required=False),
        FieldDef("bank2_account", "Bank 2 account number", field_type="account", required=False),
        FieldDef("pay_statement_preference", "Electronic or Paper Copies"),
        FieldDef("employee_signature_present", "Is employee signature present?", field_type="boolean"),
        FieldDef("signature_date", "Date of signature", field_type="date"),
    ],
    FormType.HANDBOOK_ACK: [
        FieldDef("company_name", "Printed company name", canonical_key="employer.company_name"),
        FieldDef("employee_name", "Printed employee name", canonical_key="employee.legal_name"),
        FieldDef("employee_signature_present", "Is employee signature present?", field_type="boolean"),
        FieldDef("signature_date", "Date of signature", field_type="date"),
    ],
}

def get_schema(form_type: FormType) -> list[FieldDef] | None:
    """Return field definitions for a form type, or None if extraction should be skipped."""
    if form_type in SKIP_EXTRACTION:
        return None
    return FORM_SCHEMAS.get(form_type)

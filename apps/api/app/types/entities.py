# apps/api/app/types/entities.py
from datetime import datetime
from enum import Enum
from typing import Any
from pydantic import BaseModel, Field as PydField


class CandidateState(str, Enum):
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    AWAITING_RESPONSE = "awaiting_response"
    READY = "ready"
    SUBMITTING = "submitting"
    COMMITTED = "committed"
    FAILED = "failed"


class FieldStatus(str, Enum):
    GREEN = "green"
    ORANGE = "orange"
    RED = "red"
    YELLOW = "yellow"


class FormType(str, Enum):
    COVER = "COVER"
    EMPLOYMENT_FORM = "EMPLOYMENT_FORM"
    EMPLOYMENT_AGREEMENT = "EMPLOYMENT_AGREEMENT"
    I9_SEC1 = "I9_SEC1"
    I9_SEC2 = "I9_SEC2"
    I9_LISTS = "I9_LISTS"
    I9_SUPP = "I9_SUPP"
    W4 = "W4"
    HW4 = "HW4"
    HW4_WORKSHEET = "HW4_WORKSHEET"
    MARKETPLACE_NOTICE = "MARKETPLACE_NOTICE"
    HC5 = "HC5"
    DIRECT_DEPOSIT = "DIRECT_DEPOSIT"
    HANDBOOK_ACK = "HANDBOOK_ACK"
    OTHER = "OTHER"


class BBox(BaseModel):
    x: float
    y: float
    w: float
    h: float
    page: int


class Field(BaseModel):
    name: str
    value: Any = None
    source_bbox: BBox | None = None
    confidence: float | None = None
    status: FieldStatus = FieldStatus.GREEN
    canonical_key: str | None = None
    raw_value: Any = None  # pre-normalization


class Form(BaseModel):
    id: str
    packet_id: str
    type: FormType
    page_range: list[int]
    extracted_fields: list[Field] = PydField(default_factory=list)
    validation_messages: list[str] = PydField(default_factory=list)
    confidence_summary: dict[str, int] = PydField(default_factory=dict)  # counts by status


class Packet(BaseModel):
    id: str
    candidate_id: str
    source_pdf_path: str
    page_image_paths: list[str] = PydField(default_factory=list)
    uploaded_at: datetime


class CanonicalEmployee(BaseModel):
    legal_name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    ssn: str | None = None
    dob: str | None = None
    residence_address: str | None = None
    phone: str | None = None
    email: str | None = None


class CanonicalEmployer(BaseModel):
    company_name: str | None = None
    business_address: str | None = None


class Candidate(BaseModel):
    id: str
    client_id: str
    canonical_employee: CanonicalEmployee = PydField(default_factory=CanonicalEmployee)
    canonical_employer: CanonicalEmployer = PydField(default_factory=CanonicalEmployer)
    state: CandidateState = CandidateState.DRAFT
    created_at: datetime
    updated_at: datetime


class Client(BaseModel):
    id: str
    name: str
    codes: dict[str, list[str]]  # pay_groups, benefit_groups, locations, job_codes
    pay_group_constant: str
    position_title_to_job_code: dict[str, str] = PydField(default_factory=dict)
    organization_level_to_location: dict[str, str] = PydField(default_factory=dict)
    status_to_employee_type: dict[str, str] = PydField(default_factory=dict)
    benefit_group_rules: list[dict[str, Any]] = PydField(default_factory=list)
    address: str | None = None


class AuditEntry(BaseModel):
    id: str
    candidate_id: str
    actor: str  # "ai:haiku", "ai:sonnet", "human:<user_id>", "system"
    action: str
    before: dict[str, Any] | None = None
    after: dict[str, Any] | None = None
    timestamp: datetime


class EmailDraftStatus(str, Enum):
    DRAFT = "draft"
    COPIED = "copied"
    AWAITING_RESPONSE = "awaiting_response"
    RESOLVED = "resolved"


class EmailDraft(BaseModel):
    id: str
    candidate_id: str
    to: list[str]
    cc: list[str] = PydField(default_factory=list)
    subject: str
    body: str
    attachments: list[str] = PydField(default_factory=list)
    status: EmailDraftStatus = EmailDraftStatus.DRAFT
    created_at: datetime


class PrismSubmissionStatus(str, Enum):
    QUEUED = "queued"
    SUBMITTING = "submitting"
    COMMITTED = "committed"
    FAILED = "failed"


class PrismSubmission(BaseModel):
    id: str
    candidate_id: str
    payloads: dict[str, dict[str, Any]]  # call_name -> payload
    attempts: int = 0
    status: PrismSubmissionStatus = PrismSubmissionStatus.QUEUED
    error: str | None = None
    created_at: datetime
    updated_at: datetime

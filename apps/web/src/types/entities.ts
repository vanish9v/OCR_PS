// apps/web/src/types/entities.ts
export type CandidateState =
  | "draft" | "under_review" | "awaiting_response" | "ready"
  | "submitting" | "committed" | "failed";

export type FieldStatus = "green" | "orange" | "red" | "yellow";

export type FormType =
  | "COVER" | "EMPLOYMENT_FORM" | "EMPLOYMENT_AGREEMENT"
  | "I9_SEC1" | "I9_SEC2" | "I9_LISTS" | "I9_SUPP"
  | "W4" | "HW4" | "HW4_WORKSHEET"
  | "MARKETPLACE_NOTICE" | "HC5"
  | "DIRECT_DEPOSIT" | "HANDBOOK_ACK" | "OTHER";

export interface BBox { x: number; y: number; w: number; h: number; page: number; }

export interface Field {
  name: string;
  value: unknown;
  source_bbox?: BBox | null;
  confidence?: number | null;
  status: FieldStatus;
  canonical_key?: string | null;
  raw_value?: unknown;
}

export interface Form {
  id: string;
  packet_id: string;
  type: FormType;
  page_range: number[];
  extracted_fields: Field[];
  validation_messages: string[];
  confidence_summary: Record<string, number>;
}

export interface Packet {
  id: string;
  candidate_id: string;
  source_pdf_path: string;
  page_image_paths: string[];
  uploaded_at: string;
}

export interface CanonicalEmployee {
  legal_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  ssn?: string | null;
  dob?: string | null;
  residence_address?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface CanonicalEmployer {
  company_name?: string | null;
  business_address?: string | null;
}

export interface Candidate {
  id: string;
  client_id: string;
  canonical_employee: CanonicalEmployee;
  canonical_employer: CanonicalEmployer;
  state: CandidateState;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  codes: Record<string, string[]>;
  pay_group_constant: string;
  position_title_to_job_code: Record<string, string>;
  organization_level_to_location: Record<string, string>;
  status_to_employee_type: Record<string, string>;
  benefit_group_rules: Array<Record<string, unknown>>;
  address?: string | null;
}

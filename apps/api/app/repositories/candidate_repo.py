# apps/api/app/repositories/candidate_repo.py
import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import CandidateRow
from app.types.entities import Candidate, CanonicalEmployee, CanonicalEmployer, CandidateState

def _to_row(c: Candidate) -> CandidateRow:
    return CandidateRow(
        id=c.id, client_id=c.client_id,
        canonical_employee_json=c.canonical_employee.model_dump_json(),
        canonical_employer_json=c.canonical_employer.model_dump_json(),
        state=c.state.value,
        created_at=c.created_at, updated_at=c.updated_at,
    )

def _from_row(row: CandidateRow) -> Candidate:
    return Candidate(
        id=row.id, client_id=row.client_id,
        canonical_employee=CanonicalEmployee.model_validate_json(row.canonical_employee_json or "{}"),
        canonical_employer=CanonicalEmployer.model_validate_json(row.canonical_employer_json or "{}"),
        state=CandidateState(row.state),
        created_at=row.created_at, updated_at=row.updated_at,
    )

def create_candidate(session: Session, c: Candidate) -> Candidate:
    session.add(_to_row(c))
    session.commit()
    return c

def get_candidate(session: Session, cid: str) -> Candidate | None:
    row = session.get(CandidateRow, cid)
    return _from_row(row) if row else None

def list_candidates(session: Session) -> list[Candidate]:
    return [_from_row(r) for r in session.query(CandidateRow).all()]

def update_candidate_state(session: Session, cid: str, new_state: str) -> Candidate | None:
    row = session.get(CandidateRow, cid)
    if row is None:
        return None
    row.state = new_state
    row.updated_at = datetime.utcnow()
    session.commit()
    return _from_row(row)

def save_analyze_bundle(session: Session, cid: str, bundle_json: str) -> None:
    row = session.get(CandidateRow, cid)
    if row:
        row.analyze_bundle_json = bundle_json
        row.state = "under_review"  # auto-transition from draft
        row.updated_at = datetime.utcnow()
        session.commit()

def update_candidate_canonical(session: Session, cid: str, canonical_employee: dict) -> None:
    row = session.get(CandidateRow, cid)
    if row:
        row.canonical_employee_json = json.dumps(canonical_employee)
        row.updated_at = datetime.utcnow()
        session.commit()

def get_candidate_with_bundle(session: Session, cid: str) -> dict | None:
    row = session.get(CandidateRow, cid)
    if row is None:
        return None
    result = _from_row(row).model_dump(mode="json")
    if row.analyze_bundle_json:
        result["analyze_bundle"] = json.loads(row.analyze_bundle_json)
    return result

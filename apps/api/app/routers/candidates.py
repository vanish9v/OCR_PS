# apps/api/app/routers/candidates.py
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_session
from app.repositories.candidate_repo import get_candidate, list_candidates, update_candidate_state, save_analyze_bundle, get_candidate_with_bundle, update_candidate_canonical
from app.repositories.client_repo import get_client
from app.repositories.packet_repo import list_packets_for_candidate
from app.services.analyze import run_analyze
from app.services.email_drafter import draft_clarification_email

router = APIRouter(prefix="/candidates", tags=["candidates"])

@router.get("")
def list_all_candidates(session: Session = Depends(get_session)) -> list[dict]:
    candidates = list_candidates(session)
    return [c.model_dump(mode="json") for c in candidates]

@router.get("/{candidate_id}")
def get_single_candidate(candidate_id: str, session: Session = Depends(get_session)) -> dict:
    data = get_candidate_with_bundle(session, candidate_id)
    if data is None:
        raise HTTPException(404, f"candidate {candidate_id} not found")
    packets = list_packets_for_candidate(session, candidate_id)
    data["packets"] = [p.model_dump(mode="json") for p in packets]
    return data

@router.patch("/{candidate_id}")
def update_candidate(candidate_id: str, body: dict, session: Session = Depends(get_session)) -> dict:
    new_state = body.get("state")
    if not new_state:
        raise HTTPException(400, "state is required")
    c = update_candidate_state(session, candidate_id, new_state)
    if c is None:
        raise HTTPException(404, f"candidate {candidate_id} not found")
    return c.model_dump(mode="json")

@router.post("/{candidate_id}/analyze")
def analyze_candidate(candidate_id: str, session: Session = Depends(get_session)) -> dict:
    candidate = get_candidate(session, candidate_id)
    if candidate is None:
        raise HTTPException(404, f"candidate {candidate_id} not found")

    client = get_client(session, candidate.client_id)
    if client is None:
        raise HTTPException(404, f"client {candidate.client_id} not found")

    packets = list_packets_for_candidate(session, candidate_id)
    if not packets:
        raise HTTPException(400, "no packets uploaded for this candidate")

    # Use the latest packet's rendered pages
    latest = packets[-1]
    if not latest.page_image_paths:
        raise HTTPException(400, "packet has no rendered pages — upload may have failed")

    bundle = run_analyze(latest.page_image_paths, client)
    bundle["candidate_id"] = candidate_id
    bundle["packet_id"] = latest.id

    # Persist bundle to DB
    save_analyze_bundle(session, candidate_id, json.dumps(bundle))

    # Extract candidate name from bundle and persist to canonical_employee
    first = ""
    last = ""
    recon = bundle.get("reconciliation", {})
    if "employee.first_name" in recon:
        first = recon["employee.first_name"].get("chosen", "") or ""
    if "employee.last_name" in recon:
        last = recon["employee.last_name"].get("chosen", "") or ""
    if not first and not last:
        # Fallback: scan forms for first extracted name fields
        for form in bundle.get("forms", []):
            for field in form.get("extracted_fields", []):
                if field.get("canonical_key") == "employee.first_name" and field.get("value") and not first:
                    first = field["value"]
                if field.get("canonical_key") == "employee.last_name" and field.get("value") and not last:
                    last = field["value"]

    full_name = f"{first} {last}".strip()
    if full_name:
        update_candidate_canonical(session, candidate_id, {
            "legal_name": full_name,
            "first_name": first,
            "last_name": last,
        })

    return bundle


@router.put("/{candidate_id}/bundle")
def update_bundle(candidate_id: str, bundle: dict, session: Session = Depends(get_session)):
    save_analyze_bundle(session, candidate_id, json.dumps(bundle))
    return {"status": "saved"}


@router.post("/{candidate_id}/draft-email")
def draft_email(candidate_id: str, body: dict, session: Session = Depends(get_session)) -> dict:
    candidate = get_candidate(session, candidate_id)
    if candidate is None:
        raise HTTPException(404, f"candidate {candidate_id} not found")
    client = get_client(session, candidate.client_id)
    if client is None:
        raise HTTPException(404, "client not found")

    return draft_clarification_email(
        candidate_name=body.get("candidate_name", candidate_id),
        client_name=client.name if client else "Unknown",
        issues=body.get("issues", []),
    )


@router.get("/{candidate_id}/prism-preview")
def prism_preview(candidate_id: str, session: Session = Depends(get_session)):
    from app.models import CandidateRow
    row = session.get(CandidateRow, candidate_id)
    if not row:
        raise HTTPException(404)
    if not row.analyze_bundle_json:
        raise HTTPException(400, "no analyze bundle")
    from app.services.prism_payload import build_prism_payloads
    bundle = json.loads(row.analyze_bundle_json)
    return build_prism_payloads(bundle, row.client_id)

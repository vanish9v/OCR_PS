import os
import uuid
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_session
from app.storage.local_storage import LocalStorage
from app.services.preprocess import split_and_render
from app.repositories.client_repo import get_client
from app.repositories.candidate_repo import create_candidate
from app.repositories.packet_repo import create_packet, update_packet_pages
from app.types.entities import Candidate, Packet

router = APIRouter(prefix="/packets", tags=["packets"])

def _storage() -> LocalStorage:
    return LocalStorage(base=Path(os.getenv("DATA_DIR", "./data")))

@router.post("", status_code=201)
async def upload_packet(
    file: UploadFile = File(...),
    client_id: str = Form(...),
    candidate_id: str | None = Form(None),
    session: Session = Depends(get_session),
) -> dict:
    if get_client(session, client_id) is None:
        raise HTTPException(404, f"client {client_id} not found")

    content = await file.read()
    if not content.startswith(b"%PDF"):
        raise HTTPException(400, "file is not a PDF")

    now = datetime.utcnow()
    if candidate_id is None:
        candidate_id = f"cand_{uuid.uuid4().hex[:8]}"
        create_candidate(session, Candidate(
            id=candidate_id, client_id=client_id,
            created_at=now, updated_at=now,
        ))

    packet_id = f"pkt_{uuid.uuid4().hex[:8]}"
    storage = _storage()
    pdf_path = storage.save_pdf(packet_id, content)
    create_packet(session, Packet(
        id=packet_id, candidate_id=candidate_id,
        source_pdf_path=str(pdf_path), uploaded_at=now,
    ))

    pages = split_and_render(storage, packet_id, dpi=200)
    update_packet_pages(session, packet_id, [str(p) for p in pages])

    return {
        "candidate_id": candidate_id,
        "packet_id": packet_id,
        "page_count": len(pages),
        "page_paths": [str(p) for p in pages],
    }

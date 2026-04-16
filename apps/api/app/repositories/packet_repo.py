# apps/api/app/repositories/packet_repo.py
import json
from sqlalchemy.orm import Session
from app.models import PacketRow
from app.types.entities import Packet

def _from_row(row: PacketRow) -> Packet:
    return Packet(
        id=row.id, candidate_id=row.candidate_id,
        source_pdf_path=row.source_pdf_path,
        page_image_paths=json.loads(row.page_image_paths_json or "[]"),
        uploaded_at=row.uploaded_at,
    )

def create_packet(session: Session, p: Packet) -> Packet:
    session.add(PacketRow(
        id=p.id, candidate_id=p.candidate_id,
        source_pdf_path=p.source_pdf_path,
        page_image_paths_json=json.dumps(p.page_image_paths),
        uploaded_at=p.uploaded_at,
    ))
    session.commit()
    return p

def update_packet_pages(session: Session, packet_id: str, page_image_paths: list[str]) -> None:
    row = session.get(PacketRow, packet_id)
    if row is None:
        raise ValueError(f"packet not found: {packet_id}")
    row.page_image_paths_json = json.dumps(page_image_paths)
    session.commit()

def list_packets_for_candidate(session: Session, candidate_id: str) -> list[Packet]:
    rows = session.query(PacketRow).filter_by(candidate_id=candidate_id).all()
    return [_from_row(r) for r in rows]

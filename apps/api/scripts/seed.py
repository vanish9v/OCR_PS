import json
import os
from pathlib import Path
from sqlalchemy.orm import Session
from app.types.entities import Client
from app.repositories.client_repo import upsert_client

def seed_client_from_file(session: Session, path: str) -> None:
    p = Path(path)
    if not p.exists():
        # In Docker, DATA_DIR=/data — resolve from there
        data_dir = os.getenv("DATA_DIR")
        if data_dir:
            p = Path(data_dir) / "clients" / Path(path).name
    if not p.exists():
        # Dev fallback: walk up from this script to find repo root
        try:
            p = Path(__file__).resolve().parents[3] / path
        except IndexError:
            pass
    if not p.exists():
        raise FileNotFoundError(f"Client config not found: {path}")
    data = json.loads(p.read_text())
    upsert_client(session, Client(**data))

def seed_all(session: Session) -> None:
    seed_client_from_file(session, "data/clients/15650.json")

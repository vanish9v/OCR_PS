# apps/api/app/routers/clients.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_session
from app.repositories.client_repo import get_client, list_clients

router = APIRouter(prefix="/clients", tags=["clients"])

@router.get("")
def list_all_clients(session: Session = Depends(get_session)) -> list[dict]:
    clients = list_clients(session)
    return [c.model_dump(mode="json") for c in clients]

@router.get("/{client_id}")
def get_single_client(client_id: str, session: Session = Depends(get_session)) -> dict:
    c = get_client(session, client_id)
    if c is None:
        raise HTTPException(404, f"client {client_id} not found")
    return c.model_dump(mode="json")

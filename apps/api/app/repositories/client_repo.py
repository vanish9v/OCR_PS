# apps/api/app/repositories/client_repo.py
import json
from sqlalchemy.orm import Session
from app.models import ClientRow
from app.types.entities import Client

def upsert_client(session: Session, client: Client) -> Client:
    row = session.get(ClientRow, client.id)
    data = {
        "id": client.id,
        "name": client.name,
        "codes_json": json.dumps(client.codes),
        "pay_group_constant": client.pay_group_constant,
        "mappings_json": json.dumps({
            "position_title_to_job_code": client.position_title_to_job_code,
            "organization_level_to_location": client.organization_level_to_location,
            "status_to_employee_type": client.status_to_employee_type,
        }),
        "benefit_group_rules_json": json.dumps(client.benefit_group_rules),
        "address": client.address,
    }
    if row is None:
        row = ClientRow(**data)
        session.add(row)
    else:
        for k, v in data.items():
            setattr(row, k, v)
    session.commit()
    return client

def _row_to_client(row: ClientRow) -> Client:
    mappings = json.loads(row.mappings_json)
    return Client(
        id=row.id, name=row.name,
        codes=json.loads(row.codes_json),
        pay_group_constant=row.pay_group_constant,
        position_title_to_job_code=mappings.get("position_title_to_job_code", {}),
        organization_level_to_location=mappings.get("organization_level_to_location", {}),
        status_to_employee_type=mappings.get("status_to_employee_type", {}),
        benefit_group_rules=json.loads(row.benefit_group_rules_json),
        address=row.address,
    )

def get_client(session: Session, client_id: str) -> Client | None:
    row = session.get(ClientRow, client_id)
    if row is None:
        return None
    return _row_to_client(row)

def list_clients(session: Session) -> list[Client]:
    rows = session.query(ClientRow).all()
    return [_row_to_client(row) for row in rows]

# apps/api/app/routers/pages.py
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/pages", tags=["pages"])

@router.get("/{packet_id}/{page_num}")
def get_page_image(packet_id: str, page_num: int) -> FileResponse:
    data_dir = Path(os.getenv("DATA_DIR", "./data"))
    image_path = data_dir / "processed" / packet_id / f"page_{page_num}.png"
    if not image_path.exists():
        raise HTTPException(404, f"page image not found: {packet_id}/page_{page_num}")
    return FileResponse(image_path, media_type="image/png")

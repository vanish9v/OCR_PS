from pathlib import Path
import fitz  # PyMuPDF
from app.storage.local_storage import LocalStorage


def split_and_render(storage: LocalStorage, packet_id: str, dpi: int = 300) -> list[Path]:
    pdf_path = storage.path_for_pdf(packet_id)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found for packet {packet_id}")
    doc = fitz.open(pdf_path)
    rendered: list[Path] = []
    try:
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        for i, page in enumerate(doc, start=1):
            pix = page.get_pixmap(matrix=mat, alpha=False)
            png_bytes = pix.tobytes("png")
            dest = storage.save_page_image(packet_id, i, png_bytes)
            rendered.append(dest)
    finally:
        doc.close()
    return rendered

from pathlib import Path

class LocalStorage:
    def __init__(self, base: Path):
        self.base = Path(base)
        (self.base / "uploads").mkdir(parents=True, exist_ok=True)
        (self.base / "processed").mkdir(parents=True, exist_ok=True)

    def path_for_pdf(self, packet_id: str) -> Path:
        return self.base / "uploads" / f"{packet_id}.pdf"

    def path_for_page_image(self, packet_id: str, page_num: int) -> Path:
        return self.base / "processed" / packet_id / f"page_{page_num}.png"

    def save_pdf(self, packet_id: str, content: bytes) -> Path:
        dest = self.path_for_pdf(packet_id)
        dest.write_bytes(content)
        return dest

    def save_page_image(self, packet_id: str, page_num: int, content: bytes) -> Path:
        dest = self.path_for_page_image(packet_id, page_num)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(content)
        return dest

    def list_page_images(self, packet_id: str) -> list[Path]:
        d = self.base / "processed" / packet_id
        if not d.exists():
            return []
        return sorted(d.glob("page_*.png"), key=lambda p: int(p.stem.split("_")[-1]))

# apps/api/app/services/anthropic_client.py
import base64
import os
from pathlib import Path
from anthropic import Anthropic

_client: Anthropic | None = None

def get_client() -> Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("CLAUDE_API_KEY") or os.getenv("claude_api")
        if not api_key:
            raise RuntimeError("CLAUDE_API_KEY or claude_api env var required")
        _client = Anthropic(api_key=api_key)
    return _client

HAIKU = "claude-haiku-4-5-20251001"
SONNET = "claude-sonnet-4-6"

def encode_image(path: str | Path) -> tuple[str, str]:
    """Return (base64_data, media_type) for a PNG file."""
    raw = Path(path).read_bytes()
    return base64.standard_b64encode(raw).decode(), "image/png"

def classify_image(image_path: str | Path, system: str, prompt: str) -> str:
    """Send a single image to Haiku with a text prompt, return text response."""
    b64, media = encode_image(image_path)
    resp = get_client().messages.create(
        model=HAIKU,
        max_tokens=100,
        system=system,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media, "data": b64}},
                {"type": "text", "text": prompt},
            ],
        }],
    )
    return resp.content[0].text.strip()

def generate_text(system: str, prompt: str, model: str = SONNET) -> str:
    """Text-only Claude call (no image). Used for email drafting."""
    resp = get_client().messages.create(
        model=model,
        max_tokens=2048,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.content[0].text.strip()

def extract_from_image(image_path: str | Path, system: str, prompt: str) -> str:
    """Send a single image to Sonnet with a text prompt, return text response."""
    b64, media = encode_image(image_path)
    resp = get_client().messages.create(
        model=SONNET,
        max_tokens=4096,
        system=system,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media, "data": b64}},
                {"type": "text", "text": prompt},
            ],
        }],
    )
    return resp.content[0].text.strip()

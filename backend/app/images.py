import hashlib
import io

from PIL import Image, ImageOps

from .config import settings


def prepare(raw: bytes) -> bytes:
    """Downscale and re-encode as JPEG. Smaller images mean fewer vision tokens."""
    image = Image.open(io.BytesIO(raw))
    image = ImageOps.exif_transpose(image).convert("RGB")
    image.thumbnail((settings.max_image_edge, settings.max_image_edge))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=80, optimize=True)
    return buffer.getvalue()


def fingerprint(image_bytes: bytes) -> str:
    return hashlib.sha256(image_bytes).hexdigest()[:32]


def store(image_bytes: bytes, digest: str) -> str:
    """Persist the photo and return the URL path the app can fetch it from."""
    settings.media_dir.mkdir(parents=True, exist_ok=True)
    path = settings.media_dir / f"{digest}.jpg"
    if not path.exists():
        path.write_bytes(image_bytes)
    return f"/media/{digest}.jpg"

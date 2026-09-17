import hashlib
import io

import zxingcpp
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


_PRODUCT_FORMATS = (
    zxingcpp.BarcodeFormat.EAN13
    | zxingcpp.BarcodeFormat.EAN8
    | zxingcpp.BarcodeFormat.UPCA
    | zxingcpp.BarcodeFormat.UPCE
    | zxingcpp.BarcodeFormat.Code128
)


def read_barcode(raw: bytes) -> str | None:
    """Decode a product barcode from the original photo, before any vision model runs."""
    try:
        image = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
        results = zxingcpp.read_barcodes(image, formats=_PRODUCT_FORMATS)
    except Exception:  # noqa: BLE001 - a failed decode must not break analysis
        return None
    for result in results:
        if result.valid and result.text:
            return result.text
    return None


def fingerprint(image_bytes: bytes) -> str:
    return hashlib.sha256(image_bytes).hexdigest()[:32]


def store(image_bytes: bytes, digest: str) -> str:
    """Persist the photo and return the URL path the app can fetch it from."""
    settings.media_dir.mkdir(parents=True, exist_ok=True)
    path = settings.media_dir / f"{digest}.jpg"
    if not path.exists():
        path.write_bytes(image_bytes)
    return f"/media/{digest}.jpg"

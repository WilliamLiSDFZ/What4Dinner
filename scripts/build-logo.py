"""Derive the app's logo assets from public/logo.png.

The source logo is a 1254x1254 RGB PNG with no alpha: the mark sits on a
near-white background (253-255, with compression noise) and fills only ~54% of
the frame. This script keys out that background, trims the padding, and emits
the sizes the app actually uses. Re-run it if public/logo.png is replaced.

    python3 scripts/build-logo.py
"""

from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "logo.png"

# The background is not flat white but compression noise 253-255, i.e. 0-2 away
# from white. Anything within DEADZONE of white is forced fully transparent;
# past that, alpha ramps to opaque over FEATHER so genuinely anti-aliased edge
# pixels keep a soft edge. The mark itself is far outside both (orange 225 from
# white, charcoal 204), so it stays fully opaque.
DEADZONE = 8
FEATHER = 24

# Breathing room added around the trimmed mark, as a fraction of its long edge.
MARGIN = 0.04

# Opaque background for the iOS icon, matching --code-bg in src/index.css.
IOS_BG = (245, 235, 224, 255)
IOS_INSET = 0.12


def keyed_mark(path):
    """Load the logo, key the near-white background to transparent, and trim."""
    with Image.open(path) as src:
        rgb = src.convert("RGB")

    # Per-pixel minimum channel, i.e. distance from white using whichever
    # channel is furthest from it. The mark's colours are far from white in at
    # least one channel (orange 30, charcoal 51); the background is 253-255 in
    # all three. Keying on this rather than luminance leaves the colours alone,
    # so the orange keeps its saturation.
    r, g, b = rgb.split()
    darkest = ImageChops.darker(ImageChops.darker(r, g), b)
    alpha = darkest.point(
        lambda v: max(0, min(255, round((255 - v - DEADZONE) * 255 / FEATHER)))
    )

    keyed = rgb.convert("RGBA")
    keyed.putalpha(alpha)

    bbox = alpha.getbbox()
    if bbox is None:
        raise SystemExit(f"{path} appears to be blank after keying")
    return keyed.crop(bbox)


def square(mark, margin=MARGIN, background=(0, 0, 0, 0)):
    """Centre the mark on a transparent square with a little breathing room."""
    side = round(max(mark.size) * (1 + 2 * margin))
    canvas = Image.new("RGBA", (side, side), background)
    canvas.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2), mark)
    return canvas


def write(image, size, dest, background=None):
    """Resize to `size` square and save, optionally flattening onto a colour."""
    out = image.resize((size, size), Image.LANCZOS)
    if background is not None:
        flat = Image.new("RGBA", out.size, background)
        flat.alpha_composite(out)
        out = flat
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, optimize=True)
    print(f"{dest.relative_to(ROOT)}  {size}x{size}  {dest.stat().st_size / 1024:.1f} KB")


def main():
    if not SOURCE.exists():
        raise SystemExit(f"missing source logo: {SOURCE}")

    mark = keyed_mark(SOURCE)
    print(f"trimmed mark: {mark.width}x{mark.height} (from 1254x1254)")

    tile = square(mark)
    # Sidebar mark: lives in src/assets so Vite content-hashes it.
    write(tile, 128, ROOT / "src" / "assets" / "logo-mark.png")
    # Browser tab.
    write(tile, 32, ROOT / "public" / "favicon-32.png")
    # iOS composites transparent icons onto black, so this one gets a background.
    write(
        square(mark, margin=IOS_INSET),
        180,
        ROOT / "public" / "apple-touch-icon.png",
        background=IOS_BG,
    )


if __name__ == "__main__":
    main()

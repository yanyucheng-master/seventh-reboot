"""Compose the UNKNOWN-06 residual-signal image from the approved Nova portrait."""

from __future__ import annotations

import argparse
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps


SIZE = 1254
BACKGROUND = (1, 5, 13, 255)
CYAN = (86, 178, 220)
ICE = (205, 226, 236)
MUTED = (93, 137, 160)
MAGENTA = (202, 72, 126)


def load_font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont:
    windows_fonts = Path("C:/Windows/Fonts")
    candidates = [windows_fonts / ("consolab.ttf" if bold else "consola.ttf")]
    candidates.append(Path("DejaVuSans-Bold.ttf") if bold else Path("DejaVuSans.ttf"))
    for candidate in candidates:
        try:
            return ImageFont.truetype(str(candidate), size=size)
        except OSError:
            continue
    raise RuntimeError("No suitable TrueType font was found")


def channel_shift(image: Image.Image) -> Image.Image:
    red, green, blue = image.convert("RGB").split()
    red = ImageChops.offset(red, 7, 0)
    blue = ImageChops.offset(blue, -7, 0)
    return Image.merge("RGB", (red, green, blue)).convert("RGBA")


def apply_signal_slices(image: Image.Image) -> Image.Image:
    rng = random.Random(706)
    result = image.copy()
    for _ in range(24):
        height = rng.randint(3, 20)
        top = rng.randint(90, SIZE - 110 - height)
        shift = rng.choice((-34, -24, -16, 14, 22, 30))
        strip = image.crop((70, top, SIZE - 70, top + height))
        result.paste(strip, (70 + shift, top))
    return result


def compose(portrait_path: Path, output_path: Path) -> None:
    with Image.open(portrait_path) as source:
        portrait = ImageOps.fit(
            source.convert("RGB"),
            (SIZE, SIZE),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.34),
        )
        portrait = ImageEnhance.Color(portrait).enhance(0.60)
        portrait = ImageEnhance.Contrast(portrait).enhance(1.18)
        portrait = ImageEnhance.Brightness(portrait).enhance(0.68)
        portrait = channel_shift(portrait)
        portrait = apply_signal_slices(portrait)

        circle_mask = Image.new("L", (SIZE, SIZE), 0)
        mask_draw = ImageDraw.Draw(circle_mask)
        mask_draw.ellipse((42, 42, SIZE - 42, SIZE - 42), fill=255)
        circle_mask = circle_mask.filter(ImageFilter.GaussianBlur(1.2))

        canvas = Image.new("RGBA", (SIZE, SIZE), BACKGROUND)
        canvas.paste(portrait, (0, 0), circle_mask)

        overlay = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay, "RGBA")
        draw.ellipse((42, 42, SIZE - 42, SIZE - 42), outline=(*CYAN, 108), width=2)
        draw.ellipse((80, 80, SIZE - 80, SIZE - 80), outline=(*MUTED, 60), width=1)

        for y in range(0, SIZE, 4):
            draw.line((42, y, SIZE - 42, y), fill=(195, 224, 237, 13), width=1)

        rng = random.Random(1206)
        for _ in range(120):
            y = rng.randint(55, SIZE - 55)
            x = rng.randint(55, SIZE - 170)
            width = rng.randint(8, 110)
            color = CYAN if rng.random() > 0.28 else MAGENTA
            draw.rectangle((x, y, x + width, y + rng.randint(1, 3)), fill=(*color, rng.randint(45, 120)))

        panel_fill = (2, 10, 22, 218)
        panel_line = (*CYAN, 160)
        draw.rounded_rectangle((54, 470, 344, 770), radius=8, fill=panel_fill, outline=panel_line, width=2)
        draw.rounded_rectangle((850, 772, 1200, 1104), radius=8, fill=panel_fill, outline=panel_line, width=2)

        title_font = load_font(36, bold=True)
        label_font = load_font(22, bold=True)
        value_font = load_font(31, bold=True)

        draw.text((78, 500), "UNKNOWN-06", font=title_font, fill=ICE)
        draw.text((78, 576), "RESIDUAL SIGNAL", font=label_font, fill=CYAN)
        draw.line((78, 620, 316, 620), fill=panel_line, width=1)
        draw.text((78, 652), "LINK UNSTABLE", font=value_font, fill=ICE)

        draw.text((878, 810), "MEMORY INDEX", font=label_font, fill=CYAN)
        draw.text((878, 852), "/ PARTIAL", font=value_font, fill=ICE)
        draw.line((878, 906, 1170, 906), fill=panel_line, width=1)
        draw.text((878, 948), "CYCLE 06", font=value_font, fill=ICE)

        canvas.alpha_composite(overlay)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        canvas.convert("RGB").save(output_path, "PNG", optimize=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--portrait", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    compose(args.portrait, args.out)
    print(f"UNKNOWN-06 residual image written to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

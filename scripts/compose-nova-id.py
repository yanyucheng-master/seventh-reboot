"""Compose the production Nova personnel card from approved raster inputs."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


CANVAS = 1254
NAVY_TOP = (3, 11, 24)
NAVY_BOTTOM = (8, 23, 40)
ICE = (225, 235, 242)
MUTED = (132, 159, 178)
LINE = (58, 91, 113)
AMBER = (222, 169, 73)


def load_font(size: int, *, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    windows_fonts = Path("C:/Windows/Fonts")
    candidates = (
        [windows_fonts / ("consolab.ttf" if bold else "consola.ttf")]
        if mono
        else [windows_fonts / ("segoeuib.ttf" if bold else "segoeui.ttf")]
    )
    candidates.extend(
        [Path("DejaVuSans-Bold.ttf") if bold else Path("DejaVuSans.ttf")]
    )
    for candidate in candidates:
        try:
            return ImageFont.truetype(str(candidate), size=size)
        except OSError:
            continue
    raise RuntimeError("No suitable TrueType font was found")


def gradient_background() -> Image.Image:
    image = Image.new("RGB", (CANVAS, CANVAS), NAVY_TOP)
    draw = ImageDraw.Draw(image)
    for y in range(CANVAS):
        t = y / (CANVAS - 1)
        color = tuple(round(a + (b - a) * t) for a, b in zip(NAVY_TOP, NAVY_BOTTOM))
        draw.line((0, y, CANVAS, y), fill=color)
    return image.convert("RGBA")


def circular_badge(source: Image.Image, size: int) -> Image.Image:
    badge = ImageOps.fit(source.convert("RGBA"), (size, size), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    inset = max(2, round(size * 0.018))
    draw.ellipse((inset, inset, size - inset, size - inset), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(max(0.6, size * 0.006)))
    badge.putalpha(mask)
    return badge


def draw_navigation_texture(draw: ImageDraw.ImageDraw) -> None:
    center = (330, 670)
    for radius, alpha in ((360, 44), (300, 34), (240, 26), (180, 20)):
        box = (
            center[0] - radius,
            center[1] - radius,
            center[0] + radius,
            center[1] + radius,
        )
        draw.arc(box, 202, 338, fill=(88, 137, 165, alpha), width=2)
    for y in range(36, CANVAS, 8):
        draw.line((0, y, CANVAS, y), fill=(190, 220, 235, 5), width=1)


def compose(portrait_path: Path, badge_path: Path, output_path: Path) -> None:
    with Image.open(portrait_path) as source_portrait, Image.open(badge_path) as source_badge:
        canvas = gradient_background()
        overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay, "RGBA")

        draw_navigation_texture(draw)
        draw.rounded_rectangle((44, 42, 1210, 1212), radius=26, outline=(*LINE, 185), width=2)
        draw.line((70, 174, 1184, 174), fill=(*LINE, 205), width=2)
        draw.line((608, 220, 608, 1140), fill=(*LINE, 160), width=2)
        draw.rectangle((70, 1128, 1184, 1134), fill=(*AMBER, 180))

        portrait_box = (74, 220, 566, 1094)
        portrait_size = (portrait_box[2] - portrait_box[0], portrait_box[3] - portrait_box[1])
        portrait = ImageOps.fit(
            source_portrait.convert("RGBA"),
            portrait_size,
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.34),
        )
        portrait_mask = Image.new("L", portrait_size, 0)
        ImageDraw.Draw(portrait_mask).rounded_rectangle(
            (0, 0, portrait_size[0] - 1, portrait_size[1] - 1), radius=20, fill=255
        )
        canvas.alpha_composite(overlay)
        canvas.paste(portrait, portrait_box[:2], portrait_mask)

        finish = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        finish_draw = ImageDraw.Draw(finish, "RGBA")
        finish_draw.rounded_rectangle(portrait_box, radius=20, outline=(*ICE, 120), width=2)

        badge = circular_badge(source_badge, 126)
        finish.alpha_composite(badge, (1044, 46))

        header_font = load_font(30, bold=True)
        subhead_font = load_font(19, bold=True, mono=True)
        name_font = load_font(62, bold=True)
        field_font = load_font(25, bold=True, mono=True)

        finish_draw.text((74, 68), "AURORA NAVIGATION SYSTEM", font=header_font, fill=ICE)
        finish_draw.text((76, 122), "PERSONNEL FILE", font=subhead_font, fill=AMBER)
        finish_draw.text((650, 238), "NOVA ARLEN", font=name_font, fill=ICE)
        finish_draw.line((650, 328, 1166, 328), fill=(*LINE, 220), width=2)

        fields = (
            ("AGE 20", ICE),
            ("POSITION  NAVIGATOR", ICE),
            ("STATUS  CONFIRMED", ICE),
            ("OBSERVER LINK  ACTIVE", ICE),
            ("SEVENTH PROTOCOL  RESTRICTED", AMBER),
        )
        y = 390
        for text, color in fields:
            finish_draw.text((650, y), text, font=field_font, fill=color)
            finish_draw.line((650, y + 50, 1166, y + 50), fill=(*LINE, 105), width=1)
            y += 128

        canvas.alpha_composite(finish)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        canvas.convert("RGB").save(output_path, "PNG", optimize=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--portrait", type=Path, required=True)
    parser.add_argument("--badge", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    compose(args.portrait, args.badge, args.out)
    print(f"Nova personnel card written to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

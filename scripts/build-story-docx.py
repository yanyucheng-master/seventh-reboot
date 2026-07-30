from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "app" / "第七次重启-剧情文本.txt"
OUTPUT = ROOT / "第七次重启_V1.0_无后记主流程_运行时导出版.docx"

FONT_CJK = "Microsoft YaHei"
FONT_MONO = "Consolas"
INK = RGBColor(31, 39, 51)
MUTED = RGBColor(102, 116, 132)
TEAL = RGBColor(26, 129, 132)
GOLD = RGBColor(166, 111, 28)
RULE = "B8C6D1"


def set_run_font(run, font_name: str, size: float, color: RGBColor | None = None, bold: bool = False):
    run.font.name = font_name
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), font_name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), font_name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), font_name)
    run.font.size = Pt(size)
    run.font.bold = bold
    if color is not None:
        run.font.color.rgb = color


def shade_paragraph(paragraph, fill: str):
    p_pr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    p_pr.append(shd)


def add_bottom_border(paragraph, color: str = RULE, size: str = "8"):
    p_pr = paragraph._p.get_or_add_pPr()
    borders = p_pr.find(qn("w:pBdr"))
    if borders is None:
        borders = OxmlElement("w:pBdr")
        p_pr.append(borders)
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), size)
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), color)
    borders.append(bottom)


def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run("PAGE ")
    set_run_font(run, FONT_MONO, 8, MUTED)
    fld_char_1 = OxmlElement("w:fldChar")
    fld_char_1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = " PAGE "
    fld_char_2 = OxmlElement("w:fldChar")
    fld_char_2.set(qn("w:fldCharType"), "end")
    run._r.append(fld_char_1)
    run._r.append(instr_text)
    run._r.append(fld_char_2)


def configure_section(section):
    section.top_margin = Cm(1.45)
    section.bottom_margin = Cm(1.35)
    section.left_margin = Cm(1.65)
    section.right_margin = Cm(1.65)
    section.header_distance = Cm(0.55)
    section.footer_distance = Cm(0.55)

    header = section.header
    header.is_linked_to_previous = False
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    hr = hp.add_run("SEVENTH REBOOT  /  剧情审校稿  /  V1.0")
    set_run_font(hr, FONT_MONO, 7.8, TEAL, True)
    add_bottom_border(hp, "78A9AB", "6")

    footer = section.footer
    footer.is_linked_to_previous = False
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    fr = fp.add_run("SEVENTH REBOOT  /  V1.0")
    set_run_font(fr, FONT_MONO, 7.5, MUTED)


def setup_styles(doc: Document):
    normal = doc.styles["Normal"]
    normal.font.name = FONT_CJK
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_CJK)
    normal.font.size = Pt(9.2)
    normal.font.color.rgb = INK
    normal.paragraph_format.space_after = Pt(1.6)
    normal.paragraph_format.line_spacing = 1.08

    for style_name, size, color in [
        ("Heading 1", 16, TEAL),
        ("Heading 2", 12, TEAL),
        ("Heading 3", 10.5, GOLD),
    ]:
        style = doc.styles[style_name]
        style.font.name = FONT_CJK
        style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_CJK)
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = color
        style.paragraph_format.keep_with_next = True
        style.paragraph_format.space_before = Pt(7)
        style.paragraph_format.space_after = Pt(3)


def add_cover(doc: Document, header_lines: list[str]):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(70)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("第七次重启")
    set_run_font(r, FONT_CJK, 30, INK, True)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("无后记主流程  ·  规范化 ID 运行时导出版")
    set_run_font(r, FONT_CJK, 13, TEAL, True)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(18)
    r = p.add_run("V1.0  /  2063 RUNTIME NODES  /  EDITABLE REVIEW COPY")
    set_run_font(r, FONT_MONO, 9, GOLD, True)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(42)
    p.paragraph_format.left_indent = Cm(2.1)
    p.paragraph_format.right_indent = Cm(2.1)
    shade_paragraph(p, "EEF4F4")
    for index, line in enumerate(header_lines):
        if not line or line.startswith("#") or line == "---":
            continue
        if index:
            p.add_run("\n")
        r = p.add_run(line)
        set_run_font(r, FONT_CJK, 8.8, MUTED)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(26)
    r = p.add_run(f"生成于 {datetime.now().strftime('%Y-%m-%d %H:%M')}  ·  来源：运行时剧情导出")
    set_run_font(r, FONT_CJK, 8, MUTED)
    doc.add_page_break()


def add_node_header(doc: Document, line: str):
    match = re.match(r"^\[([^\]]+)\]\s+\(([^/]+)/([^\)]+)\)$", line)
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4.2)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.keep_with_next = True
    shade_paragraph(p, "F2F6F7")
    if not match:
        r = p.add_run(line)
        set_run_font(r, FONT_MONO, 8.2, TEAL, True)
        return
    node_id, speaker, node_type = match.groups()
    r = p.add_run(f"[{node_id}]")
    set_run_font(r, FONT_MONO, 8.2, TEAL, True)
    r = p.add_run(f"   {speaker} / {node_type}")
    set_run_font(r, FONT_CJK, 8.2, MUTED, True)


def add_node_block(doc: Document, block: list[str]):
    while block and block[0].startswith("##"):
        line = block.pop(0)
        if line.startswith("## "):
            p = doc.add_paragraph(line[3:], style="Heading 1")
            p.paragraph_format.page_break_before = True
            add_bottom_border(p, "78A9AB", "8")
        else:
            doc.add_paragraph(line[4:], style="Heading 2")

    if not block:
        return

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(3.5)
    p.paragraph_format.space_after = Pt(2.2)
    p.paragraph_format.line_spacing = 1.06
    first = block[0]
    header_match = re.match(r"^\[([^\]]+)\]\s+\(([^/]+)/([^\)]+)\)$", first)
    if header_match:
        node_id, speaker, node_type = header_match.groups()
        r = p.add_run(f"[{node_id}]   ")
        set_run_font(r, FONT_MONO, 8.2, TEAL, True)
        r = p.add_run(f"{speaker} / {node_type}")
        set_run_font(r, FONT_CJK, 8.2, MUTED, True)
        remaining = block[1:]
    else:
        remaining = block

    if remaining:
        body = "\n".join(line.strip() if line.startswith("  ") else line for line in remaining)
        r = p.add_run("\n" + body)
        set_run_font(r, FONT_CJK, 8.9, INK)


def add_body(doc: Document, body_lines: list[str]):
    block: list[str] = []
    for line in body_lines + [""]:
        if line:
            block.append(line)
            continue
        if block:
            add_node_block(doc, block)
            block = []


def main():
    lines = SOURCE.read_text(encoding="utf-8-sig").splitlines()
    divider = lines.index("---")
    header_lines = lines[:divider]
    body_lines = lines[divider + 1 :]

    doc = Document()
    setup_styles(doc)
    configure_section(doc.sections[0])
    doc.core_properties.title = "第七次重启 V1.0 无后记主流程 规范化 ID 运行时导出版"
    doc.core_properties.subject = "2063 节点运行时剧情审校稿"
    doc.core_properties.author = "Seventh Reboot Project"
    doc.core_properties.keywords = "第七次重启, V1.0, 剧情, 特殊互动, Observer-01, Nova"

    add_cover(doc, header_lines)
    add_body(doc, body_lines)

    doc.save(OUTPUT)
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()

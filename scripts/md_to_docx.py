#!/usr/bin/env python3
"""
Convert DEPLOY-CPANEL.md to a plain Word document.
Usage: python3 scripts/md_to_docx.py
"""

import re
from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

MD_PATH   = "DEPLOY-CPANEL.md"
DOCX_PATH = "DEPLOY-CPANEL.docx"

doc = Document()

# --- Plain default style ---
style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(11)

# Remove all default margins (use Word defaults — 1 inch all round)
section = doc.sections[0]
section.left_margin   = section.right_margin = 914400   # 1 inch in EMUs
section.top_margin    = section.bottom_margin = 914400

def set_font(run, bold=False, italic=False, mono=False):
    run.bold   = bold
    run.italic = italic
    run.font.name = 'Courier New' if mono else 'Calibri'
    run.font.size = Pt(10) if mono else Pt(11)

def add_heading(text, level):
    sizes = {1: 16, 2: 14, 3: 12}
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    run.font.name = 'Calibri'
    run.font.size = Pt(sizes.get(level, 11))
    p.paragraph_format.space_before = Pt(12 if level == 1 else 6)
    p.paragraph_format.space_after  = Pt(4)

def add_body(text):
    """Add a paragraph, handling inline **bold** and `code` markers."""
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    # Split on bold (**text**) and inline code (`text`)
    parts = re.split(r'(\*\*[^*]+\*\*|`[^`]+`)', text)
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            run = p.add_run(part[2:-2])
            set_font(run, bold=True)
        elif part.startswith('`') and part.endswith('`'):
            run = p.add_run(part[1:-1])
            set_font(run, mono=True)
        else:
            run = p.add_run(part)
            set_font(run)
    return p

def add_code_block(lines):
    for line in lines:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent   = Pt(24)
        p.paragraph_format.space_before  = Pt(0)
        p.paragraph_format.space_after   = Pt(0)
        run = p.add_run(line)
        set_font(run, mono=True)

def add_bullet(text, indent=0):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.left_indent  = Pt(18 + indent * 18)
    p.paragraph_format.space_after  = Pt(2)
    parts = re.split(r'(\*\*[^*]+\*\*|`[^`]+`)', text)
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            run = p.add_run(part[2:-2])
            set_font(run, bold=True)
        elif part.startswith('`') and part.endswith('`'):
            run = p.add_run(part[1:-1])
            set_font(run, mono=True)
        else:
            run = p.add_run(part)
            set_font(run)

def add_table(headers, rows):
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.style = 'Table Grid'
    # Header row
    for i, h in enumerate(headers):
        cell = t.rows[0].cells[i]
        cell.text = ''
        run = cell.paragraphs[0].add_run(h)
        set_font(run, bold=True)
    # Data rows
    for ri, row in enumerate(rows):
        for ci, cell_text in enumerate(row):
            cell = t.rows[ri + 1].cells[ci]
            cell.text = ''
            # Handle inline code/bold in table cells
            parts = re.split(r'(`[^`]+`)', cell_text)
            for part in parts:
                if part.startswith('`') and part.endswith('`'):
                    run = cell.paragraphs[0].add_run(part[1:-1])
                    set_font(run, mono=True)
                else:
                    run = cell.paragraphs[0].add_run(part)
                    set_font(run)
    doc.add_paragraph()

# ──────────────────────────────────────────────────────────────────────────────
# Parse the Markdown file
# ──────────────────────────────────────────────────────────────────────────────

with open(MD_PATH, 'r', encoding='utf-8') as f:
    lines = f.readlines()

i = 0
in_code = False
code_lines = []
table_lines = []
in_table = False

while i < len(lines):
    line = lines[i].rstrip('\n')

    # ── Code block ─────────────────────────────────────────────────────────
    if line.strip().startswith('```'):
        if not in_code:
            in_code = True
            code_lines = []
        else:
            in_code = False
            add_code_block(code_lines)
        i += 1
        continue

    if in_code:
        code_lines.append(line)
        i += 1
        continue

    # ── Table ──────────────────────────────────────────────────────────────
    if line.strip().startswith('|'):
        table_lines.append(line)
        i += 1
        continue
    else:
        if table_lines:
            # Parse collected table lines
            rows_raw = [l for l in table_lines if not re.match(r'^\s*\|[-| ]+\|\s*$', l)]
            parsed = []
            for r in rows_raw:
                cells = [c.strip() for c in r.strip().strip('|').split('|')]
                parsed.append(cells)
            if len(parsed) >= 2:
                add_table(parsed[0], parsed[1:])
            elif len(parsed) == 1:
                add_table(parsed[0], [])
            table_lines = []

    # ── Headings ───────────────────────────────────────────────────────────
    m = re.match(r'^(#{1,3})\s+(.*)', line)
    if m:
        level = len(m.group(1))
        add_heading(m.group(2), level)
        i += 1
        continue

    # ── Horizontal rule ────────────────────────────────────────────────────
    if re.match(r'^---+\s*$', line):
        doc.add_paragraph('─' * 60)
        i += 1
        continue

    # ── Bullet points ──────────────────────────────────────────────────────
    m = re.match(r'^(\s*)[-*]\s+(.*)', line)
    if m:
        indent = len(m.group(1)) // 2
        add_bullet(m.group(2), indent)
        i += 1
        continue

    # ── Numbered list ──────────────────────────────────────────────────────
    m = re.match(r'^(\s*)\d+\.\s+(.*)', line)
    if m:
        indent = len(m.group(1)) // 2
        add_bullet(m.group(2), indent)
        i += 1
        continue

    # ── Blockquote ─────────────────────────────────────────────────────────
    m = re.match(r'^>\s*(.*)', line)
    if m:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Pt(24)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(m.group(1))
        set_font(run, italic=True)
        i += 1
        continue

    # ── Blank line ─────────────────────────────────────────────────────────
    if line.strip() == '':
        i += 1
        continue

    # ── Regular paragraph ──────────────────────────────────────────────────
    add_body(line)
    i += 1

# Flush any trailing table
if table_lines:
    rows_raw = [l for l in table_lines if not re.match(r'^\s*\|[-| ]+\|\s*$', l)]
    parsed = []
    for r in rows_raw:
        cells = [c.strip() for c in r.strip().strip('|').split('|')]
        parsed.append(cells)
    if len(parsed) >= 2:
        add_table(parsed[0], parsed[1:])

doc.save(DOCX_PATH)
print(f"Saved: {DOCX_PATH}")

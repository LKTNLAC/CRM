"""PDF export helpers với hỗ trợ tiếng Việt."""

from io import BytesIO
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ============================================================
# Đăng ký font DejaVuSans để hỗ trợ tiếng Việt
# ============================================================

FONT_DIR = Path(__file__).parent.parent / "fonts"

FONT_NAME = "Helvetica"          # fallback
FONT_NAME_BOLD = "Helvetica-Bold"  # fallback

try:
    regular_path = FONT_DIR / "DejaVuSans.ttf"
    bold_path = FONT_DIR / "DejaVuSans-Bold.ttf"

    if regular_path.exists() and bold_path.exists():
        pdfmetrics.registerFont(TTFont("DejaVuSans", str(regular_path)))
        pdfmetrics.registerFont(TTFont("DejaVuSans-Bold", str(bold_path)))
        FONT_NAME = "DejaVuSans"
        FONT_NAME_BOLD = "DejaVuSans-Bold"
        print(f"[PDF] Registered DejaVuSans from {FONT_DIR}")
    else:
        print(f"[PDF] WARNING: DejaVu fonts not found at {FONT_DIR}, using Helvetica (Vietnamese may not render)")
except Exception as e:
    print(f"[PDF] WARNING: Failed to register DejaVu fonts: {e}")


# ============================================================
# Export function
# ============================================================

def export_to_pdf(
    title: str,
    headers: list[str],
    rows: list[list[Any]],
    subtitle: str | None = None,
) -> BytesIO:
    """Tạo file PDF với tiêu đề + bảng, hỗ trợ tiếng Việt."""
    output = BytesIO()

    # Landscape nếu nhiều cột
    page_size = landscape(A4) if len(headers) > 5 else A4

    doc = SimpleDocTemplate(
        output,
        pagesize=page_size,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=2 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontName=FONT_NAME_BOLD,
        fontSize=16,
        textColor=colors.HexColor("#1F2937"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName=FONT_NAME,
        fontSize=10,
        textColor=colors.HexColor("#6B7280"),
        spaceAfter=12,
    )

    elements = [Paragraph(title, title_style)]
    if subtitle:
        elements.append(Paragraph(subtitle, subtitle_style))
    elements.append(Spacer(1, 0.5 * cm))

    # Table data
    data = [headers] + [[str(v) if v is not None else "" for v in row] for row in rows]

    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                # Header
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), FONT_NAME_BOLD),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("VALIGN", (0, 0), (-1, 0), "MIDDLE"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                # Body
                ("FONTNAME", (0, 1), (-1, -1), FONT_NAME),
                ("FONTSIZE", (0, 1), (-1, -1), 8),
                ("VALIGN", (0, 1), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 1), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
                # Grid
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
                # Zebra
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
            ]
        )
    )

    elements.append(table)

    doc.build(elements)
    output.seek(0)
    return output
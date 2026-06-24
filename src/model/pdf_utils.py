from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)


def register_fonts() -> str:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]

    for font_path in candidates:
        if Path(font_path).exists():
            pdfmetrics.registerFont(TTFont("AppFont", font_path))
            return "AppFont"

    return "Helvetica"


FONT_NAME = register_fonts()

def safe_text(value: Any) -> str:
    if value is None:
        return "-"

    if value == "":
        return "-"

    if isinstance(value, bool):
        return "Yes" if value else "No"

    return str(value)


def escape_text(text: Any) -> str:
    text = safe_text(text)
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def make_paragraph(text: Any, style: ParagraphStyle, allow_markup: bool = True) -> Paragraph:
    if allow_markup:
        return Paragraph(safe_text(text), style)

    return Paragraph(escape_text(text), style)


def build_key_value_table(data: dict[str, Any], styles: dict) -> Table:
    rows = []

    for key, value in data.items():
        if isinstance(value, dict) and "extracted" in value and "verified" in value:
            value_text = (
                f"<b>Extracted:</b> {escape_text(value['extracted'])}<br/>"
                f"<font color='red'><b>Verified:</b>{escape_text(value['verified'])}</font>"
            )
            allow_markup = True

        elif isinstance(value, list) and len(value) == 2:
            value_text = (
                f"<b>Extracted:</b> {escape_text(value[0])}<br/>"
                f"<b><font color='red'>Verified:</b> {escape_text(value[1])} </font>"
            )
            allow_markup = True

        else:
            value_text = value
            allow_markup = False

        rows.append([
            make_paragraph(f"<b>{escape_text(key)}</b>", styles["table_key"], allow_markup=True),
            make_paragraph(value_text, styles["table_value"], allow_markup=allow_markup),
        ])

    if not rows:
        rows = [[
            make_paragraph("No data", styles["table_key"]),
            make_paragraph("-", styles["table_value"]),
        ]]

    table = Table(rows, colWidths=[5.2 * cm, 10.8 * cm])

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#111827")),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    return table

def build_requests_table(requests: list[dict[str, Any]], styles: dict) -> Table:
    rows = [[
        make_paragraph("<b>Category</b>", styles["table_header"], allow_markup=True),
        make_paragraph("<b>Request</b>", styles["table_header"], allow_markup=True),
        make_paragraph("<b>Confidence</b>", styles["table_header"], allow_markup=True),
        make_paragraph("<b>Evidence</b>", styles["table_header"], allow_markup=True),
    ]]

    for item in requests:
        rows.append([
            make_paragraph(item.get("category", "-"), styles["small"], allow_markup=True),
            make_paragraph(item.get("request", "-"), styles["small"], allow_markup=True),
            make_paragraph(item.get("confidence", "-"), styles["small"], allow_markup=True),
            make_paragraph(item.get("evidence", "-"), styles["small"], allow_markup=True),
        ])

    if len(rows) == 1:
        return None
        # rows.append([
        #     make_paragraph("-", styles["small"]),
        #     make_paragraph("No additional requests", styles["small"]),
        #     make_paragraph("-", styles["small"]),
        #     make_paragraph("-", styles["small"]),
        # ])

    table = Table(
        rows,
        colWidths=[3.0 * cm, 5.0 * cm, 2.3 * cm, 5.7 * cm],
        repeatRows=1,
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [
            colors.white,
            colors.HexColor("#F8FAFC"),
        ]),
    ]))

    return table

def normalize_task_value(value: Any) -> Any:
    if isinstance(value, list):
        parts = []

        for item in value:
            if isinstance(item, dict):
                request = item.get("request", "")
                category = item.get("category", "")
                confidence = item.get("confidence", "")
                evidence = item.get("evidence", "")

                parts.append(
                    f"{request} "
                    f"({category}, {confidence})"
                    f"<br/>Evidence: {evidence}"
                )
            else:
                parts.append(str(item))

        return "<br/><br/>".join(parts)

    if isinstance(value, dict):
        return "<br/>".join(
            f"<b>{safe_text(k)}:</b> {safe_text(v)}"
            for k, v in value.items()
        )

    return value


def build_pdf_from_json(data: dict[str, Any], output_path: str | Path) -> Path:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    styles_base = getSampleStyleSheet()

    styles = {
        "title": ParagraphStyle(
            "Title",
            parent=styles_base["Title"],
            fontName=FONT_NAME,
            fontSize=20,
            leading=24,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=10,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=styles_base["Normal"],
            fontName=FONT_NAME,
            fontSize=10,
            leading=13,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#475569"),
            spaceAfter=18,
        ),
        "section": ParagraphStyle(
            "Section",
            parent=styles_base["Heading2"],
            fontName=FONT_NAME,
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#0F172A"),
            spaceBefore=12,
            spaceAfter=7,
        ),
        "table_key": ParagraphStyle(
            "TableKey",
            parent=styles_base["Normal"],
            fontName=FONT_NAME,
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#0F172A"),
        ),
        "table_value": ParagraphStyle(
            "TableValue",
            parent=styles_base["Normal"],
            fontName=FONT_NAME,
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#111827"),
        ),
        "table_header": ParagraphStyle(
            "TableHeader",
            parent=styles_base["Normal"],
            fontName=FONT_NAME,
            fontSize=8,
            leading=10,
            textColor=colors.white,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=styles_base["Normal"],
            fontName=FONT_NAME,
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor("#111827"),
        ),
    }

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.4 * cm,
        bottomMargin=1.4 * cm,
    )

    story = []

    job_id = data.get("id", "-")
    overview = data.get("overview", {})
    tasks = data.get("task", {})
    additional_requests = data.get("Additional requests", [])
    conflicts = data.get("verification_conflicts", {})

    ship_name = overview.get("Name", "-")
    imo = overview.get("IMO", "-")

    story.append(make_paragraph("Port Call Summary", styles["title"]))
    story.append(make_paragraph(
        f"{job_id} | Vessel: {ship_name} | IMO: {imo}",
        styles["subtitle"],
    ))

    story.append(make_paragraph("Overview", styles["section"]))
    story.append(build_key_value_table(overview, styles))
    story.append(Spacer(1, 0.35 * cm))

    if conflicts:
        story.append(make_paragraph("Verification conflicts", styles["section"]))
        story.append(build_key_value_table(conflicts, styles))
        story.append(Spacer(1, 0.35 * cm))

    story.append(make_paragraph("Generated tasks", styles["section"]))

    if not tasks:
        story.append(make_paragraph("No tasks generated.", styles["table_value"]))
    else:
        for task_name, task_data in tasks.items():
            story.append(make_paragraph(task_name, styles["section"]))

            if isinstance(task_data, dict):
                printable_task = {
                    key: normalize_task_value(value)
                    for key, value in task_data.items()
                }
                story.append(build_key_value_table(printable_task, styles))
            else:
                story.append(build_key_value_table(
                    {"Details": normalize_task_value(task_data)},
                    styles,
                ))

            story.append(Spacer(1, 0.25 * cm))

    story.append(PageBreak())
    adds = None
    if isinstance(additional_requests, list):
        adds = build_requests_table(additional_requests, styles)

    if adds is not None:
        story.append(make_paragraph("Additional requests", styles["section"]))
        story.append(adds)

    doc.build(story)

    return output_path


if __name__ == "__main__":
    build_pdf_from_json({'overview': {'Name': 'M/V Northern Wind',
  'IMO': '9876543',
  'ETA': '12 August 2026 at about 06:00 local time',
  'Destination': 'Hamburg'},
 'task': {'Fill PCS form': {'Ship Name': 'M/V Northern Wind',
   'Target Port': 'Hamburg',
   'Estimated Time Arrival': '12 August 2026 at about 06:00 local time',
   'Ship IMO number': '9876543',
   'Cargo Type': 'steel coils',
   'Cargo Weight': '8,500 metric tons',
   'Ship Width': '30.2 m',
   'Ship Length': '199.5 m',
   'Ship Submersion': '8.1 m',
   'Ship Weight': '35870 GT',
   'Number of Crew Members': '27'},
  'Arrange for the ship to be refueled': {'Fuel Amount': '300 MT VLSFO',
   'Fuel Type': 'VLSFO',
   'Additional requests': [{'request': 'confirm whether MGO is available',
     'category': 'fuel',
     'evidence': 'Please also confirm whether MGO is available, but do not order MGO at this stage.',
     'confidence': 'high'}]},
  'Arrange provisions delivery': {'Food details': 'fresh vegetables, rice, meat, bread, drinking water, and basic cleaning supplies',
   'Additional requests': []},
  'Arrange help for cargo handling': {'Needs help Unloading': True,
   'Needs help loading': True,
   'Type': 'steel coils',
   'Weight': '8,500 metric tons',
   'Additional requests': [{'request': 'arrange discharge of the steel coils upon arrival',
     'category': 'cargo_handling',
     'evidence': 'Please arrange discharge of the steel coils upon arrival.',
     'confidence': 'high'},
    {'request': 'arrange loading of 2,000 MT of packed machinery parts for the next voyage',
     'category': 'cargo_handling',
     'evidence': 'After discharge, please also arrange loading of 2,000 MT of packed machinery parts for the next voyage.',
     'confidence': 'high'}]},
  'Report the transport of hazardous goods': {'Description of hazardous goods:': '12 containers marked as hazardous goods, classified as IMO Class 3 flammable liquid',
   'Additional requests': [{'request': 'confirm whether any additional dangerous goods declaration is required for the IMO Class 3 containers',
     'category': 'hazardous_goods',
     'evidence': 'Please handle customs clearance before arrival and confirm whether any additional dangerous goods declaration is required for the IMO Class 3 containers.',
     'confidence': 'high'}]},
  'Arrange customs clearance for the ship': {'Description of custom clarance:': 'handle customs clearance before arrival and confirm whether any additional dangerous goods declaration is required for the IMO Class 3 containers',
   'Additional requests': [{'request': 'handle customs clearance before arrival',
     'category': 'customs',
     'evidence': 'Please handle customs clearance before arrival',
     'confidence': 'high'}]}}}, Path("dupa.pdf"))
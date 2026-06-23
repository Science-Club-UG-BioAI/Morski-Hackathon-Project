from fastapi import FastAPI, UploadFile, File
from typing import List, Optional

from utils import eml_to_clean_text, extract_pdf_text
from model import (
    merge_email_extractions,
    extract_from_mail,
    EmailExtractionConflictError,
)
from deckhend import deckhend


app = FastAPI()


@app.post("/full_ports/")
def full_ports(
    content: UploadFile = File(...), attachments: Optional[List[UploadFile]] = File(...)
):
    text = eml_to_clean_text(content)
    pdf_text = [extract_pdf_text(pdf) for pdf in attachments]
    pdf_text.append(text)

    try:
        jsons = [extract_from_mail(contents) for contents in pdf_text]
    except Exception as e:
        print(e)

    final_json = None

    try:
        final_json = merge_email_extractions(jsons)
    except EmailExtractionConflictError as e:
        print(e)
    except Exception as e:
        print(e)

    if final_json:
        return {}

    ffj = deckhend(final_json)

    tasks = {}

    FIELD_MAP = {
        "ship_name": "Ship Name",
        "port_name": "Target Port",
        "eta": "Estimated Time Arrival",
        "imo_number": "Ship IMO number",
        "cargo_type": "Cargo Type",
        "cargo_weight": "Cargo Weight",
        "ship_width": "Ship Width",
        "ship_length": "Ship Length",
        "ship_submersion": "Ship Submersion",
        "ship_weigth": "Ship Weight",
        "number_of_crew_members": "Number of Crew Members",
    }

    pcs = {}

    for source_key, target_key in FIELD_MAP.items():
        value = ffj.get(source_key)

        if value is not None and value != "":
            pcs[target_key] = value
        else:
            pcs[target_key] = "-"

    tasks["Fill PCS form"] = pcs

    # Refuel
    if ffj["refueling_is_needed"] is not None and ffj["refueling_is_needed"]:
        fuel = {}
        if ffj["fuel_amount"] is not None and ffj["fuel_amount"] != "":
            fuel["Fuel Amount"] = ffj["fuel_amount"]

        if ffj["fuel_category"] is not None and fuel["fuel_category"] != "":
            fuel["Fuel Type"] = ffj["fuel_category"]

        tasks["Arrange for the ship to be refueled"] = fuel

    # Food
    if ffj["food"]:
        if ffj["food_description"] is None:
            food = "-"
        else:
            food = ffj["food_description"]
        tasks["Arrange provisions delivery"] = {"Food details": food}

    # Cargo handling
    FIELD_MAP = {
        "needs_unloading": "Needs help Unloading",
        "needs_loading": "Needs help loading",
        "cargo_type": "Type",
        "cargo_weight": "Weight",
    }

    if ffj["needs_unloading"] or ffj["needs_loading"]:
        loads = {}
        for source_key, target_key in FIELD_MAP.items():
            value = ffj.get(source_key)

            if value is not None and value != "":
                loads[target_key] = value
            else:
                loads[target_key] = "-"

    tasks["Arrange help for cargo handling"] = loads

    # Dangerous Goods
    if (
        ffj["hazmat_and_dangerous_goods"] is not None
        and ffj["hazmat_and_dangerous_goods"] != ""
    ):
        tasks["Report the transport of hazardous goods"] = {
            "Description of hazardous goods:": ffj["hazmat_and_dangerous_goods"]
        }

    # Customs Clearance
    if ffj["customs_clearance"] is not None and ffj["customs_clearance"] != "":
        tasks["Arrange customs clearance for the ship"] = {
            "Description of custom clarance:": ffj["customs_clearance"]
        }

    ov = {}
    FIELD_MAP = {
        "ship_name": "Name",
        "imo_number": "IMO",
        "eta": "ETA",
        "port_name": "Destination",
    }
    for source_key, target_key in FIELD_MAP.items():
        value = ffj.get(source_key)

        if value is not None and value != "":
            ov[target_key] = value
        else:
            ov[target_key] = "-"

    return {"overview": ov, "task": tasks}

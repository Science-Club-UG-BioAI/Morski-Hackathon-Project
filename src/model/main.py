from fastapi import FastAPI, UploadFile, File, HTTPException
from starlette.background import BackgroundTask
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Any
from copy import deepcopy
from pathlib import Path
import os
from tempfile import NamedTemporaryFile

from utils import (
    eml_to_clean_text,
    extract_pdf_text,
    find_additional_tasks_category,
    remove_preset_category,
    change_to_list_dict,
    get_history,
    save_json,
    load_json,
    get_next_free_id,
)
from model import (
    merge_email_and_pdf_extractions,
    extract_from_mail,
    EmailExtractionConflictError,
    get_additional_tasks,
)
from pdf_utils import build_pdf_from_json

from deckhend import deckhend

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/full_ports/")
async def full_ports(
    content: UploadFile = File(...),
    attachments: Optional[List[UploadFile]] = File(None),
):
    file = await content.read()
    text = eml_to_clean_text(file)

    pdf_text = []

    if attachments:
        for attachment in attachments:
            pdf_bytes = await attachment.read()
            pdf_text.append(extract_pdf_text(pdf_bytes))

    pdf_text.append(text)

    try:
        jsons = [extract_from_mail(contents) for contents in pdf_text]
        print(jsons)
        additional_info_jsons = change_to_list_dict(get_additional_tasks(text))

    except Exception as e:
        print(e)
        return

    print(jsons)
    final_json = None

    try:
        final_json = merge_email_and_pdf_extractions(mail_items=[jsons[-1]], pdf_items=jsons[:-1])
    except EmailExtractionConflictError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if final_json is None:
        return {}

    ffj = deepcopy(final_json.model_dump())
    checked: dict = deckhend(ffj["imo_number"])

    verification_conflicts = {}

    for key, val in checked.items():
        original_value = ffj.get(key)

        if val is not None and original_value is not None and val != original_value:
            verification_conflicts[key] = {
                "extracted": original_value,
                "verified": val,
            }

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
        "ship_weight": "Ship Weight",
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

        if ffj["fuel_category"] is not None and ffj["fuel_category"] != "":
            fuel["Fuel Type"] = ffj["fuel_category"]

        fuel_add = find_additional_tasks_category(additional_info_jsons, "fuel")
        fuel["Additional requests"] = fuel_add

        tasks["Arrange for the ship to be refueled"] = fuel

    # Food
    if ffj["food"]:
        if ffj["food_description"] is None:
            food = "-"
        else:
            food = ffj["food_description"]

        food_add = find_additional_tasks_category(additional_info_jsons, "food")
        water_add = find_additional_tasks_category(additional_info_jsons, "water")
        food_add.extend(water_add)
        whole = {"Food details": food}
        if food_add is not None:
            whole["Additional requests"] = food_add
        tasks["Arrange provisions delivery"] = whole

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
        cargo_handling = find_additional_tasks_category(
            additional_info_jsons, "cargo_handling"
        )
        if cargo_handling is not None:
            loads["Additional requests"] = cargo_handling
        tasks["Arrange help for cargo handling"] = loads

    # Dangerous Goods
    if (
        ffj["hazmat_and_dangerous_goods"] is not None
        and ffj["hazmat_and_dangerous_goods"] != ""
    ):
        add_hazard = find_additional_tasks_category(
            additional_info_jsons, "hazardous_goods"
        )
        _all = {"Description of hazardous goods:": ffj["hazmat_and_dangerous_goods"]}
        if add_hazard is not None:
            _all["Additional requests"] = add_hazard
        tasks["Report the transport of hazardous goods"] = _all

    # Customs Clearance
    if ffj["customs_clearance"] is not None and ffj["customs_clearance"] != "":
        add_customs = find_additional_tasks_category(additional_info_jsons, "customs")
        all_customs = {"Description of custom clearance:": ffj["customs_clearance"]}

        if add_customs is not None:
            all_customs["Additional requests"] = add_customs

        tasks["Arrange customs clearance for the ship"] = all_customs

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

    filtered = remove_preset_category(additional_info_jsons)

    job_id = get_next_free_id()
    resp = {
        "id": job_id,
        "overview": ov,
        "task": tasks,
        "Additional requests": filtered,
        "verification_conflicts": verification_conflicts,
    }
    save_json(job_id, resp)
    print(resp)
    return resp


@app.get("/history/")
def history():
    try:
        resp = get_history()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return resp


@app.get("/load/")
def load(id: int):
    try:
        x = load_json(id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return x


@app.post("/save/")
def save(target: dict[str, Any]):
    try:
        job_id = get_next_free_id()
        save_json(job_id, target)

    except FileExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "ok": True,
        "id": job_id,
    }


@app.post("/pdf/{job_id}")
def create_pdf(job_id: int, target: dict[str, Any]):
    output_path: Path | None = None

    try:
        with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            output_path = Path(tmp.name)

        build_pdf_from_json(target, output_path)

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=f"port_call_{job_id}.pdf",
            background=BackgroundTask(os.remove, output_path),
        )

    except Exception as e:
        if output_path is not None and output_path.exists():
            output_path.unlink(missing_ok=True)

        raise HTTPException(status_code=500, detail=str(e))

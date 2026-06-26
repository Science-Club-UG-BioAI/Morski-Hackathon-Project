from email import policy
from email.parser import BytesParser
import fitz
from typing import Optional, List, Any
from pathlib import Path
import json

save_handle = Path("save/")
save_handle.mkdir(exist_ok=True)


def eml_to_clean_text(file_bytes: bytes) -> str:
    msg = BytesParser(policy=policy.default).parsebytes(file_bytes)

    text_body = ""

    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                text_body += part.get_content()
    else:
        if msg.get_content_type() == "text/plain":
            text_body = msg.get_content()

    return text_body


def extract_pdf_text(file_bytes: bytes) -> str:
    text_parts = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text = page.get_text("text")
            if text.strip():
                text_parts.append(text)
    return "\n\n".join(text_parts).strip()


def estimate_num_ctx(email_text: str) -> int:
    overhead = 1500
    needed = len(email_text) // 4 + overhead

    if needed <= 2048:
        return 2048
    elif needed <= 4096:
        return 4096
    elif needed <= 8192:
        return 8192
    elif needed <= 12288:
        return 12288
    else:
        return 16384


def find_additional_tasks_category(tasks: Any, category: str) -> Optional[List]:
    if tasks is None:
        return None

    if hasattr(tasks, "additional_requests"):
        tasks_list = tasks.additional_requests

    elif isinstance(tasks, dict):
        tasks_list = tasks.get("additional_requests", [])

    elif isinstance(tasks, list):
        tasks_list = tasks

    else:
        raise TypeError(f"Unsupported tasks type: {type(tasks)}")

    matched = []

    for task in tasks_list:
        if hasattr(task, "category"):
            task_category = task.category

        elif isinstance(task, dict):
            task_category = task.get("category")

        else:
            continue

        if task_category == category:
            matched.append(task)

    return matched


presets_category = [
    "fuel",
    "food",
    "water",
    "cargo_handling",
    "hazardous_goods",
    "customs",
]


def remove_preset_category(additional: Any) -> List:

    preset_set = set(presets_category)

    if additional is None:
        return []

    if hasattr(additional, "additional_requests"):
        tasks_list = additional.additional_requests

    elif isinstance(additional, dict):
        tasks_list = additional.get("additional_requests", [])

    elif isinstance(additional, list):
        tasks_list = additional

    else:
        raise TypeError(f"Unsupported additional type: {type(additional)}")

    filtered = []

    for task in tasks_list:
        if hasattr(task, "category"):
            category = task.category
        elif isinstance(task, dict):
            category = task.get("category")
        else:
            continue

        if category not in preset_set:
            filtered.append(task)

    return filtered


def change_to_list_dict(additional) -> list[dict]:

    if additional is None:
        return []

    if hasattr(additional, "additional_requests"):
        items = additional.additional_requests
    elif isinstance(additional, dict):
        items = additional.get("additional_requests", [])
    elif isinstance(additional, list):
        items = additional
    else:
        raise TypeError(f"Unsupported additional tasks type: {type(additional)}")

    result = []

    for item in items:
        if hasattr(item, "model_dump"):
            result.append(item.model_dump())
        elif isinstance(item, dict):
            result.append(item)
        else:
            raise TypeError(f"Unsupported task item type: {type(item)}")

    return result


def save_json(job_id: int, target: dict):
    path = save_handle / f"{job_id}.json"

    with open(path, "w") as file:
        json.dump(target, file, indent=4)


def load_json(job_id: int) -> dict:
    path = save_handle / f"{job_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Requested file {path} does not exist!")

    with open(path, "r") as file:
        return json.load(file)


def get_history() -> dict[int, list[str | None]]:
    history = {}

    for path in save_handle.glob("*.json"):
        try:
            job_id = int(path.stem)
        except ValueError:
            continue

        try:
            data = load_json(job_id)
        except Exception:
            continue

        overview = data.get("overview", {})
        ship_name = overview.get("Name")
        imo_number = overview.get("IMO")

        if ship_name is None:
            ship_name = data.get("ship_name")

        if imo_number is None:
            imo_number = data.get("imo_number")

        history[job_id] = [ship_name, imo_number]

    return dict(sorted(history.items()))


def get_next_free_id(start: int = 1) -> int:
    used_ids = set()

    for path in save_handle.glob("*.json"):
        try:
            used_ids.add(int(path.stem))
        except ValueError:
            continue

    next_id = start

    while next_id in used_ids:
        next_id += 1

    return next_id

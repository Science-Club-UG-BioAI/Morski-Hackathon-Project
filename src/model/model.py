from ollama import chat
from pydantic import BaseModel, Field
from typing import Optional, Any, Iterable, Literal
import json

from utils import estimate_num_ctx

SYSETM_PROMPT_EXTRACTION = """
You are a strict maritime email and document information extraction engine.

Your task is to extract structured information from ship-related emails, PDF text, and attachments.

Extract only facts that are explicitly present in the provided text.
Do not guess, infer, assume, normalize creatively, or complete missing information from context.
If a field is missing, unclear, ambiguous, only implied, or not explicitly stated, return null.

Return valid JSON only.
Do not include explanations, markdown, comments, or extra text.

Rules:
- Every key from the schema must be present in the output JSON.
- Use null for unknown or missing values.
- Preserve original wording, units, and formats whenever possible.
- For dates and ETA values, keep the format used in the source text unless an exact ISO-like date is explicitly present.
- For numeric values with units, keep the unit, for example "12000 MT", "32 m", "7.5 m".
- For boolean fields, return:
  - true only if the text explicitly confirms it,
  - false only if the text explicitly denies it,
  - null if the information is not mentioned.
- Do not treat general cargo descriptions as loading or unloading requests unless loading/unloading is explicitly requested.
- Do not treat fuel type or fuel amount as a refueling request unless refueling, bunkering, or fuel supply is explicitly requested.
- Do not treat food/provisions as needed unless food, provisions, catering, stores, victuals, or similar supply is explicitly requested.
- Ignore signatures, disclaimers, legal footers, quoted previous emails, and unrelated boilerplate unless they contain relevant explicit information.
"""

SYSTEM_PROMPT_ADDITIONAL_TASKS = """
You are a strict maritime email and document task extraction engine.

Your task is to extract explicit actionable requests, tasks, instructions, or requirements
from ship-related emails, PDF text, and attachments.

Extract only requests that are explicitly present in the provided text.
Do not guess, infer, assume, or create tasks from context.
If no explicit additional requests are present, return an empty list.

Return valid JSON only.
Do not include explanations, markdown, comments, or extra text.

Definitions:
- A request/task is something the sender asks someone to do, arrange, confirm, prepare, provide, send, check, book, notify, handle, or organize.
- A request may be direct, for example: "Please arrange bunkering."
- A request may also be polite or indirect, for example: "Could you confirm berth availability?"
- Do not extract pure facts as requests.
- Do not extract ETA, ship dimensions, cargo description, IMO number, or crew count unless the text explicitly asks for an action related to them.
- Do not treat a cargo description as loading/unloading unless loading or unloading is explicitly requested.
- Do not treat a fuel amount or fuel type as a bunkering/refueling request unless bunkering, refueling, fuel supply, or similar action is explicitly requested.
- Ignore signatures, disclaimers, legal footers, quoted previous emails, and unrelated boilerplate unless they contain relevant explicit requests.

For each extracted request:
- request: short description of the action, preserving the meaning from the source text.
- category: choose the best category from the schema.
- evidence: exact text span copied from the source that supports the request.
- confidence:
  - high: explicit and unambiguous request,
  - medium: explicit but wording is slightly indirect,
  - low: present but weakly phrased or partially ambiguous.

Every extracted request must have exact evidence copied from the source text.
"""


class EmailExtraction(BaseModel):
    ship_name: Optional[str]
    port_name: Optional[str]
    eta: Optional[str]
    imo_number: Optional[str]

    refueling_is_needed: Optional[bool]
    fuel_amount: Optional[str]
    fuel_category: Optional[str]

    food: Optional[bool]
    food_description: Optional[str]

    cargo_type: Optional[str]
    cargo_weight: Optional[str]

    needs_unloading: Optional[bool]
    needs_loading: Optional[bool]

    ship_width: Optional[str]
    ship_length: Optional[str]
    ship_submersion: Optional[str]
    ship_weigth: Optional[str]

    number_of_crew_members: Optional[str]
    hazmat_and_dangerous_goods: Optional[str]

    customs_clearance: Optional[str]


class AdditionalRequest(BaseModel):
    request: str = Field(
        description="A single explicit actionable request or task from the text."
    )
    category: Literal[
        "fuel",
        "food",
        "water",
        "cargo_handling",
        "hazardous_goods",
        "customs",
        "crew",
        "documents",
        "berth",
        "repairs",
        "waste_disposal",
        "other",
    ]
    evidence: str = Field(
        description="Exact text span copied from the source text that supports this request."
    )
    confidence: Literal["low", "medium", "high"]


class AdditionalTasksExtraction(BaseModel):
    additional_requests: list[AdditionalRequest] = Field(
        default_factory=list,
        description="List of explicit additional requests/tasks found in the text. Empty list if none.",
    )


additional_tasks_schema = AdditionalTasksExtraction.model_json_schema()
schema = EmailExtraction.model_json_schema()


class EmailExtractionConflictError(ValueError):
    pass


def _to_dict(item: EmailExtraction | dict | str) -> dict[str, Any]:
    if isinstance(item, EmailExtraction):
        return item.model_dump()

    if isinstance(item, dict):
        return item

    if isinstance(item, str):
        return json.loads(item)

    raise TypeError(f"Unsupported item type: {type(item)}")


def _normalize_value(value: Any) -> Any:
    if isinstance(value, str):
        value = value.strip()
        if value == "":
            return None
    return value


def merge_email_extractions(
    items: Iterable[EmailExtraction | dict | str],
) -> EmailExtraction:
    merged: dict[str, Any] = {
        field_name: None for field_name in EmailExtraction.model_fields.keys()
    }

    for index, item in enumerate(items):
        data = _to_dict(item)

        for field_name in merged.keys():
            new_value = _normalize_value(data.get(field_name))
            old_value = _normalize_value(merged.get(field_name))

            if new_value is None:
                continue

            if old_value is None:
                merged[field_name] = new_value
                continue

            if old_value != new_value:
                merged[field_name] = new_value

    return EmailExtraction(**merged)


def extract_from_mail(content: str) -> EmailExtraction:
    response = chat(
        model="qwen3:4b",
        think=False,
        messages=[
            {
                "role": "system",
                "content": SYSETM_PROMPT_EXTRACTION,
            },
            {
                "role": "user",
                "content": content,
            },
        ],
        format=schema,
        options={
            "temperature": 0,
            "top_p": 0.1,
            "num_ctx": estimate_num_ctx(content),
        },
    )

    return EmailExtraction.model_validate_json(response["message"]["content"])


def remove_unverified_additional_requests(
    result: AdditionalTasksExtraction,
    content: str,
) -> AdditionalTasksExtraction:
    verified_requests = []

    for item in result.additional_requests:
        if item.evidence and item.evidence in content:
            verified_requests.append(item)

    result.additional_requests = verified_requests
    return result


def get_additional_tasks(content: str) -> AdditionalTasksExtraction:
    response = chat(
        model="qwen3:4b",
        think=False,
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT_ADDITIONAL_TASKS,
            },
            {
                "role": "user",
                "content": content,
            },
        ],
        format=additional_tasks_schema,
        options={
            "temperature": 0,
            "top_p": 0.1,
            "num_ctx": estimate_num_ctx(content),
        },
    )

    result = AdditionalTasksExtraction.model_validate_json(
        response["message"]["content"]
    )

    return remove_unverified_additional_requests(result, content)

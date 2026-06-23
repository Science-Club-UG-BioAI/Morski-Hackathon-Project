from ollama import chat
from pydantic import BaseModel
from typing import Optional, Any, Iterable
import json

SYSETM_PROMPT = """
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
    merged: dict[str, Any] = {field_name: None for field_name in EmailExtraction.model_fields.keys()}

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
                # raise EmailExtractionConflictError(
                #     f"Conflict in field '{field_name}' at item index {index}: "
                #     f"existing value={old_value!r}, new value={new_value!r}"
                # )

    return EmailExtraction(**merged)


def extract_from_mail(content: str):
    response = chat(
        model="qwen3:4b",
        think=False,
        messages=[
            {
                "role": "system",
                "content": SYSETM_PROMPT,
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
            "num_ctx": 8124,
        },
    )

    return EmailExtraction.model_validate_json(response["message"]["content"])

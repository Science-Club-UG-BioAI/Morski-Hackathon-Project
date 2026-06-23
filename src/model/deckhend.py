from dotenv import load_dotenv
import os
import httpx
load_dotenv()

API_KEY = os.getenv("VESSEL_API_KEY")
BASE_URL = "https://api.vesselapi.com/v1"

FIELD_MAPPING = {
    "ship_name": "name",
    "ship_width": "breadth",
    "ship_length": "length",
    "ship_submersion": "draft",
    "ship_weight": "grossTonnage",
}


def get_ship_by_imo(imo: str):

    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }

    response = httpx.get(
        f"{BASE_URL}/search/vessels",
        params={"filter.imo": imo},
        headers=headers
    )

    return response.json()


def deckhend(imo: str) -> dict:
    api_response = get_ship_by_imo(imo)
    vessels = api_response.get("vessels", [])

    if not vessels:
        return {}

    vessel = vessels[0]

    return {
        local_field: vessel.get(api_field)
        for local_field, api_field in FIELD_MAPPING.items()
    }
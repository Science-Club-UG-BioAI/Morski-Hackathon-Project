from vessel_api import get_ship_by_imo

FIELD_MAPPING = {
    "ship_name": "name",
    "ship_width": "breadth",
    "ship_length": "length",
    "ship_submersion": "draft",
    "ship_weight": "grossTonnage",
}

def deckhand(imo: str) -> dict:

    api_response = get_ship_by_imo(imo)

    vessels = api_response.get("vessels", [])

    if not vessels:
        return {}

    vessel = vessels[0]

    return {
        local_field: vessel.get(api_field)
        for local_field, api_field in FIELD_MAPPING.items()
    }
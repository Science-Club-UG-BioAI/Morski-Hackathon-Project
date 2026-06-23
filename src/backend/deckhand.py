from vessel_api import get_ship_by_imo

FIELD_MAPPING = {
    "ship_name": "name",
    "ship_width": "breadth",
    "ship_length": "length",
    "ship_submersion": "draft",
    "ship_weigth": "grossTonnage",
}


def deckhand(ship_data: dict) -> dict:
    imo = ship_data["imo"]
    api_response = get_ship_by_imo(imo)
    vessels = api_response.get("vessels", [])
    if not vessels:
        return ship_data
    vessel = vessels[0]

    for local_field, api_field in FIELD_MAPPING.items():
        current_value = ship_data.get(local_field)
        if current_value in [None, ""]:
            api_value = vessel.get(api_field)
            if api_value is not None:
                ship_data[local_field] = api_value
                
    return ship_data
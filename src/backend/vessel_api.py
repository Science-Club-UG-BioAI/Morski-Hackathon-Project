from dotenv import load_dotenv
import os
import httpx
load_dotenv()

API_KEY = os.getenv("VESSEL_API_KEY")
BASE_URL = "https://api.vesselapi.com/v1"
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
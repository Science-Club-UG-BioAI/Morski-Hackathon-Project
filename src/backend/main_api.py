from fastapi import FastAPI, HTTPException
from deckhand import deckhand

app = FastAPI()

@app.post("/deckhand")
def deckh_endpoint(payload: dict):

    if "imo" not in payload:
        raise HTTPException(
            status_code=400,
            detail="IMO is required"
        )

    return deckhand(payload)
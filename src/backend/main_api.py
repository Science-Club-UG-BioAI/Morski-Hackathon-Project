from fastapi import FastAPI, HTTPException
from deckhand import deckhand

app = FastAPI()

@app.get("/deckhand")
def deckhand_endpoint(imo: str):

    result = deckhand(imo)

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Ship with IMO {imo} not found"
        )
    return result
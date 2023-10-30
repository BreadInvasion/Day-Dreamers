import os
from fastapi import FastAPI
from fastapi import HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, you might want to restrict this later!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Event(BaseModel):
    start: int
    end: int
    title: str
    description: str

events_data = []

@app.get("/api")
def get_events():
    return events_data

@app.post("/api")
def add_event(event: Event):
    events_data.append(event.dict())
    return event

@app.put("/api/{event_id}")
def update_event(event_id: int, event: Event):
    try:
        events_data[event_id] = event.dict()
    except IndexError:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "success"}

@app.delete("/api/{event_id}")
def delete_event(event_id: int):
    try:
        events_data.pop(event_id)
    except IndexError:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "success"}

import os
from fastapi import FastAPI
from fastapi import HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4, UUID
from app.database.database import DBSession
from app.database.database import Event, User
from sqlalchemy import select, insert
from sqlalchemy.orm import Session
from sqlalchemy.exc import NoResultFound
from typing import List

app = FastAPI()

test_user = UUID("721fba7d-2c44-479a-b92c-a748305d654a", version=4)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, you might want to restrict this later!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


events_data = []


class NewEvent(BaseModel):
    title: str
    description: str
    start: int
    end: int


@app.get("/event/all")
def get_events() -> List[Event]:
    session: Session
    with DBSession() as session:
        return session.query(Event).all()


@app.post("/event/new")
def add_event(event: NewEvent):
    event.id = uuid4()
    session: Session
    with DBSession() as session:
        session.add(
            Event(
                id=uuid4(),
                title=event.title,
                description=event.description,
                start=event.start,
                end=event.end,
                owner=session.get(User, test_user),
                attendees=[],
            )
        )
        session.commit()
    return {"status": "success"}


@app.post("/event/attendees/remove")
def remove_attendee(event_id: UUID, removing_attendee: UUID):
    try:
        session: Session
        with DBSession() as session:
            event: Event = session.query(Event).filter(Event.id == event_id).one()
            event.attendees = [
                attendee
                for attendee in event.attendees
                if attendee.id != removing_attendee
            ]
            session.commit()
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Event not found")


@app.post("/event/attendees/add")
def add_attendee(event_id: UUID, new_attendee: UUID):
    try:
        session: Session
        with DBSession() as session:
            event: Event = session.query(Event).filter(Event.id == event_id).one()
            event.attendees.append(
                session.query(User).filter(User.id == new_attendee).one()
            )
            session.commit()
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Event or attendee not found")


@app.post("/event/delete")
def delete_event(event_id: UUID):
    session: Session
    with DBSession() as session:
        event = session.get(Event, event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        session.delete(event)
        session.commit()

from http import HTTPStatus
import os
from fastapi import FastAPI
from fastapi import HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4, UUID
from database.database import DBSession, Event, User
from sqlalchemy import select, insert
from sqlalchemy.orm import Session
from sqlalchemy.exc import NoResultFound
from typing import List

app = FastAPI()

test_user = UUID("721fba7d-2c44-479a-b92c-a748305d654a", version=4)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "localhost",
        "*",
    ],  # For development, you might want to restrict this later!
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


class CleanEvent(BaseModel):
    id: UUID
    title: str
    description: str
    start: int
    end: int
    owner: UUID
    attendees: List[UUID]


class CleanList(BaseModel):
    events: List[CleanEvent]


@app.get("/ping")
def health_check() -> HTTPStatus:
    return HTTPStatus.OK


@app.get("/event/all")
def get_events() -> List[CleanEvent]:
    session: Session
    with DBSession() as session:
        event_list: List[Event] = list(session.scalars(select(Event)).all())
        print("GET EVENTS: EVENT LIST AFTER DB CALL:")
        print(event_list)
        return [
            CleanEvent(
                id=event.id,
                title=event.title,
                description=event.description,
                start=event.start,
                end=event.end,
                owner=event.owner.id,
                attendees=[attendee.id for attendee in event.attendees],
            )
            for event in event_list
        ]


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

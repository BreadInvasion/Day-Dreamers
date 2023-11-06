from typing import Annotated, List, Set
from uuid import UUID

from api.exceptions import DoesNotExistException, EventNotOwnedException
from api.models import SuccessResponse
from database.database import DBSession, Event, User
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from security.access import get_current_user
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, lazyload

router = APIRouter()


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


@router.get("/event")
def get_events(current_user: Annotated[User, Depends(get_current_user)]) -> List[CleanEvent]:
    session: Session
    with DBSession() as session:
        event_list: Set[Event] = set(
            session.scalars(
                select(Event)
                .where(
                    or_(Event.owner_id == current_user.id, Event.attendees.contains(current_user))
                )
                .options(lazyload(Event.attendees))
            ).all()
        )
        return [
            CleanEvent(
                id=event.id,
                title=event.title,
                description=event.description,
                start=event.start,
                end=event.end,
                owner=event.owner_id,
                attendees=[attendee.id for attendee in event.attendees],
            )
            for event in event_list
        ]


@router.post("/event/new")
def add_event(
    event: NewEvent, current_user: Annotated[User, Depends(get_current_user)]
) -> SuccessResponse:
    session: Session
    with DBSession() as session:
        session.add(
            Event(
                title=event.title,
                description=event.description,
                start=event.start,
                end=event.end,
                owner=current_user,
            )
        )
        session.commit()
    return SuccessResponse()


@router.post("/event/attendees/remove")
def remove_attendee(
    event_id: UUID,
    removing_attendee: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
):
    session: Session
    with DBSession() as session:
        event: Event = session.scalar(
            select(Event).where(Event.id == event_id).options(lazyload(Event.attendees))
        )

        if event:
            if event.owner_id != current_user.id:
                raise EventNotOwnedException
            event.attendees = [
                attendee for attendee in event.attendees if attendee.id != removing_attendee
            ]
            session.commit()
            return {"status": "success"}

        raise DoesNotExistException(Event)


@router.post("/event/attendees/add")
def add_attendee(
    event_id: UUID, new_attendee: UUID, current_user: Annotated[User, Depends(get_current_user)]
) -> SuccessResponse:
    session: Session
    with DBSession() as session:
        event: Event = session.scalar(
            select(Event).where(Event.id == event_id).options(lazyload(Event.attendees))
        )

        if event:
            if event.owner_id != current_user.id:
                raise EventNotOwnedException

            attendee = session.scalar(select(User).where(User.id == new_attendee))
            if not attendee:
                raise DoesNotExistException(User)
            event.attendees.append(attendee)
            session.commit()
            return SuccessResponse()

        raise DoesNotExistException(Event)


@router.post("/event/delete")
def delete_event(event_id: UUID, current_user: Annotated[User, Depends(get_current_user)]):
    session: Session
    with DBSession() as session:
        event = session.get(Event, event_id)
        if not event:
            raise DoesNotExistException(Event)
        if event.owner_id != current_user.id:
            raise EventNotOwnedException
        session.delete(event)
        session.commit()

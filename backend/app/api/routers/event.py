from typing import Annotated, List, Set
from uuid import UUID

from api.exceptions import DoesNotExistException, EventNotOwnedException
from database.database import DBSession, Event, User
from fastapi import APIRouter, Depends, HTTPException, status
from models import SuccessResponse, UserData, UserInfo
from pydantic import BaseModel
from security.access import get_current_user
from sqlalchemy import or_, select, update
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
    owner: UserInfo
    attendees: List[UserInfo]


@router.get("/event")
def get_events(
    current_user: Annotated[UserData, Depends(get_current_user)]
) -> List[CleanEvent]:
    session: Session
    with DBSession() as session:
        user = session.scalar(
            select(User)
            .where(User.id == current_user.id)
            .options(lazyload(User.attending_events))
            .options(lazyload(User.owned_events))
        )

        event_list = user.owned_events + user.attending_events

        return [
            CleanEvent(
                id=event.id,
                title=event.title,
                description=event.description,
                start=event.start,
                end=event.end,
                owner=UserInfo(id=event.owner_id, username=event.owner.username),
                attendees=[
                    UserInfo(id=attendee.id, username=attendee.username)
                    for attendee in event.attendees
                ],
            )
            for event in event_list
        ]


@router.post("/event/new")
def add_event(
    event: NewEvent, current_user: Annotated[UserData, Depends(get_current_user)]
) -> SuccessResponse:
    session: Session
    with DBSession() as session:
        user = session.scalar(select(User).where(User.id == current_user.id))

        session.add(
            Event(
                title=event.title,
                description=event.description,
                start=event.start,
                end=event.end,
                owner=user,
            )
        )
        session.commit()
    return SuccessResponse()


class EditInfo(BaseModel):
    title: str | None = None
    description: str | None = None
    start: int | None = None
    stop: int | None = None


@router.post("/event/edit")
def edit_event(
    edit_info: EditInfo, current_user: Annotated[UserData, Depends(get_current_user)]
) -> SuccessResponse:
    args_pruned = {
        key: value for key, value in edit_info.__dict__.items() if value is not None
    }

    session: Session
    with DBSession() as session:
        event = session.scalar(select(Event).where(Event.owner_id == current_user.id))
        if not event:
            raise EventNotOwnedException
        session.execute(update(Event).where(Event.id == event.id).values(**args_pruned))
        session.commit()

    return SuccessResponse()


@router.post("/event/attendees/remove")
def remove_attendee(
    event_id: UUID,
    removing_attendee: UUID,
    current_user: Annotated[UserData, Depends(get_current_user)],
):
    session: Session
    with DBSession() as session:
        event: Event = session.scalar(
            select(Event).where(Event.id == event_id).options(lazyload(Event.attendees))
        )

        if event:
            if (
                event.owner_id != current_user.id
                and removing_attendee != current_user.id
            ):
                raise EventNotOwnedException
            event.attendees = [
                attendee
                for attendee in event.attendees
                if attendee.id != removing_attendee
            ]
            session.commit()
            return {"status": "success"}

        raise DoesNotExistException(Event)


@router.post("/event/attendees/add")
def add_attendee(
    event_id: UUID,
    new_attendee: str,
    current_user: Annotated[UserData, Depends(get_current_user)],
) -> SuccessResponse:
    session: Session
    with DBSession() as session:
        event: Event = session.scalar(
            select(Event).where(Event.id == event_id).options(lazyload(Event.attendees))
        )

        if event:
            if event.owner_id != current_user.id:
                raise EventNotOwnedException

            attendee = session.scalar(select(User).where(User.username == new_attendee))
            if not attendee:
                raise DoesNotExistException(User)
            event.attendees.append(attendee)
            session.commit()
            return SuccessResponse()

        raise DoesNotExistException(Event)


@router.post("/event/delete")
def delete_event(
    event_id: UUID, current_user: Annotated[UserData, Depends(get_current_user)]
):
    session: Session
    with DBSession() as session:
        event = session.get(Event, event_id)
        if not event:
            raise DoesNotExistException(Event)
        if event.owner_id != current_user.id:
            raise EventNotOwnedException
        session.delete(event)
        session.commit()

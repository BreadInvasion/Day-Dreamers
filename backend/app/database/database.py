import uuid
from typing import List

from config.config import settings
from sqlalchemy import Column, ForeignKey, String, Table, create_engine
from sqlalchemy.dialects.postgresql import UUID as _UUIDC
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
    sessionmaker,
)

UUIDC = _UUIDC(as_uuid=True)


class Base(DeclarativeBase):
    pass


user_event_association = Table(
    "user_event_association",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="cascade"), primary_key=True),
    Column("event_id", ForeignKey("events.id", ondelete="cascade"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUIDC, primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    owned_events: Mapped[List["Event"]] = relationship(back_populates="owner")
    attending_events: Mapped[List["Event"]] = relationship(
        secondary=user_event_association, back_populates="attendees"
    )


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(UUIDC, primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(nullable=False)
    start: Mapped[int] = mapped_column(nullable=False)
    end: Mapped[int] = mapped_column(nullable=False)
    owner: Mapped[User] = relationship(back_populates="owned_events")
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="cascade"))
    attendees: Mapped[List[User]] = relationship(
        secondary=user_event_association,
        back_populates="attending_events",
    )


engine = create_engine(settings.db_url)
Base.metadata.create_all(engine)

DBSession: sessionmaker = sessionmaker(engine)

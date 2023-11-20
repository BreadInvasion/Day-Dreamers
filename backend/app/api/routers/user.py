from typing import Annotated

from database.database import DBSession, User
from fastapi import APIRouter, Depends, HTTPException, status
from models import SuccessResponse, UserData
from pydantic import BaseModel, EmailStr, SecretStr
from security.access import authenticate_user, get_current_user, get_hash
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

router = APIRouter()


class NewUserInfo(BaseModel):
    email: EmailStr
    username: str
    password: SecretStr


class UserProfile(BaseModel):
    email: EmailStr
    username: str


@router.post("/user/me")
def get_profile(current_user: Annotated[UserData, Depends(get_current_user)]) -> UserProfile:
    return UserProfile(email=current_user.email, username=current_user.username)


@router.post("/user/new")
def create_user(info: NewUserInfo) -> SuccessResponse:
    session: Session
    with DBSession() as session:
        id_in_db = (
            session.scalar(select(User.username).where(User.username == info.username)) is not None
        )
        if id_in_db:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username taken")

        email_in_db = (
            session.scalar(select(User.email).where(User.email == info.email)) is not None
        )
        if email_in_db:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email already in use"
            )

        session.add(
            User(
                email=info.email,
                username=info.username,
                password_hash=get_hash(info.password.get_secret_value()),
            )
        )

        session.commit()
    return SuccessResponse()


@router.post("/user/delete")
def delete_user(current_user: Annotated[UserData, Depends(get_current_user)]) -> SuccessResponse:
    session: Session
    with DBSession() as session:
        session.execute(delete(User).where(User.id == current_user.id))
        session.commit()
    return SuccessResponse()


@router.post("/user/username/check")
def check_username_availability(username: str) -> bool:
    session: Session
    with DBSession() as session:
        username_in_db = (
            session.execute(select(User.username).where(User.username == username)).one_or_none()
            is not None
        )
        return not username_in_db  # Available if not in db, not available if is in db


@router.post("/user/email/check")
def check_email_availability(email: EmailStr) -> bool:
    session: Session
    with DBSession() as session:
        email_in_db = (
            session.execute(select(User.email).where(User.email == email)).one_or_none()
            is not None
        )
        return not email_in_db


@router.post("/user/username/edit")
def change_username(
    new_username: str, current_user: Annotated[UserData, Depends(get_current_user)]
) -> SuccessResponse:
    session: Session
    with DBSession() as session:
        username_in_db = (
            session.scalar(select(User.username).where(User.username == new_username)) is not None
        )
        if username_in_db:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username taken")

        session.execute(
            update(User).where(User.id == current_user.id).values(username=new_username)
        )
        session.commit()

    return SuccessResponse()


@router.post("/user/email/edit")
def change_email(
    new_email: str, current_user: Annotated[UserData, Depends(get_current_user)]
) -> SuccessResponse:
    session: Session
    with DBSession() as session:
        email_in_db = session.scalar(select(User.email).where(User.email == new_email)) is not None
        if email_in_db:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email already in use"
            )

        session.execute(update(User).where(User.id == current_user.id).values(email=new_email))
        session.commit()
    return SuccessResponse()


@router.post("/user/password/edit")
def change_password(
    new_password: SecretStr,
    old_password: SecretStr,
    current_user: Annotated[UserData, Depends(get_current_user)],
) -> SuccessResponse:
    authenticate_user(current_user.username, old_password.get_secret_value())

    session: Session
    with DBSession() as session:
        session.execute(
            update(User).where(User.id == current_user.id).values(password=new_password)
        )
        session.commit()
    return SuccessResponse()

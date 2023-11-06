from datetime import datetime, timedelta
from typing import Annotated

from config.config import settings
from database.database import DBSession, User
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from models import UserData
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session


class Token(BaseModel):
    access_token: str
    token_type: str


CredentialsException = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


hash_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def validate(value: str, hashed_value: str) -> bool:
    return hash_context.verify(secret=value, hash=hashed_value)


def get_hash(value: str) -> str:
    return hash_context.hash(value)


def authenticate_user(username: str, password: str) -> UserData:
    session: Session
    with DBSession() as session:
        user = session.scalar(select(User).where(User.username == username))
        if not user or not validate(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Username or password is incorrect",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return UserData(
            id=user.id,
            username=user.username,
            password_hash=user.password_hash,
            email=user.email,
        )


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    expires = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=15)
    )
    to_encode = data | {"exp": expires}
    encoded_jwt = jwt.encode(to_encode, settings.pass_key, algorithm="HS256")
    return encoded_jwt


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> UserData:
    user_id: str | None
    try:
        payload = jwt.decode(token, settings.pass_key, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise CredentialsException
    except JWTError:
        raise CredentialsException

    session: Session
    with DBSession() as session:
        user = session.scalar(select(User).where(User.id == user_id))
        if user is None:
            raise CredentialsException
        return UserData(
            id=user.id,
            username=user.username,
            password_hash=user.password_hash,
            email=user.email,
        )

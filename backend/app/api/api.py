import os
from datetime import timedelta
from typing import Annotated, List
from uuid import UUID, uuid4

from api.models import SuccessResponse
from api.routers.event import router as event_router
from api.routers.user import router as user_router
from database.database import DBSession, Event, User
from fastapi import Depends, FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from security.access import Token, authenticate_user, create_access_token
from sqlalchemy import insert, select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import Session

app = FastAPI()

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

app.include_router(event_router)
app.include_router(user_router)


@app.get("/ping")
def health_check() -> SuccessResponse:
    return SuccessResponse()


@app.post("/token")
def authorize_user(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    user: User = authenticate_user(form_data.username, form_data.password)
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(data={"sub": user.id}, expires_delta=access_token_expires)
    return Token(access_token=access_token, token_type="bearer")

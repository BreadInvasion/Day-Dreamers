from uuid import UUID

from pydantic import BaseModel, EmailStr


class SuccessResponse(BaseModel):
    status: str = "OK"


class UserInfo(BaseModel):
    id: UUID
    username: str


class UserData(BaseModel):
    id: UUID
    username: str
    password_hash: str
    email: EmailStr

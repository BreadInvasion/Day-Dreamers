from typing import TypeVar

from fastapi import HTTPException, status

EventNotOwnedException = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED, detail="User does not own the target event"
)


def DoesNotExistException(type: type) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail=f"{type.__name__} does not exist"
    )

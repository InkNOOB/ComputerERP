
import os
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

load_dotenv()

SECRET = os.environ["JWT_SECRET"]
DEPT = "IN"

bearer = HTTPBearer(auto_error=False)


def current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer)
) -> dict:
    if creds is None:
        raise HTTPException(
            status_code=401,
            detail="Please log in"
        )

    try:
        return jwt.decode(
            creds.credentials,
            SECRET,
            algorithms=["HS256"]
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=401,
            detail="Session expired, please log in again"
        )


def require_inventory(
    user: dict = Depends(current_user)
) -> dict:
    if user.get("must_change_password"):
        raise HTTPException(
            status_code=403,
            detail="Change your password first"
        )

    if user.get("department") != DEPT:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to Inventory"
        )

    return user


def require_admin(
    user: dict = Depends(require_inventory)
) -> dict:
    if user.get("role") != "Admin":
        raise HTTPException(
            status_code=403,
            detail="Admins only"
        )

    return user

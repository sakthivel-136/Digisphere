from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from app.database import select_rows, insert_row, update_row, delete_row
from app.dependencies import get_current_user, admin_only

# -----------------------------
# Schemas
# -----------------------------
class SecurityUserBase(BaseModel):
    security_id: str = Field(..., description="Unique Security ID")
    security_name: str = Field(..., description="Name of the security user")
    factory: str = Field(..., description="Factory ID or Name")

class SecurityUserCreate(SecurityUserBase):
    security_password: str = Field(..., description="Password (plain text)")

class SecurityUserUpdate(BaseModel):
    security_name: Optional[str] = None
    security_password: Optional[str] = None
    factory: Optional[str] = None

class SecurityUserResponse(SecurityUserBase):
    security_password: str   # Plain password
    created_at: Optional[str] = None

# -----------------------------
# Router
# -----------------------------
router = APIRouter(
    prefix="/security-users",
    tags=["Security Users"]
)

# -----------------------------
# GET all users
# -----------------------------
@router.get("", response_model=List[SecurityUserResponse])
def get_security_users(_: dict = Depends(get_current_user)):
    return select_rows("security_users")

# -----------------------------
# GET single user
# -----------------------------
@router.get("/{security_id}", response_model=SecurityUserResponse)
def get_security_user(security_id: str, _: dict = Depends(get_current_user)):
    rows = select_rows("security_users", {"security_id": security_id})
    if not rows:
        raise HTTPException(404, "Security user not found")
    return rows[0]

# -----------------------------
# CREATE user (NO HASH)
# -----------------------------
@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=SecurityUserResponse
)
def create_security_user(payload: SecurityUserCreate, _: dict = Depends(admin_only)):
    existing = select_rows("security_users", {"security_id": payload.security_id})
    if existing:
        raise HTTPException(400, "Security ID already exists")

    data = {
        "security_id": payload.security_id,
        "security_name": payload.security_name,
        "security_password": payload.security_password,
        "factory": payload.factory
    }

    try:
        inserted = insert_row("security_users", data)
        return inserted
    except Exception as e:
        raise HTTPException(500, f"Database error: {str(e)}")

# -----------------------------
# UPDATE user (NO HASH)
# -----------------------------
@router.put("/{security_id}", response_model=SecurityUserResponse)
def update_security_user(security_id: str, payload: SecurityUserUpdate, _: dict = Depends(admin_only)):
    existing = select_rows("security_users", {"security_id": security_id})
    if not existing:
        raise HTTPException(404, "Security user not found")

    update_data = payload.model_dump(
        exclude_unset=True,
        exclude_none=True
    )

    try:
        updated = update_row("security_users", {"security_id": security_id}, update_data)
        return updated
    except Exception as e:
        raise HTTPException(500, f"Database error: {str(e)}")

# -----------------------------
# DELETE user
# -----------------------------
@router.delete("/{security_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_security_user(security_id: str, _: dict = Depends(admin_only)):
    existing = select_rows("security_users", {"security_id": security_id})
    if not existing:
        raise HTTPException(404, "Security user not found")

    delete_row("security_users", {"security_id": security_id})
    return

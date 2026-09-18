# app/routes/auth.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.core.security import create_access_token
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ----------------------
# Request body schema
# ----------------------
class LoginRequest(BaseModel):
    user_id: str
    user_pin: str

# ----------------------
# Mock DB / Supabase check
# ----------------------
# For now, we use a hardcoded admin
MOCK_USERS = {
    "admin001": {
        "user_pin": "1234",
        "role": "ADMIN",
        "name": "Main Admin"
    }
}

# ----------------------
# Login Route
# ----------------------
@router.post("/login")
async def login(payload: LoginRequest):
    user = MOCK_USERS.get(payload.user_id)

    if not user or user["user_pin"] != payload.user_pin:
        raise HTTPException(status_code=401, detail="Invalid User ID or Password")

    # Token expires in 60 minutes
    access_token = create_access_token(
        {
            "user_id": payload.user_id, 
            "role": user["role"],
            "name": user["name"]
        },
        expires_delta=timedelta(minutes=60)
    )

    return JSONResponse(
        content={
            "access_token": access_token,
            "token_type": "bearer",
            "role": user["role"],
            "name": user["name"]
        }
    )

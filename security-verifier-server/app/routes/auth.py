# app/routes/auth.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import timedelta

from app.core.security import create_access_token
from app.database import execute_d1_query


router = APIRouter(prefix="/auth", tags=["Authentication"])


# ----------------------
# Request Schema
# ----------------------
class LoginRequest(BaseModel):
    user_id: str
    user_pin: str


# ----------------------
# Login Route (DB BASED)
# ----------------------
@router.post("/login")
async def login(payload: LoginRequest):
    try:
        # ==============================
        # 1. Fetch user from DB
        # ==============================
        users = execute_d1_query(
            "SELECT user_id, user_pin, name, role FROM login_info WHERE user_id = ?",
            [payload.user_id]
        )

        if not users:
            raise HTTPException(
                status_code=401,
                detail="Invalid User ID or Password"
            )

        user = users[0]

        # ==============================
        # 2. Verify PIN
        # ==============================
        if user["user_pin"] != payload.user_pin:
            raise HTTPException(
                status_code=401,
                detail="Invalid User ID or Password"
            )

        # ==============================
        # 3. Create Token
        # ==============================
        access_token = create_access_token(
            {
                "user_id": user["user_id"],
                "role": user["role"],
                "name": user.get("name", ""),
            },
            expires_delta=timedelta(minutes=60)
        )

        # ==============================
        # 4. Return Response
        # ==============================
        return JSONResponse(
            content={
                "access_token": access_token,
                "token_type": "bearer",
                "role": user["role"],
                "name": user["name"],
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print("❌ LOGIN ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail="Login failed"
        )

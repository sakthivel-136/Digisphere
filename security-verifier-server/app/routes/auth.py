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
        # 3. Shift Authorization Enforcement for Security Guards
        # ==============================
        user_role = (user.get("role") or "").upper()
        if user_role == "SECURITY":
            # Find guard's factory
            sec_rows = execute_d1_query(
                "SELECT factory FROM security_users WHERE security_id = ?;",
                [payload.user_id]
            )
            guard_factory = sec_rows[0]["factory"] if sec_rows else "F001"

            # Determine current local time in IST (UTC+5:30)
            from datetime import datetime, timezone, timedelta as dt_timedelta
            ist_now = datetime.now(timezone.utc) + dt_timedelta(hours=5, minutes=30)
            now_time_str = ist_now.strftime("%H:%M")

            # Fetch active shifts for this factory
            factory_shifts = execute_d1_query(
                "SELECT id, shift_name, start_time, end_time FROM shifts WHERE factory_code = ? AND is_active = 1;",
                [guard_factory]
            )

            # Match active shift by time
            matched_shift = None
            for s in (factory_shifts or []):
                st = s["start_time"]
                et = s["end_time"]
                if st < et:
                    # Normal daytime shift (e.g. 06:00 to 18:00)
                    if st <= now_time_str < et:
                        matched_shift = s
                        break
                else:
                    # Overnight shift (e.g. 18:00 to 06:00)
                    if now_time_str >= st or now_time_str < et:
                        matched_shift = s
                        break

            if matched_shift:
                # Check if there are specific guard allocations for this shift
                allocations = execute_d1_query(
                    "SELECT security_id FROM shift_allocations WHERE shift_id = ?;",
                    [matched_shift["id"]]
                )
                if allocations:
                    allocated_ids = [a["security_id"] for a in allocations]
                    if payload.user_id not in allocated_ids:
                        raise HTTPException(
                            status_code=403,
                            detail=f"Access Denied: You are not assigned to {matched_shift['shift_name']} ({matched_shift['start_time']} to {matched_shift['end_time']}). Only guards assigned to this shift are permitted to log in."
                        )

        # ==============================
        # 4. Create Token
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

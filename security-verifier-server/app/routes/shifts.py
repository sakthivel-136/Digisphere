# app/routes/shifts.py

from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import List, Optional
from pydantic import BaseModel
import re

from app.database import execute_d1_query
from app.dependencies import get_current_user, admin_only

router = APIRouter(
    prefix="/shifts",
    tags=["Shifts Management"]
)

# ----------------------------------------------------
# SCHEMAS
# ----------------------------------------------------

class ShiftBase(BaseModel):
    factory_code: str = "F001"
    shift_name: str
    shift_code: str = "DAY"
    start_time: str              # "HH:mm" (24h) e.g. "06:00"
    end_time: str                # "HH:mm" (24h) e.g. "18:00"
    scan_interval_mins: Optional[int] = 45
    scan_window_mins: Optional[int] = 25
    is_active: Optional[int] = 1

class ShiftCreate(ShiftBase):
    pass

class ShiftUpdate(BaseModel):
    shift_name: Optional[str] = None
    shift_code: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    scan_interval_mins: Optional[int] = None
    scan_window_mins: Optional[int] = None
    is_active: Optional[int] = None

class ShiftResponse(ShiftBase):
    id: str
    created_at: Optional[str] = None
    allocated_guards_count: Optional[int] = 0

class AllocateGuardsRequest(BaseModel):
    security_ids: List[str]

# ----------------------------------------------------
# ENDPOINTS
# ----------------------------------------------------

@router.get("", response_model=List[ShiftResponse])
def get_shifts(factory_code: Optional[str] = Query(None, description="Filter shifts by factory code")):
    """
    Get all configured shifts, optionally filtered by factory_code.
    Includes count of allocated guards.
    """
    try:
        if factory_code:
            sql = "SELECT * FROM shifts WHERE factory_code = ? ORDER BY start_time ASC;"
            shifts = execute_d1_query(sql, [factory_code])
        else:
            sql = "SELECT * FROM shifts ORDER BY factory_code ASC, start_time ASC;"
            shifts = execute_d1_query(sql)

        if not shifts:
            return []

        # Attach allocated guard count for each shift
        result = []
        for s in shifts:
            count_sql = "SELECT COUNT(*) as count FROM shift_allocations WHERE shift_id = ?;"
            count_res = execute_d1_query(count_sql, [s["id"]])
            alloc_count = count_res[0]["count"] if count_res else 0

            result.append({
                **s,
                "allocated_guards_count": alloc_count
            })

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch shifts: {str(e)}")


@router.post("", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
def create_shift(payload: ShiftCreate, _: dict = Depends(admin_only)):
    """
    Create a new operational shift for a factory.
    """
    slug = re.sub(r"[^a-zA-Z0-9]", "-", payload.shift_name.lower()).strip("-")
    shift_id = f"shift-{payload.factory_code}-{slug}"

    # Check for duplicate id
    check_sql = "SELECT id FROM shifts WHERE id = ?;"
    existing = execute_d1_query(check_sql, [shift_id])
    if existing:
        shift_id = f"shift-{payload.factory_code}-{slug}-{payload.start_time.replace(':', '')}"

    insert_sql = """
    INSERT INTO shifts (id, factory_code, shift_name, shift_code, start_time, end_time, scan_interval_mins, scan_window_mins, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *;
    """
    try:
        res = execute_d1_query(insert_sql, [
            shift_id,
            payload.factory_code,
            payload.shift_name,
            payload.shift_code,
            payload.start_time,
            payload.end_time,
            payload.scan_interval_mins or 45,
            payload.scan_window_mins or 25,
            payload.is_active if payload.is_active is not None else 1
        ])
        if not res:
            raise HTTPException(status_code=500, detail="Failed to create shift")
        return {**res[0], "allocated_guards_count": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error creating shift: {str(e)}")


@router.put("/{shift_id}", response_model=ShiftResponse)
def update_shift(shift_id: str, payload: ShiftUpdate, _: dict = Depends(admin_only)):
    """
    Update shift timing or parameters.
    """
    check_sql = "SELECT * FROM shifts WHERE id = ?;"
    existing = execute_d1_query(check_sql, [shift_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Shift not found")

    updates = []
    params = []
    for field, val in payload.model_dump(exclude_unset=True).items():
        if val is not None:
            updates.append(f"{field} = ?")
            params.append(val)

    if not updates:
        return existing[0]

    params.append(shift_id)
    update_sql = f"UPDATE shifts SET {', '.join(updates)} WHERE id = ? RETURNING *;"
    res = execute_d1_query(update_sql, params)
    
    count_sql = "SELECT COUNT(*) as count FROM shift_allocations WHERE shift_id = ?;"
    count_res = execute_d1_query(count_sql, [shift_id])
    alloc_count = count_res[0]["count"] if count_res else 0

    return {**res[0], "allocated_guards_count": alloc_count}


@router.delete("/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shift(shift_id: str, _: dict = Depends(admin_only)):
    """
    Delete a shift and its associated guard allocations.
    """
    check_sql = "SELECT id FROM shifts WHERE id = ?;"
    existing = execute_d1_query(check_sql, [shift_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Shift not found")

    execute_d1_query("DELETE FROM shift_allocations WHERE shift_id = ?;", [shift_id])
    execute_d1_query("DELETE FROM shifts WHERE id = ?;", [shift_id])
    return None


@router.get("/{shift_id}/guards")
def get_shift_guards(shift_id: str, _: dict = Depends(get_current_user)):
    """
    Get all guards of the shift's factory and mark which ones are allocated.
    """
    shift_sql = "SELECT id, factory_code, shift_name, start_time, end_time FROM shifts WHERE id = ?;"
    shifts = execute_d1_query(shift_sql, [shift_id])
    if not shifts:
        raise HTTPException(status_code=404, detail="Shift not found")

    shift = shifts[0]
    factory_code = shift["factory_code"]

    # 1. All guards in this factory
    guards_sql = "SELECT security_id, security_name FROM security_users WHERE factory = ? ORDER BY security_name ASC;"
    factory_guards = execute_d1_query(guards_sql, [factory_code]) or []

    # 2. Allocated guard IDs for this shift
    alloc_sql = "SELECT security_id FROM shift_allocations WHERE shift_id = ?;"
    allocations = execute_d1_query(alloc_sql, [shift_id]) or []
    allocated_ids = [a["security_id"] for a in allocations]

    return {
        "shift_id": shift_id,
        "shift_name": shift["shift_name"],
        "factory_code": factory_code,
        "allocated_security_ids": allocated_ids,
        "all_factory_guards": factory_guards,
        "has_custom_allocation": len(allocated_ids) > 0
    }


@router.post("/{shift_id}/allocate")
def allocate_shift_guards(shift_id: str, payload: AllocateGuardsRequest, _: dict = Depends(admin_only)):
    """
    Save the list of guards assigned to this shift.
    """
    shift_sql = "SELECT id, factory_code, shift_name FROM shifts WHERE id = ?;"
    shifts = execute_d1_query(shift_sql, [shift_id])
    if not shifts:
        raise HTTPException(status_code=404, detail="Shift not found")

    shift = shifts[0]
    factory_code = shift["factory_code"]

    # Clear existing allocations for this shift
    execute_d1_query("DELETE FROM shift_allocations WHERE shift_id = ?;", [shift_id])

    # Insert new allocations
    inserted = 0
    for sec_id in payload.security_ids:
        alloc_id = f"alloc-{shift_id}-{sec_id}"
        insert_sql = """
        INSERT INTO shift_allocations (id, factory_code, shift_id, security_id)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(shift_id, security_id) DO NOTHING;
        """
        execute_d1_query(insert_sql, [alloc_id, factory_code, shift_id, sec_id])
        inserted += 1

    return {
        "success": True,
        "message": f"Successfully allocated {inserted} guards to {shift['shift_name']}",
        "shift_id": shift_id,
        "count": inserted
    }

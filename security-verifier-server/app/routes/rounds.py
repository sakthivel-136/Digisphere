from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from app.database import execute_d1_query

router = APIRouter(
    prefix="/rounds",
    tags=["Patrol Rounds"]
)

class PatrolRoundBase(BaseModel):
    round_number: int
    start_time: str
    end_time: str
    scan_start_time: Optional[str] = None
    scan_end_time: Optional[str] = None

class PatrolRoundCreate(PatrolRoundBase):
    pass

class PatrolRoundUpdate(BaseModel):
    round_number: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    scan_start_time: Optional[str] = None
    scan_end_time: Optional[str] = None

class PatrolRoundResponse(PatrolRoundBase):
    id: str
    created_at: Optional[str] = None

@router.get("", response_model=List[PatrolRoundResponse])
def get_all_rounds():
    """
    Get all patrol rounds sorted ascending by round_number
    """
    try:
        sql = "SELECT id, round_number, start_time, end_time, scan_start_time, scan_end_time, created_at FROM rounds ORDER BY round_number ASC;"
        results = execute_d1_query(sql)
        return results or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch rounds: {str(e)}")

@router.get("/{round_id}", response_model=PatrolRoundResponse)
def get_round(round_id: str):
    sql = "SELECT id, round_number, start_time, end_time, scan_start_time, scan_end_time, created_at FROM rounds WHERE id = ?;"
    results = execute_d1_query(sql, [round_id])
    if not results:
        raise HTTPException(status_code=404, detail="Round not found")
    return results[0]

@router.post("", response_model=PatrolRoundResponse, status_code=status.HTTP_201_CREATED)
def create_round_endpoint(payload: PatrolRoundCreate):
    # Check duplicate round_number
    check_sql = "SELECT id FROM rounds WHERE round_number = ?;"
    existing = execute_d1_query(check_sql, [payload.round_number])
    if existing:
        raise HTTPException(status_code=400, detail=f"Round {payload.round_number} already exists")

    round_id = f"rnd-{payload.round_number}"
    insert_sql = """
    INSERT INTO rounds (id, round_number, start_time, end_time, scan_start_time, scan_end_time)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *;
    """
    res = execute_d1_query(insert_sql, [
        round_id,
        payload.round_number,
        payload.start_time,
        payload.end_time,
        payload.scan_start_time,
        payload.scan_end_time
    ])
    if not res:
        raise HTTPException(status_code=500, detail="Failed to create round")
    return res[0]

@router.put("/{round_id}", response_model=PatrolRoundResponse)
def update_round_endpoint(round_id: str, payload: PatrolRoundUpdate):
    check_sql = "SELECT id FROM rounds WHERE id = ?;"
    existing = execute_d1_query(check_sql, [round_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Round not found")

    updates = []
    params = []
    for field, val in payload.model_dump(exclude_unset=True).items():
        updates.append(f"{field} = ?")
        params.append(val)

    if not updates:
        return existing[0]

    params.append(round_id)
    update_sql = f"UPDATE rounds SET {', '.join(updates)} WHERE id = ? RETURNING *;"
    res = execute_d1_query(update_sql, params)
    return res[0]

@router.delete("/{round_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_round_endpoint(round_id: str):
    check_sql = "SELECT id FROM rounds WHERE id = ?;"
    existing = execute_d1_query(check_sql, [round_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Round not found")

    execute_d1_query("DELETE FROM rounds WHERE id = ?;", [round_id])
    return None

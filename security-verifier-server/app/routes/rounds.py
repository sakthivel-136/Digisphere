from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel
from app.database import execute_d1_query

router = APIRouter(
    prefix="/rounds",
    tags=["Patrol Rounds"]
)

class PatrolRoundBase(BaseModel):
    factory_code: Optional[str] = "F001"
    round_number: int
    start_time: str
    end_time: str
    scan_start_time: Optional[str] = None
    scan_end_time: Optional[str] = None

class PatrolRoundCreate(PatrolRoundBase):
    pass

class PatrolRoundUpdate(BaseModel):
    factory_code: Optional[str] = None
    round_number: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    scan_start_time: Optional[str] = None
    scan_end_time: Optional[str] = None

class PatrolRoundResponse(PatrolRoundBase):
    id: str
    created_at: Optional[str] = None

class BatchRoundsCreate(BaseModel):
    factory_code: str
    rounds: List[PatrolRoundBase]
    overwrite: Optional[bool] = False

class CopyRoundsRequest(BaseModel):
    source_factory_code: str
    target_factory_code: str
    overwrite: Optional[bool] = False

@router.get("", response_model=List[PatrolRoundResponse])
def get_all_rounds(factory_code: Optional[str] = Query(None, description="Filter rounds by factory code")):
    """
    Get patrol rounds sorted ascending by round_number.
    Optionally filter by factory_code.
    """
    try:
        if factory_code:
            sql = """
            SELECT id, factory_code, round_number, start_time, end_time, scan_start_time, scan_end_time, created_at 
            FROM rounds 
            WHERE factory_code = ? 
            ORDER BY round_number ASC;
            """
            results = execute_d1_query(sql, [factory_code])
        else:
            sql = """
            SELECT id, factory_code, round_number, start_time, end_time, scan_start_time, scan_end_time, created_at 
            FROM rounds 
            ORDER BY factory_code ASC, round_number ASC;
            """
            results = execute_d1_query(sql)
        return results or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch rounds: {str(e)}")

@router.post("/batch", status_code=status.HTTP_201_CREATED)
def create_batch_rounds(payload: BatchRoundsCreate):
    """
    Create or replace multiple rounds for a factory in a single batch operation.
    """
    factory = payload.factory_code
    if not factory:
        raise HTTPException(status_code=400, detail="factory_code is required")
    if not payload.rounds:
        raise HTTPException(status_code=400, detail="rounds array cannot be empty")

    try:
        if payload.overwrite:
            execute_d1_query("DELETE FROM rounds WHERE factory_code = ?;", [factory])

        inserted_count = 0
        for r in payload.rounds:
            round_id = f"rnd-{factory}-{r.round_number}"
            upsert_sql = """
            INSERT INTO rounds (id, factory_code, round_number, start_time, end_time, scan_start_time, scan_end_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                start_time = excluded.start_time,
                end_time = excluded.end_time,
                scan_start_time = excluded.scan_start_time,
                scan_end_time = excluded.scan_end_time;
            """
            execute_d1_query(upsert_sql, [
                round_id,
                factory,
                r.round_number,
                r.start_time,
                r.end_time,
                r.scan_start_time,
                r.scan_end_time
            ])
            inserted_count += 1

        return {
            "success": True,
            "message": f"Successfully created/updated {inserted_count} rounds for factory {factory}",
            "factory_code": factory,
            "count": inserted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to batch create rounds: {str(e)}")

@router.post("/copy", status_code=status.HTTP_201_CREATED)
def copy_rounds_from_factory(payload: CopyRoundsRequest):
    """
    Copy all round timetables from one factory to another.
    """
    source = payload.source_factory_code
    target = payload.target_factory_code

    if not source or not target:
        raise HTTPException(status_code=400, detail="Both source_factory_code and target_factory_code are required")
    if source == target:
        raise HTTPException(status_code=400, detail="Source and target factories cannot be the same")

    try:
        source_sql = """
        SELECT round_number, start_time, end_time, scan_start_time, scan_end_time 
        FROM rounds 
        WHERE factory_code = ? 
        ORDER BY round_number ASC;
        """
        source_rounds = execute_d1_query(source_sql, [source])
        if not source_rounds:
            raise HTTPException(status_code=404, detail=f"No rounds found configured for source factory {source}")

        if payload.overwrite:
            execute_d1_query("DELETE FROM rounds WHERE factory_code = ?;", [target])

        copied_count = 0
        for r in source_rounds:
            round_id = f"rnd-{target}-{r['round_number']}"
            upsert_sql = """
            INSERT INTO rounds (id, factory_code, round_number, start_time, end_time, scan_start_time, scan_end_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                start_time = excluded.start_time,
                end_time = excluded.end_time,
                scan_start_time = excluded.scan_start_time,
                scan_end_time = excluded.scan_end_time;
            """
            execute_d1_query(upsert_sql, [
                round_id,
                target,
                r['round_number'],
                r['start_time'],
                r['end_time'],
                r.get('scan_start_time'),
                r.get('scan_end_time')
            ])
            copied_count += 1

        return {
            "success": True,
            "message": f"Successfully cloned {copied_count} rounds from {source} to {target}",
            "source_factory": source,
            "target_factory": target,
            "count": copied_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to copy rounds: {str(e)}")

@router.get("/{round_id}", response_model=PatrolRoundResponse)
def get_round(round_id: str):
    sql = "SELECT id, factory_code, round_number, start_time, end_time, scan_start_time, scan_end_time, created_at FROM rounds WHERE id = ?;"
    results = execute_d1_query(sql, [round_id])
    if not results:
        raise HTTPException(status_code=404, detail="Round not found")
    return results[0]

@router.post("", response_model=PatrolRoundResponse, status_code=status.HTTP_201_CREATED)
def create_round_endpoint(payload: PatrolRoundCreate):
    factory = payload.factory_code or "F001"
    
    # Check duplicate round_number within the same factory
    check_sql = "SELECT id FROM rounds WHERE factory_code = ? AND round_number = ?;"
    existing = execute_d1_query(check_sql, [factory, payload.round_number])
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Round {payload.round_number} already exists for factory {factory}"
        )

    round_id = f"rnd-{factory}-{payload.round_number}"
    insert_sql = """
    INSERT INTO rounds (id, factory_code, round_number, start_time, end_time, scan_start_time, scan_end_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING *;
    """
    res = execute_d1_query(insert_sql, [
        round_id,
        factory,
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

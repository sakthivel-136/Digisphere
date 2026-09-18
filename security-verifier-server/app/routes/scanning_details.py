# app/routes/scanning_details.py

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime

from app.database import (
    create_scan_log,
    get_all_scan_logs,
    get_scan_logs_by_factory,
    get_scan_logs_by_guard,
    delete_scan_log,
)

from app.schemas.scanning_details import ScanCreate, ScanResponse


router = APIRouter(
    prefix="/scans",
    tags=["Scanning Details"]
)


# --------------------------------------------------
# HELPER
# --------------------------------------------------

def to_scan_response(data: dict) -> ScanResponse:
    return ScanResponse(**data)


# --------------------------------------------------
# CREATE SCAN
# --------------------------------------------------

@router.post("/", response_model=ScanResponse, status_code=201)
def create_scan(scan: ScanCreate):

    try:
        scan_data = scan.model_dump()

        # Add timestamp if DB doesn't auto-generate
        scan_data.setdefault(
            "created_at",
            datetime.utcnow().isoformat()
        )

        result = create_scan_log(scan_data)

        return to_scan_response(result)

    except Exception as e:
        print("Create scan error:", e)
        raise HTTPException(status_code=500, detail="Failed to create scan")


# --------------------------------------------------
# READ SCANS
# --------------------------------------------------

@router.get("/", response_model=List[ScanResponse])
def read_scans(
    factory_code: Optional[str] = None,
    guard_name: Optional[str] = None
):

    try:

        if factory_code:
            data = get_scan_logs_by_factory(factory_code)

        elif guard_name:
            data = get_scan_logs_by_guard(guard_name)

        else:
            data = get_all_scan_logs()

        return [to_scan_response(item) for item in data]

    except Exception as e:
        print("Read scans error:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch scans")


# --------------------------------------------------
# DELETE SCAN
# --------------------------------------------------

@router.delete("/{scan_id}", status_code=204)
def delete_scan(scan_id: int):

    try:

        success = delete_scan_log(scan_id)

        if not success:
            raise HTTPException(
                status_code=404,
                detail="Scan not found"
            )

        return None

    except HTTPException:
        raise
    except Exception as e:
        print("Delete scan error:", e)
        raise HTTPException(status_code=500, detail="Failed to delete scan")

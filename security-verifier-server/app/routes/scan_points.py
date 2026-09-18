from fastapi import APIRouter, HTTPException, status, Query, Depends
from app.database import select_rows, insert_row, update_row, delete_row
from app.schemas.scan_point import ScanPointCreate, ScanPointUpdate, ScanPointResponse
from app.dependencies import get_current_user, admin_only
import uuid

router = APIRouter(
    prefix="/scan-points",
    tags=["Scan Points"]
)

# ---------------------------
# CREATE scan point
# ---------------------------
@router.post("", status_code=status.HTTP_201_CREATED, response_model=ScanPointResponse)
def create_scan_point(payload: ScanPointCreate, _: dict = Depends(admin_only)):
    # Check if factory exists
    factory = select_rows("factories", {"factory_code": payload.factory_id})
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")

    # Check duplicate name
    existing = select_rows("scan_points", {"scan_point_name": payload.scan_point_name})
    if existing:
        raise HTTPException(status_code=400, detail="Scan Point with this name already exists")

    insert_data = {
        "id": str(uuid.uuid4()), # Need explicit UUID since SQLite might not autogenerate it like Postgres
        "factory_id": payload.factory_id,
        "scan_point_name": payload.scan_point_name,
        "scan_point_code": payload.scan_point_code or payload.scan_point_name,
        "location": payload.location,
        "scan_type": payload.scan_type,
        "floor": payload.floor,
        "area": payload.area,
        "risk_level": payload.risk_level,
        "is_active": 1
    }

    try:
        inserted = insert_row("scan_points", insert_data)
        return inserted
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create scan point: {e}")

# ---------------------------
# GET all scan points (optionally filter by factory)
# ---------------------------
@router.get("", response_model=list[ScanPointResponse])
def get_scan_points(factory_id: str = Query(None, description="Filter by Factory ID"), _: dict = Depends(get_current_user)):
    filters = {"factory_id": factory_id} if factory_id else None
    return select_rows("scan_points", filters)

# ---------------------------
# GET scan point by ID
# ---------------------------
@router.get("/{scan_point_id}", response_model=ScanPointResponse)
def get_scan_point(scan_point_id: str, _: dict = Depends(get_current_user)):
    result = select_rows("scan_points", {"id": scan_point_id})
    if not result:
        raise HTTPException(status_code=404, detail="Scan Point not found")
    return result[0]

# ---------------------------
# UPDATE scan point
# ---------------------------
@router.put("/{scan_point_id}", response_model=ScanPointResponse)
def update_scan_point(scan_point_id: str, payload: ScanPointUpdate, _: dict = Depends(admin_only)):
    existing = select_rows("scan_points", {"id": scan_point_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Scan Point not found")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    try:
        updated = update_row("scan_points", {"id": scan_point_id}, update_data)
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update scan point: {e}")

# ---------------------------
# DELETE scan point
# ---------------------------
@router.delete("/{scan_point_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scan_point(scan_point_id: str, _: dict = Depends(admin_only)):
    existing = select_rows("scan_points", {"id": scan_point_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Scan Point not found")

    delete_row("scan_points", {"id": scan_point_id})
    return None

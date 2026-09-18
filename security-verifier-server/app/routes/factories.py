from fastapi import APIRouter, HTTPException, status, Depends
from app.database import execute_d1_query, insert_row, select_rows, update_row, delete_row
from app.schemas.factory import FactoryCreate, FactoryResponse
from app.dependencies import get_current_user, admin_only

router = APIRouter(
    prefix="/factories",
    tags=["Factories"]
)

# ---------------------------
# CREATE Factory
# ---------------------------
@router.post("", status_code=status.HTTP_201_CREATED, response_model=FactoryResponse)
def create_factory(payload: FactoryCreate, _: dict = Depends(admin_only)):
    try:
        inserted = insert_row("factories", {
            "factory_code": payload.factory_code,
            "factory_name": payload.factory_name,
            "location": payload.location,
            "factory_address": payload.factory_address,
            "is_active": 1
        })
        return inserted
    except Exception as e:
        raise HTTPException(500, f"Failed to create factory: {str(e)}")


# ---------------------------
# GET ALL Factories
# ---------------------------
@router.get("", response_model=list[FactoryResponse])
def get_factories(_: dict = Depends(get_current_user)):
    return select_rows("factories")


# ---------------------------
# GET Minimal (Dropdown)
# ---------------------------
@router.get("/minimal")
def get_factories_minimal(_: dict = Depends(get_current_user)):
    return execute_d1_query("SELECT factory_code, factory_name, factory_address FROM factories")


# ---------------------------
# GET Single Factory
# ---------------------------
@router.get("/{factory_code}", response_model=FactoryResponse)
def get_factory(factory_code: str, _: dict = Depends(get_current_user)):
    rows = select_rows("factories", {"factory_code": factory_code})
    if not rows:
        raise HTTPException(404, "Factory not found")
    return rows[0]


# ---------------------------
# UPDATE Factory
# ---------------------------
@router.put("/{factory_code}", response_model=FactoryResponse)
def update_factory(factory_code: str, payload: FactoryCreate, _: dict = Depends(admin_only)):
    existing = select_rows("factories", {"factory_code": factory_code})
    if not existing:
        raise HTTPException(404, "Factory not found")

    try:
        updated = update_row("factories", 
            {"factory_code": factory_code},
            {
                "factory_name": payload.factory_name,
                "location": payload.location,
                "factory_address": payload.factory_address,
            }
        )
        return updated
    except Exception as e:
        raise HTTPException(500, f"Failed to update factory: {str(e)}")


# ---------------------------
# DELETE Factory
# ---------------------------
@router.delete("/{factory_code}", status_code=status.HTTP_204_NO_CONTENT)
def delete_factory(factory_code: str, _: dict = Depends(admin_only)):
    existing = select_rows("factories", {"factory_code": factory_code})
    if not existing:
        raise HTTPException(404, "Factory not found")

    # 1. Delete associated scan points
    execute_d1_query("DELETE FROM scan_points WHERE factory_id = ?", [factory_code])

    # 2. Delete associated QR codes
    execute_d1_query("DELETE FROM qr WHERE factory_code = ?", [factory_code])

    # 3. Delete the factory itself
    delete_row("factories", {"factory_code": factory_code})

    return None

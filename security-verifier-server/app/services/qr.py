from app.database import insert_row, select_rows, update_row, delete_row

TABLE = "qr"


# ---------------- CREATE ----------------
def create_qr(data: dict):
    """
    Create a new QR.
    Ensures waiting_time is valid and never null.
    """
    # ✅ Default waiting_time if missing
    if "waiting_time" not in data or data["waiting_time"] is None:
        data["waiting_time"] = 15

    # ✅ Prevent negative waiting time
    if not isinstance(data["waiting_time"], int) or data["waiting_time"] < 0:
        raise ValueError("waiting_time must be a non-negative integer")

    inserted = insert_row(TABLE, data)

    return inserted


# ---------------- READ BY FACTORY ----------------
def get_qr_by_factory(factory_code: str):
    return select_rows(TABLE, {"factory_code": factory_code}) or []


# ---------------- READ BY ID ----------------
def get_qr_by_id(qr_id: int):
    rows = select_rows(TABLE, {"qr_id": qr_id})
    return rows[0] if rows else None


# ---------------- UPDATE ----------------
def update_qr(qr_id: int, data: dict):
    """
    Update QR details.
    """
    # ✅ Handle waiting_time validation if provided
    if "waiting_time" in data:
        # If explicitly set to None → default
        if data["waiting_time"] is None:
            data["waiting_time"] = 15

        # Prevent negative values
        if not isinstance(data["waiting_time"], int) or data["waiting_time"] < 0:
            raise ValueError("waiting_time must be a non-negative integer")

    updated = update_row(
        TABLE,
        filters={"qr_id": qr_id},
        data=data
    )

    return updated


# ---------------- DELETE ----------------
def delete_qr(qr_id: int):
    deleted = delete_row(
        TABLE,
        filters={"qr_id": qr_id}
    )
    return bool(deleted)

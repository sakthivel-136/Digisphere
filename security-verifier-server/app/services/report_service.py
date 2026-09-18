# app/services/report_service.py

from datetime import datetime, timezone, timedelta
from app.utils.round_slots import generate_round_slots
from app.services.report_audit_service import save_report_audit
from app.database import execute_d1_query

# IST timezone
IST = timezone(timedelta(hours=5, minutes=30))


def build_report_filename(
    report_type: str,
    factory_code: str,
    report_date: str,
    user_name: str | None,
    generated_at: datetime,
):
    """
    Build audit-friendly PDF filename
    """
    safe_name = (user_name or "UNKNOWN").replace(" ", "_")
    ts = generated_at.strftime("%Y%m%d_%H%M%S")
    return f"{report_type}_{factory_code}_{report_date}_{safe_name}_{ts}.pdf"


def generate_report(
    factory_code: str,
    report_date: str,
    current_user: dict
):
    # -----------------------------
    # 1️⃣ Fetch factory
    # -----------------------------
    factories = execute_d1_query(
        "SELECT factory_name, factory_address FROM factories WHERE factory_code = ?",
        [factory_code]
    )

    if not factories:
        raise ValueError("Factory not found")
        
    factory = factories[0]

    # -----------------------------
    # 2️⃣ Generate round slots
    # -----------------------------
    round_slots = generate_round_slots(report_date)

    # -----------------------------
    # 3️⃣ Fetch QR codes
    # -----------------------------
    qr_codes = execute_d1_query(
        "SELECT qr_id, qr_name FROM qr WHERE factory_code = ?",
        [factory_code]
    )

    # -----------------------------
    # 4️⃣ Fetch scans
    # -----------------------------
    scans = execute_d1_query(
        """
        SELECT * FROM scanning_details 
        WHERE factory_code = ? 
          AND scan_time >= ? 
          AND scan_time <= ?
        """,
        [
            factory_code, 
            f"{report_date}T00:00:00+05:30", 
            f"{report_date}T23:59:59+05:30"
        ]
    )

    # -----------------------------
    # 5️⃣ Build report rows
    # -----------------------------
    rows = []

    for qr in qr_codes:
        for round_no, slot_start, slot_end in round_slots:
            scan = next(
                (
                    s for s in scans
                    if str(s.get("qr_id")) == str(qr.get("qr_id"))
                    and s.get("round_slot") == slot_start.isoformat()
                ),
                None
            )

            rows.append({
                "qr_name": qr.get("qr_name"),
                "round": round_no,
                "scan_time": scan.get("scan_time") if scan else None,
                "latitude": scan.get("lat") if scan else None,
                "longitude": scan.get("log") if scan else None,
                "guard_name": scan.get("guard_name") if scan else None,
                "username": scan.get("user_id") if scan else None,
                "status": "SUCCESS" if scan else "FAILED",
            })

    # -----------------------------
    # 6️⃣ Audit info
    # -----------------------------
    generated_at = datetime.now(IST)

    save_report_audit(
        report_type="PATROL_REPORT",
        factory_code=factory_code,
        report_date=report_date,
        current_user=current_user
    )

    # -----------------------------
    # 7️⃣ Auto PDF filename
    # -----------------------------
    audit_filename = build_report_filename(
        report_type="PATROL_REPORT",
        factory_code=factory_code,
        report_date=report_date,
        user_name=current_user.get("name"),
        generated_at=generated_at,
    )

    # -----------------------------
    # 8️⃣ Final response
    # -----------------------------
    return {
        "factory_code": factory_code,
        "factory_name": factory.get("factory_name"),
        "factory_address": factory.get("factory_address"),
        "report_date": report_date,

        "generated_by": {
            "user_id": current_user["user_id"],
            "name": current_user.get("name"),
            "role": current_user["role"],
        },
        "generated_at": generated_at.isoformat(),

        "audit": {
            "audit_id": None, # Returning inserted ID requires changes in insert_row, leaving as None or mock
            "filename": audit_filename,
        },

        "data": rows,
    }

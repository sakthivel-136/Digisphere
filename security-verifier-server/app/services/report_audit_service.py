# app/services/report_audit_service.py
from datetime import datetime, timezone, timedelta
from app.database import insert_row

IST = timezone(timedelta(hours=5, minutes=30))

def save_report_audit(
    report_type: str,
    factory_code: str,
    report_date: str,
    current_user: dict
):
    audit_payload = {
        "report_type": report_type,
        "factory_code": factory_code,
        "report_date": report_date,
        "generated_by_user_id": current_user["user_id"],
        "generated_by_name": current_user.get("name"),
        "generated_by_role": current_user["role"],
        "generated_at": datetime.now(IST).isoformat(),
    }

    insert_row("report_audit", audit_payload)

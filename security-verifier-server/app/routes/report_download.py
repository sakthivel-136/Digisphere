# app/routes/report.py

from fastapi import APIRouter, Depends, Query
from datetime import datetime
import pytz

from app.database import execute_d1_query
from app.utils.round_slots import generate_round_slots
from app.dependencies import get_current_user

router = APIRouter(prefix="/report", tags=["Report"])

IST = pytz.timezone("Asia/Kolkata")

@router.get("/download")
def download_report(
    factory_code: str = Query(...),
    report_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(None, description="End date (YYYY-MM-DD)"),
    _: dict = Depends(get_current_user),
):
    try:
        from datetime import date, timedelta

        # Parse date range
        start_date = report_date
        end_date = end_date or report_date

        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()

        # ==============================
        # 1. Fetch QR codes
        # ==============================
        qr_codes = execute_d1_query(
            "SELECT qr_id, qr_name FROM qr WHERE factory_code = ?",
            [factory_code]
        )

        # ==============================
        # 2. Fetch ALL scan logs for the range
        # ==============================
        scans = []
        page_size = 1000
        offset = 0
        fetch_start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        fetch_start_dt = IST.localize(fetch_start_dt) - timedelta(minutes=30)
        fetch_start = fetch_start_dt.strftime("%Y-%m-%dT%H:%M:%S+05:30")
        fetch_end = f"{end_date}T23:59:59+05:30"

        while True:
            batch = execute_d1_query(
                """
                SELECT id, qr_id, guard_name, scan_time, lat, log, status, round_slot 
                FROM scanning_details 
                WHERE factory_code = ? 
                  AND scan_time >= ? 
                  AND scan_time <= ? 
                ORDER BY scan_time 
                LIMIT ? OFFSET ?
                """,
                [factory_code, fetch_start, fetch_end, page_size, offset]
            )
            scans.extend(batch)
            if len(batch) < page_size:
                break
            offset += page_size

        # ==============================
        # 3. Parse round_slot and scan_time for all scans
        # ==============================
        for s in scans:
            rs = s.get("round_slot")
            st = s.get("scan_time")

            if rs:
                dt = datetime.fromisoformat(rs.replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = IST.localize(dt)
                else:
                    dt = dt.astimezone(IST)
                s["round_dt"] = dt
            else:
                s["round_dt"] = None

            if st:
                dt = datetime.fromisoformat(st.replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = IST.localize(dt)
                else:
                    dt = dt.astimezone(IST)
                s["scan_dt_ist"] = dt
            else:
                s["scan_dt_ist"] = None

        # ==============================
        # 4. Build report day-by-day
        # ==============================
        scans_by_round_qr = {}
        scans_by_qr = {}
        for s in scans:
            qr_id_str = str(s.get("qr_id"))
            round_dt = s.get("round_dt")
            if round_dt:
                scans_by_round_qr[(round_dt, qr_id_str)] = s
            
            if qr_id_str not in scans_by_qr:
                scans_by_qr[qr_id_str] = []
            scans_by_qr[qr_id_str].append(s)

        report = []
        current_dt = start_dt
        now_ist = datetime.now(IST)
        today_str = now_ist.strftime("%Y-%m-%d")

        while current_dt <= end_dt:
            date_str = current_dt.strftime("%Y-%m-%d")
            is_today = (date_str == today_str)
            round_slots = generate_round_slots(date_str)

            for qr in qr_codes:
                qr_id = str(qr["qr_id"])

                for round_no, start_slot_dt, end_slot_dt in round_slots:
                    scan = scans_by_round_qr.get((start_slot_dt, qr_id))

                    if not scan:
                        grace = timedelta(minutes=10)
                        qr_scans = scans_by_qr.get(qr_id, [])
                        scan = next(
                            (
                                s for s in qr_scans
                                if s.get("scan_dt_ist")
                                and (start_slot_dt - grace) <= s.get("scan_dt_ist") < end_slot_dt
                            ),
                            None
                        )

                    if scan:
                        raw = (scan.get("status") or "").lower()
                        if raw in ["success", "completed", "done"]:
                            status = "SUCCESS"
                        else:
                            status = "MISSED"
                    else:
                        if is_today and start_slot_dt > now_ist:
                            status = "PENDING"
                        else:
                            status = "MISSED"

                    report.append({
                        "qr_name": qr["qr_name"],
                        "round": round_no,
                        "scan_time": scan.get("scan_time") if scan else None,
                        "lat": scan.get("lat") if scan else None,
                        "lon": scan.get("log") if scan else None,
                        "guard_name": scan.get("guard_name") if scan else None,
                        "status": status,
                        "date": date_str,
                    })

            current_dt += timedelta(days=1)

        return report

    except Exception as e:
        print("❌ REPORT ERROR:", e)
        return {
            "success": False,
            "message": str(e)
        }

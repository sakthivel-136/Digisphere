from datetime import datetime, timedelta
import pytz

IST = pytz.timezone("Asia/Kolkata")
scans = [
    {
        "qr_id": "28.0",
        "scan_time": "2026-09-18T05:28:00.699753Z",
        "status": "SUCCESS"
    }
]

for s in scans:
    st = s.get("scan_time")
    dt = datetime.fromisoformat(st.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = IST.localize(dt)
    else:
        dt = dt.astimezone(IST)
    s["scan_dt_ist"] = dt
    print("Scan time IST:", dt)

start_slot_dt = IST.localize(datetime(2026, 9, 18, 11, 0, 0))
end_slot_dt = IST.localize(datetime(2026, 9, 18, 12, 0, 0))
grace = timedelta(minutes=10)

print("Start slot:", start_slot_dt)
print("End slot:", end_slot_dt)
print("Grace start:", start_slot_dt - grace)

for s in scans:
    print("Match?", (start_slot_dt - grace) <= s["scan_dt_ist"] < end_slot_dt)

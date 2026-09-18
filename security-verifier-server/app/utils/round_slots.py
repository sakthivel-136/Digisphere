from datetime import datetime, timedelta
import pytz

IST = pytz.timezone("Asia/Kolkata")

def generate_round_slots(report_date: str):
    """
    Returns exactly 32 slots matching the Flutter mobile app's 6:00 AM cycle logic.
    [
      (round_no, start_dt, end_dt),
      ...
    ]
    """
    base = datetime.strptime(report_date, "%Y-%m-%d")
    base = IST.localize(base)

    slots = []
    
    # 1. Day Slots: 6:00 AM to 9:00 PM (21:00) - Hourly
    for i in range(16):
        slots.append(base.replace(hour=6 + i, minute=0, second=0))

    # 2. Night Slots: 10:00 PM (22:00) to 11:30 PM (23:30) - Half-hourly
    slots.append(base.replace(hour=22, minute=0, second=0))
    slots.append(base.replace(hour=22, minute=30, second=0))
    slots.append(base.replace(hour=23, minute=0, second=0))
    slots.append(base.replace(hour=23, minute=30, second=0))

    # 3. Early Morning Slots: 12:00 AM (00:00) to 5:30 AM - Half-hourly
    next_day = base + timedelta(days=1)
    for i in range(12):
        h = i // 2
        m = (i % 2) * 30
        slots.append(next_day.replace(hour=h, minute=m, second=0))

    # Build the final list with start_dt and end_dt
    round_slots = []
    for i, start_dt in enumerate(slots):
        if i < len(slots) - 1:
            end_dt = slots[i+1]
        else:
            # Last slot ends 30 mins later (05:30 to 06:00)
            end_dt = start_dt + timedelta(minutes=30)
        
        round_slots.append((i + 1, start_dt, end_dt))

    return round_slots

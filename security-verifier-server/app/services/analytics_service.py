from fastapi import APIRouter, HTTPException
from datetime import date, datetime, time, timedelta
from app.database import execute_d1_query 

DAY_START = time(6, 0)
DAY_END = time(21, 0)
NIGHT_END = time(5, 30)

GRACE_SECONDS = 600

def get_expected_scan_rounds(target_date: date):
    expected_times = []
    
    night_start_dt = datetime.combine(target_date - timedelta(days=1), time(21, 0))
    night_end_dt = datetime.combine(target_date, NIGHT_END)
    
    current_dt = night_start_dt
    while current_dt <= night_end_dt:
        expected_times.append(current_dt)
        current_dt += timedelta(minutes=30)

    day_start_dt = datetime.combine(target_date, DAY_START)
    day_end_dt = datetime.combine(target_date, DAY_END)
    
    current_dt = day_start_dt
    while current_dt <= day_end_dt:
        expected_times.append(current_dt)
        current_dt += timedelta(hours=1)

    return expected_times

def update_all_scan_statuses(target_date: date):
    start_time_iso = datetime.combine(target_date, datetime.min.time()).isoformat()
    end_time_iso = datetime.combine(target_date, datetime.max.time()).isoformat()

    data = execute_d1_query(
        "SELECT id, scan_time, guard_name, factory_code FROM scanning_details WHERE scan_time >= ? AND scan_time <= ?",
        [start_time_iso, end_time_iso]
    )

    if not data:
        return {
            "total_expected_rounds": 0,
            "total_scans_processed": 0,
            "updated_count": 0,
            "status": "completed"
        }
        
    expected_times = get_expected_scan_rounds(target_date)
    
    if not expected_times:
        return {
            "total_expected_rounds": 0,
            "total_scans_processed": 0,
            "updated_count": 0,
            "status": "no_data"
        }
    
    updated_count = 0

    for item in data:
        scan_time_raw = item.get('scan_time')
        
        if not scan_time_raw:
            continue
        
        if isinstance(scan_time_raw, str):
            try:
                # Remove Z and local timezone handling correctly
                scan_dt = datetime.fromisoformat(scan_time_raw.replace('Z', '+00:00')).replace(tzinfo=None)
            except ValueError:
                print(f"❌ Invalid date format for ID {item['id']}")
                continue
        else:
            scan_dt = scan_time_raw

        best_match = None
        min_diff = float('inf')
        
        for exp_time in expected_times:
            diff = abs((scan_dt - exp_time).total_seconds())
            if diff < min_diff:
                min_diff = diff
                best_match = exp_time

        new_status = 'MISSED' 
        
        if best_match:
            if min_diff <= GRACE_SECONDS:
                new_status = 'SUCCESS'
            else:
                new_status = 'LATE'
        
        try:
            execute_d1_query(
                "UPDATE scanning_details SET status = ? WHERE id = ?",
                [new_status, item['id']]
            )
            updated_count += 1
        except Exception as e:
            print(f"⛔️ ERROR: Failed to update ID: {item['id']} - {e}")
            
    return {
        "total_expected_rounds": len(expected_times),
        "total_scans_processed": len(data),
        "updated_count": updated_count,
        "status": "completed"
    }
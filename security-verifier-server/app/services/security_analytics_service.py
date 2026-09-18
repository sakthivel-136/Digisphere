from datetime import datetime
from reportlab.platypus import SimpleDocTemplate, Table, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4

from app.database import execute_d1_query


# ---------------- ROUND SPLIT LOGIC ---------------- #

def split_into_rounds(scans, gap_minutes=30):
    rounds = []
    current_round = []

    for scan in scans:
        scan_time_str = scan.get("scan_time")
        if not scan_time_str:
            continue
            
        scan_time = datetime.fromisoformat(scan_time_str.replace("Z", "+00:00")).replace(tzinfo=None)

        if not current_round:
            current_round.append(scan)
        else:
            last_time_str = current_round[-1].get("scan_time")
            last_time = datetime.fromisoformat(last_time_str.replace("Z", "+00:00")).replace(tzinfo=None)
            diff = (scan_time - last_time).total_seconds() / 60

            if diff > gap_minutes:
                rounds.append(current_round)
                current_round = [scan]
            else:
                current_round.append(scan)

    if current_round:
        rounds.append(current_round)

    return rounds


# ---------------- REQUIRED BY ROUTES ---------------- #
# (even if you don’t use it fully yet)

def update_all_scan_statuses():
    return {"status": "ok"}


# ---------------- REPORT DOWNLOAD SERVICE ---------------- #

def generate_report_download(payload):
    # 🔹 Factory
    factories = execute_d1_query(
        "SELECT factory_name, factory_address FROM factories WHERE factory_code = ?",
        [payload.factory_code]
    )

    if not factories:
        raise ValueError("Factory not found")

    factory = factories[0]

    # 🔹 Admin (Using login_info based on standard setup)
    admins = execute_d1_query(
        "SELECT name FROM login_info WHERE user_id = ?",
        [payload.downloaded_by]
    )

    admin_name = admins[0]["name"] if admins else "Admin"

    # 🔹 Scan logs
    # Note: Using guard_name, security_id, qr_name, lat, log based on updated schema
    scans = execute_d1_query(
        """
        SELECT 
            guard_name as employee_name,
            qr_name,
            lat as latitude,
            log as longitude,
            scan_time
        FROM scanning_details
        WHERE factory_code = ?
          AND scan_time >= ?
          AND scan_time <= ?
        ORDER BY scan_time
        """,
        [
            payload.factory_code,
            f"{payload.report_date}T00:00:00",
            f"{payload.report_date}T23:59:59"
        ]
    )

    if not scans:
        raise ValueError("No scan data found")

    rounds = split_into_rounds(scans)

    # 🔹 PDF Setup
    file_name = f"Security_Report_{payload.report_date}.pdf"
    file_path = f"/tmp/{file_name}"

    doc = SimpleDocTemplate(file_path, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    # 🔹 Header
    elements.append(Paragraph(f"<b>{factory['factory_name']}</b>", styles["Title"]))
    elements.append(Paragraph(factory["factory_address"], styles["Normal"]))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        f"<b>Security Patrol Report : {payload.report_date}</b>",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 20))

    # 🔹 Rounds
    for idx, round_scans in enumerate(rounds, start=1):
        start_time_str = round_scans[0]["scan_time"]
        end_time_str = round_scans[-1]["scan_time"]
        
        start_time = datetime.fromisoformat(start_time_str.replace("Z", "+00:00")).strftime("%I:%M %p")
        end_time = datetime.fromisoformat(end_time_str.replace("Z", "+00:00")).strftime("%I:%M %p")

        elements.append(Paragraph(
            f"S.No : {idx} | Date : {payload.report_date} "
            f"| Start Time : {start_time} | End Time : {end_time}",
            styles["Heading4"]
        ))
        elements.append(Spacer(1, 8))

        table_data = [[
            "Employee Name",
            "Patrol Time",
            "Location",
            "Latitude",
            "Longitude"
        ]]

        for s in round_scans:
            s_time = datetime.fromisoformat(s["scan_time"].replace("Z", "+00:00")).strftime("%I:%M %p")
            table_data.append([
                s.get("employee_name", "N/A"),
                s_time,
                s.get("qr_name", "N/A"),
                s.get("latitude", "N/A"),
                s.get("longitude", "N/A")
            ])

        elements.append(Table(table_data, repeatRows=1))
        elements.append(Spacer(1, 20))

    # 🔹 Footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(
        f"Downloaded By : <b>{admin_name}</b>",
        styles["Normal"]
    ))
    elements.append(Paragraph(
        f"Downloaded On : {datetime.now().strftime('%d-%b-%Y %I:%M %p')}",
        styles["Normal"]
    ))

    doc.build(elements)

    return file_path, file_name

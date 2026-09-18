import psycopg2

try:
    conn = psycopg2.connect("postgresql://postgres:pentagonsrm2025@db.iztwxujppgavovmbgkrm.supabase.co:6543/postgres")
    cursor = conn.cursor()
    
    # 1. Fetch factories
    cursor.execute("SELECT * FROM factories")
    factories = cursor.fetchall()
    print("=== FACTORIES ===")
    for f in factories:
        print(f)
        
    # 2. Fetch security_users
    cursor.execute("SELECT * FROM security_users")
    security_users = cursor.fetchall()
    print("\n=== SECURITY USERS ===")
    for u in security_users:
        print(u)
        
    # 3. Fetch scan_points
    cursor.execute("SELECT * FROM scan_points")
    scan_points = cursor.fetchall()
    print("\n=== SCAN POINTS ===")
    for s in scan_points:
        print(s)
        
    # 4. Fetch scanning_details
    cursor.execute("SELECT * FROM scanning_details")
    scanning_details = cursor.fetchall()
    print("\n=== SCANNING DETAILS ===")
    for sd in scanning_details:
        print(sd)
        
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)

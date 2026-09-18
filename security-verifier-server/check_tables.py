import psycopg2

try:
    conn = psycopg2.connect("postgresql://postgres:pentagonsrm2025@db.iztwxujppgavovmbgkrm.supabase.co:6543/postgres")
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    tables = cursor.fetchall()
    print("Tables in public schema:")
    for table in tables:
         print(f"- {table[0]}")
         
    cursor.close()
    conn.close()
except Exception as e:
    print("Error connecting or querying database:")
    print(e)

import os
import httpx
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# --------------------------------------------------
# ENV CONFIG
# --------------------------------------------------
CF_ACCOUNT_ID = os.getenv("CF_ACCOUNT_ID")
CF_DATABASE_ID = os.getenv("CF_DATABASE_ID")
CF_API_TOKEN = os.getenv("CF_API_TOKEN")

# Dummy check - in production you'd raise RuntimeError, 
# but we allow fallback/mock for initial startup if missing.
if not CF_ACCOUNT_ID or not CF_DATABASE_ID or not CF_API_TOKEN:
    logger.warning("Cloudflare D1 credentials missing. Database operations will fail.")

# --------------------------------------------------
# D1 EXECUTION LAYER
# --------------------------------------------------
def execute_d1_query(sql: str, params: Optional[List[Any]] = None) -> List[Dict]:
    """
    Executes a raw SQL query against Cloudflare D1 via the REST API.
    Returns the array of results (empty array if no results).
    """
    if not CF_ACCOUNT_ID or not CF_DATABASE_ID or not CF_API_TOKEN:
        raise RuntimeError("Cloudflare D1 environment variables are not configured.")

    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/d1/database/{CF_DATABASE_ID}/query"
    headers = {
        "Authorization": f"Bearer {CF_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # D1 API requires positional parameters (?)
    payload = {
        "sql": sql,
        "params": params or []
    }

    with httpx.Client(timeout=15.0) as client:
        response = client.post(url, headers=headers, json=payload)
        
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error(f"D1 API error: {response.text}")
            raise RuntimeError(f"Database query failed: {response.text}") from e

        data = response.json()

    if not data.get("success"):
        raise RuntimeError(f"D1 Query returned errors: {data.get('errors')}")

    # For queries, D1 returns results within data['result'][0]['results']
    results = data.get("result", [{}])[0].get("results", [])
    
    return results

# --------------------------------------------------
# TABLE NAMES
# --------------------------------------------------
SCANNING_TABLE = "scanning_details"
QR_TABLE = "qr"

# --------------------------------------------------
# GENERIC SQL HELPERS
# --------------------------------------------------
def insert_row(table: str, data: Dict[str, Any]) -> Dict:
    """
    Insert one row. Returns the inserted row (assuming D1 supports RETURNING).
    Note: Cloudflare D1 (SQLite) supports RETURNING clause.
    """
    keys = list(data.keys())
    values = list(data.values())
    placeholders = ", ".join(["?"] * len(values))
    columns = ", ".join(keys)
    
    sql = f"INSERT INTO {table} ({columns}) VALUES ({placeholders}) RETURNING *"
    res = execute_d1_query(sql, values)
    
    if not res:
        raise RuntimeError(f"Insert failed for {table}")
    
    return res[0]

def select_rows(
    table: str,
    filters: Optional[Dict[str, Any]] = None
) -> List[Dict]:
    """
    Select rows with optional equality filters
    """
    sql = f"SELECT * FROM {table}"
    params = []
    
    if filters:
        conditions = []
        for key, val in filters.items():
            conditions.append(f"{key} = ?")
            params.append(val)
        sql += " WHERE " + " AND ".join(conditions)
        
    return execute_d1_query(sql, params)

def update_row(
    table: str,
    filters: Dict[str, Any],
    data: Dict[str, Any]
) -> Dict:
    """
    Update rows using equality filters. Returns the first updated row via RETURNING.
    """
    if not data:
        raise ValueError("No data provided for update")
        
    set_clauses = []
    params = []
    for key, val in data.items():
        set_clauses.append(f"{key} = ?")
        params.append(val)
        
    where_clauses = []
    for key, val in filters.items():
        where_clauses.append(f"{key} = ?")
        params.append(val)
        
    sql = f"UPDATE {table} SET {', '.join(set_clauses)}"
    if where_clauses:
        sql += " WHERE " + " AND ".join(where_clauses)
    
    sql += " RETURNING *"
    
    res = execute_d1_query(sql, params)
    
    if not res:
        raise RuntimeError(f"Update failed for {table}")
        
    return res[0]

def delete_row(
    table: str,
    filters: Dict[str, Any]
) -> bool:
    """
    Delete rows using equality filters
    """
    sql = f"DELETE FROM {table}"
    params = []
    
    if filters:
        where_clauses = []
        for key, val in filters.items():
            where_clauses.append(f"{key} = ?")
            params.append(val)
        sql += " WHERE " + " AND ".join(where_clauses)
    
    sql += " RETURNING *"
    res = execute_d1_query(sql, params)
    
    return len(res) > 0

# --------------------------------------------------
# SCAN LOG HELPERS
# --------------------------------------------------
def create_scan_log(data: Dict[str, Any]) -> Dict:
    return insert_row(SCANNING_TABLE, data)

def get_all_scan_logs() -> List[Dict]:
    return select_rows(SCANNING_TABLE)

def get_scan_logs_by_factory(factory_code: str) -> List[Dict]:
    return select_rows(
        SCANNING_TABLE,
        {"factory_code": factory_code}
    )

def get_scan_logs_by_guard(guard_name: str) -> List[Dict]:
    return select_rows(
        SCANNING_TABLE,
        {"guard_name": guard_name}
    )

def delete_scan_log(scan_id: int) -> bool:
    return delete_row(
        SCANNING_TABLE,
        {"id": scan_id}
    )

# --------------------------------------------------
# QR HELPERS
# --------------------------------------------------
def create_qr(data: Dict[str, Any]) -> Dict:
    """
    Create a QR. Ensures waiting_time has a value.
    """
    if "waiting_time" not in data or data["waiting_time"] is None:
        data["waiting_time"] = 15

    return insert_row(QR_TABLE, data)

def get_qrs(filters: Optional[Dict[str, Any]] = None) -> List[Dict]:
    return select_rows(QR_TABLE, filters)

def get_qr_by_id(qr_id: int) -> Optional[Dict]:
    rows = select_rows(
        QR_TABLE,
        {"qr_id": qr_id}
    )
    return rows[0] if rows else None

def update_qr(qr_id: int, data: Dict[str, Any]) -> Dict:
    """
    Update a QR.
    """
    if "waiting_time" in data:
        if data["waiting_time"] is None:
            data["waiting_time"] = 15

    return update_row(
        QR_TABLE,
        {"qr_id": qr_id},
        data
    )

def delete_qr(qr_id: int) -> bool:
    return delete_row(
        QR_TABLE,
        {"qr_id": qr_id}
    )
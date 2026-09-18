# app/core/security.py

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import jwt
from app.config import SECRET_KEY, ALGORITHM

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Generate a JWT token with optional expiration.

    Args:
        data (dict): The payload to encode (e.g., {"user_id": "admin001", "role": "ADMIN"}).
        expires_delta (timedelta, optional): Token expiration. Defaults to 60 minutes.

    Returns:
        str: Encoded JWT token.
    """
    to_encode = data.copy()
    
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=60))
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


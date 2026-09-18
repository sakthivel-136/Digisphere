from datetime import datetime, timedelta
import pytz
from app.database import execute_d1_query

IST = pytz.timezone("Asia/Kolkata")
start_date = "2026-09-18"
end_date = "2026-09-18"
factory_code = "F1" # Need to know the factory code! What is it? 

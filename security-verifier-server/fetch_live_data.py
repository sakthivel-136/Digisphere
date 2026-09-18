import requests
import json

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic2FrdGhpIiwicm9sZSI6IkFETUlOIiwiZXhwIjoxNzg3OTkwMDM2fQ.GZy6oIX8QoUilEtEa76Uo0LCyWUtMzVl8J0GucZ0g_Y"
headers = {
    "Authorization": f"Bearer {token}"
}

base_url = "https://digisphere.onrender.com"

# 1. Fetch factories
print("Fetching factories...")
r = requests.get(f"{base_url}/factories", headers=headers)
factories = r.json()
print("FACTORIES:")
print(json.dumps(factories, indent=2))

# 2. Fetch security users
print("\nFetching security users...")
r = requests.get(f"{base_url}/security-users", headers=headers)
users = r.json()
print("SECURITY USERS:")
print(json.dumps(users, indent=2))

# 3. Fetch check points for each factory
print("\nFetching checkpoints...")
for f in factories:
    code = f["factory_code"]
    r = requests.get(f"{base_url}/qr/factory/{code}", headers=headers)
    qrs = r.json()
    print(f"CHECKPOINTS FOR {code}:")
    print(json.dumps(qrs, indent=2))

# 4. Fetch scanning details/reports for today
print("\nFetching reports for today...")
# Let's find some date with data or try today's date 2026-08-29
for f in factories:
    code = f["factory_code"]
    r = requests.get(f"{base_url}/report/download?factory_code={code}&report_date=2026-08-29", headers=headers)
    print(f"REPORT FOR {code} (2026-08-29):")
    print(json.dumps(r.json(), indent=2))

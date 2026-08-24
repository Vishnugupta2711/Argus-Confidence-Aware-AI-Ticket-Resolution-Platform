import requests

RES = requests.get("http://localhost:8005/api/tickets")
tickets = RES.json()
auto_tickets = [t for t in tickets if t["status"] == "auto_resolved"]

if auto_tickets:
    tid = auto_tickets[0]["id"]
    print(f"Escalating {tid}...")
    res = requests.post(f"http://localhost:8005/api/tickets/{tid}/escalate_user")
    print(res.status_code, res.text)
else:
    print("No auto_resolved tickets found.")

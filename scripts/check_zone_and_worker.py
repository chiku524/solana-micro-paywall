#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Quick script to check zone and worker service names"""

import os
import sys
import requests

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

API_BASE = "https://api.cloudflare.com/client/v4"
token = os.environ.get("CLOUDFLARE_API_TOKEN")
account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
zone_id = os.environ.get("CLOUDFLARE_ZONE_ID")

if not all([token, account_id, zone_id]):
    print("Missing environment variables")
    sys.exit(1)

# Check zone
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
resp = requests.get(f"{API_BASE}/zones/{zone_id}", headers=headers)
if resp.status_code == 200:
    zone = resp.json()["result"]
    print(f"Zone: {zone.get('name')} (Status: {zone.get('status')})")
else:
    print(f"Zone check failed: {resp.json()}")

# Check workers
resp = requests.get(f"{API_BASE}/accounts/{account_id}/workers/services", headers=headers)
if resp.status_code == 200:
    services = resp.json().get("result", [])
    print(f"\nWorkers Services:")
    for svc in services:
        print(f"  - {svc.get('id')} (default_environment: {svc.get('default_environment', {}).get('script_name')})")
else:
    print(f"Workers check failed: {resp.json()}")


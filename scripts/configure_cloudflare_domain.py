#!/usr/bin/env python3
"""
Configure Cloudflare DNS + custom domains for Workers and Pages.

Requirements:
  pip install requests

Environment variables (required):
  CLOUDFLARE_API_TOKEN  - API token with Zone:DNS:Edit, Workers Scripts:Edit, Pages:Edit
  CLOUDFLARE_ACCOUNT_ID - Cloudflare account ID
  CLOUDFLARE_ZONE_ID    - Zone ID for micropaywall.app
"""

import os
import sys
from typing import Optional, Tuple

# Fix Windows encoding issues
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import requests

API_BASE = "https://api.cloudflare.com/client/v4"
DOMAIN = "micropaywall.app"
API_SUBDOMAIN = "api.micropaywall.app"
PAGES_PROJECT = "micropaywall"
WORKER_SERVICE = "micropaywall-api-production"


def get_env_var(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        print(f"[ERROR] Environment variable {name} is required.", file=sys.stderr)
        sys.exit(1)
    return value


def cloudflare_request(
    method: str,
    endpoint: str,
    token: str,
    payload: Optional[dict] = None,
) -> Tuple[bool, dict]:
    url = f"{API_BASE}{endpoint}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    response = requests.request(method, url, headers=headers, json=payload)
    try:
        data = response.json()
    except ValueError:
        data = {"raw": response.text}
    success = response.status_code in (200, 201, 202)
    return success, data


def ensure_dns_record(
    zone_id: str,
    token: str,
    record_type: str,
    name: str,
    content: str,
    proxied: bool = True,
) -> None:
    print(f"[DNS] Ensuring {record_type} {name} -> {content}")
    
    # First, check if record exists
    success, data = cloudflare_request(
        "GET",
        f"/zones/{zone_id}/dns_records?type={record_type}&name={name}",
        token,
    )
    
    existing_record = None
    if success and data.get("result"):
        existing_record = data["result"][0]
    
    payload = {
        "type": record_type,
        "name": name,
        "content": content,
        "ttl": 120,
        "proxied": proxied,
    }
    
    if existing_record:
        # Update existing record
        record_id = existing_record["id"]
        print(f"  ↳ Updating existing record (ID: {record_id})")
        success, data = cloudflare_request(
            "PUT",
            f"/zones/{zone_id}/dns_records/{record_id}",
            token,
            payload,
        )
        if success:
            print("  ↳ Record updated successfully.")
        else:
            print(f"[ERROR] Failed to update DNS record: {data}")
    else:
        # Create new record
        success, data = cloudflare_request(
            "POST",
            f"/zones/{zone_id}/dns_records",
            token,
            payload,
        )
        if success:
            print("  ↳ Record created successfully.")
        else:
            errors = data.get("errors", [])
            if errors:
                code = errors[0].get("code")
                if code == 81057:  # record already exists
                    print(f"  ↳ Record already exists.")
                else:
                    print(f"[ERROR] Failed to create DNS record: {data}")
            else:
                print(f"[ERROR] Failed to create DNS record: {data}")


def bind_worker_custom_domain(
    account_id: str,
    token: str,
    hostname: str,
    service: str,
) -> None:
    print(f"[Workers] Binding custom domain {hostname} to {service}")
    
    # First, get the service to find its ID
    success, services_data = cloudflare_request(
        "GET",
        f"/accounts/{account_id}/workers/services",
        token,
    )
    
    if not success:
        print(f"[ERROR] Failed to fetch Workers services: {services_data}")
        return
    
    services = services_data.get("result", [])
    service_info = next((s for s in services if s.get("id") == service or service in s.get("id", "")), None)
    
    if not service_info:
        print(f"[WARNING] Worker service '{service}' not found. Available: {[s.get('id') for s in services]}")
        print(f"[INFO] Please configure Workers custom domain manually via dashboard:")
        print(f"      https://dash.cloudflare.com/{account_id}/workers/services/view/{service}/settings/triggers")
        return
    
    service_id = service_info.get("id")
    print(f"  ↳ Found service ID: {service_id}")
    
    # Try the new API endpoint format
    payload = {
        "hostname": hostname,
        "service": service_id,
        "environment": "production",
    }
    
    # Try different endpoint formats
    endpoints = [
        f"/accounts/{account_id}/workers/services/{service_id}/environments/production/domains",
        f"/accounts/{account_id}/workers/domains",
    ]
    
    configured = False
    for endpoint in endpoints:
        success, data = cloudflare_request("POST", endpoint, token, payload)
        if success:
            print("  ↳ Workers custom domain configured.")
            configured = True
            break
        else:
            errors = data.get("errors", [])
            if errors:
                code = errors[0].get("code")
                if code == 10038:
                    print("  ↳ Custom domain already exists.")
                    configured = True
                    break
    
    if not configured:
        print(f"[WARNING] Could not configure via API. Please configure manually:")
        print(f"      https://dash.cloudflare.com/{account_id}/workers/services/view/{service_id}/settings/triggers")


def bind_pages_custom_domain(
    account_id: str,
    token: str,
    project: str,
    domain: str,
) -> None:
    print(f"[Pages] Binding custom domain {domain} to project {project}")
    
    # Check if project exists first
    success, projects_data = cloudflare_request(
        "GET",
        f"/accounts/{account_id}/pages/projects",
        token,
    )
    
    if not success:
        print(f"[ERROR] Failed to fetch Pages projects: {projects_data}")
        return
    
    projects = projects_data.get("result", [])
    project_info = next((p for p in projects if p.get("name") == project), None)
    
    if not project_info:
        print(f"[WARNING] Pages project '{project}' not found. Available: {[p.get('name') for p in projects]}")
        print(f"[INFO] Please configure Pages custom domain manually via dashboard:")
        print(f"      https://dash.cloudflare.com/{account_id}/pages/view/{project}/domains")
        return
    
    payload = {"domain": domain}
    success, data = cloudflare_request(
        "POST",
        f"/accounts/{account_id}/pages/projects/{project}/domains",
        token,
        payload,
    )
    if success:
        print("  ↳ Pages custom domain configured.")
    else:
        errors = data.get("errors", [])
        if errors:
            code = errors[0].get("code")
            message = errors[0].get("message", "")
            if code == 8000003:
                print("  ↳ Domain already bound to project.")
            elif "invalid TLD" in message.lower():
                print(f"[WARNING] Domain validation issue. This may require manual configuration via dashboard:")
                print(f"      https://dash.cloudflare.com/{account_id}/pages/view/{project}/domains")
                print(f"      The domain may need to be verified first in the Cloudflare dashboard.")
            else:
                print(f"[ERROR] Failed to bind Pages domain: {data}")
                print(f"[INFO] Please configure manually via dashboard:")
                print(f"      https://dash.cloudflare.com/{account_id}/pages/view/{project}/domains")


def main() -> None:
    token = get_env_var("CLOUDFLARE_API_TOKEN")
    account_id = get_env_var("CLOUDFLARE_ACCOUNT_ID")
    zone_id = get_env_var("CLOUDFLARE_ZONE_ID")

    print("=== Cloudflare Domain Configuration ===")
    print(f"Account ID: {account_id}")
    print(f"Zone ID:    {zone_id}")
    print("")

    # DNS records
    # For Pages, point to the Pages subdomain
    ensure_dns_record(zone_id, token, "CNAME", DOMAIN, f"{PAGES_PROJECT}.pages.dev", proxied=True)
    # For Workers, the DNS will be handled automatically when we bind the custom domain
    # But we can create a CNAME pointing to the workers.dev subdomain as a fallback
    ensure_dns_record(zone_id, token, "CNAME", API_SUBDOMAIN, f"{WORKER_SERVICE}.{account_id}.workers.dev", proxied=True)

    # Custom domains
    bind_worker_custom_domain(account_id, token, API_SUBDOMAIN, WORKER_SERVICE)
    bind_pages_custom_domain(account_id, token, PAGES_PROJECT, DOMAIN)

    print("")
    print("✅ Configuration attempted. It may take a few minutes for DNS & SSL to propagate.")


if __name__ == "__main__":
    main()


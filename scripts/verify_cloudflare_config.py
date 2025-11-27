#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verify Cloudflare DNS and custom domain configuration.

Requirements:
  pip install requests

Environment variables (required):
  CLOUDFLARE_API_TOKEN  - API token with Zone:DNS:Read, Workers Scripts:Read, Pages:Read
  CLOUDFLARE_ACCOUNT_ID - Cloudflare account ID
  CLOUDFLARE_ZONE_ID    - Zone ID for micropaywall.app
"""

import os
import sys
from typing import Optional, Tuple, List, Dict

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
WORKER_SERVICE = "micropaywall-api"  # May also be "micropaywall-api-production" when deployed


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


def check_dns_records(zone_id: str, token: str) -> None:
    """Check DNS records for micropaywall.app and api.micropaywall.app"""
    print("\n📋 Checking DNS Records...")
    print("-" * 60)
    
    success, data = cloudflare_request(
        "GET",
        f"/zones/{zone_id}/dns_records",
        token,
    )
    
    if not success:
        print(f"❌ Failed to fetch DNS records: {data}")
        return
    
    records = data.get("result", [])
    
    # Check for root domain CNAME
    root_cname = next(
        (r for r in records if r.get("name") == DOMAIN and r.get("type") == "CNAME"),
        None
    )
    if root_cname:
        content = root_cname.get("content", "")
        proxied = root_cname.get("proxied", False)
        print(f"✅ {DOMAIN} CNAME: {content}")
        print(f"   Proxied: {proxied}")
        if "pages.dev" in content:
            print("   ✓ Points to Pages")
        else:
            print("   ⚠️  Should point to Pages (.pages.dev)")
    else:
        print(f"❌ {DOMAIN} CNAME not found")
    
    # Check for API subdomain CNAME
    api_cname = next(
        (r for r in records if r.get("name") == API_SUBDOMAIN and r.get("type") == "CNAME"),
        None
    )
    if api_cname:
        content = api_cname.get("content", "")
        proxied = api_cname.get("proxied", False)
        print(f"✅ {API_SUBDOMAIN} CNAME: {content}")
        print(f"   Proxied: {proxied}")
        if "workers.dev" in content:
            print("   ✓ Points to Workers")
        else:
            print("   ⚠️  Should point to Workers (.workers.dev)")
    else:
        print(f"❌ {API_SUBDOMAIN} CNAME not found")


def check_workers_custom_domain(account_id: str, token: str) -> None:
    """Check Workers custom domain configuration"""
    print("\n🔧 Checking Workers Custom Domain...")
    print("-" * 60)
    
    success, data = cloudflare_request(
        "GET",
        f"/accounts/{account_id}/workers/domains",
        token,
    )
    
    if not success:
        print(f"❌ Failed to fetch Workers domains: {data}")
        return
    
    domains = data.get("result", [])
    api_domain = next(
        (d for d in domains if d.get("hostname") == API_SUBDOMAIN),
        None
    )
    
    if api_domain:
        service = api_domain.get("service", "")
        environment = api_domain.get("environment", "")
        zone_id = api_domain.get("zone_id", "")
        print(f"✅ Custom domain configured: {API_SUBDOMAIN}")
        print(f"   Service: {service}")
        print(f"   Environment: {environment}")
        print(f"   Zone ID: {zone_id}")
        
        if WORKER_SERVICE in service or "micropaywall-api" in service:
            print("   ✓ Service name matches expected worker")
        else:
            print(f"   ⚠️  Service name '{service}' doesn't match expected '{WORKER_SERVICE}'")
    else:
        print(f"❌ Custom domain {API_SUBDOMAIN} not found for Workers")
        print(f"   Available domains: {[d.get('hostname') for d in domains]}")


def check_pages_custom_domain(account_id: str, token: str) -> None:
    """Check Pages custom domain configuration"""
    print("\n🌐 Checking Pages Custom Domain...")
    print("-" * 60)
    
    success, data = cloudflare_request(
        "GET",
        f"/accounts/{account_id}/pages/projects/{PAGES_PROJECT}/domains",
        token,
    )
    
    if not success:
        print(f"❌ Failed to fetch Pages domains: {data}")
        if "errors" in data:
            for error in data.get("errors", []):
                if error.get("code") == 10000:  # Project not found
                    print(f"   ⚠️  Pages project '{PAGES_PROJECT}' may not exist")
        return
    
    domains = data.get("result", [])
    root_domain = next(
        (d for d in domains if d.get("domain") == DOMAIN),
        None
    )
    
    if root_domain:
        domain_name = root_domain.get("domain", "")
        status = root_domain.get("status", "unknown")
        print(f"✅ Custom domain configured: {domain_name}")
        print(f"   Status: {status}")
        
        if status == "active":
            print("   ✓ Domain is active and ready")
        elif status == "pending":
            print("   ⏳ Domain is pending (SSL certificate provisioning)")
        else:
            print(f"   ⚠️  Domain status: {status}")
    else:
        print(f"❌ Custom domain {DOMAIN} not found for Pages project")
        print(f"   Available domains: {[d.get('domain') for d in domains]}")


def check_ssl_status(zone_id: str, token: str) -> None:
    """Check SSL/TLS certificate status"""
    print("\n🔒 Checking SSL/TLS Status...")
    print("-" * 60)
    
    success, data = cloudflare_request(
        "GET",
        f"/zones/{zone_id}/ssl/verification",
        token,
    )
    
    if not success:
        print(f"⚠️  Could not fetch SSL verification status: {data}")
        return
    
    verification = data.get("result", [])
    for item in verification:
        hostname = item.get("hostname", "")
        status = item.get("status", "")
        if DOMAIN in hostname or API_SUBDOMAIN in hostname:
            print(f"   {hostname}: {status}")
            if status == "active":
                print("      ✓ SSL certificate is active")
            else:
                print(f"      ⚠️  SSL status: {status}")


def test_endpoints() -> None:
    """Test if endpoints are accessible"""
    print("\n🌍 Testing Endpoints...")
    print("-" * 60)
    
    import urllib.request
    import ssl
    
    # Test root domain
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        req = urllib.request.Request(f"https://{DOMAIN}")
        with urllib.request.urlopen(req, timeout=10, context=ctx) as response:
            status = response.getcode()
            print(f"✅ {DOMAIN}: HTTP {status}")
    except Exception as e:
        print(f"❌ {DOMAIN}: {str(e)}")
    
    # Test API subdomain
    try:
        req = urllib.request.Request(f"https://{API_SUBDOMAIN}/health")
        with urllib.request.urlopen(req, timeout=10, context=ctx) as response:
            status = response.getcode()
            print(f"✅ {API_SUBDOMAIN}/health: HTTP {status}")
    except Exception as e:
        print(f"❌ {API_SUBDOMAIN}/health: {str(e)}")


def main() -> None:
    token = get_env_var("CLOUDFLARE_API_TOKEN")
    account_id = get_env_var("CLOUDFLARE_ACCOUNT_ID")
    zone_id = get_env_var("CLOUDFLARE_ZONE_ID")
    
    print("=" * 60)
    print("🔍 Cloudflare Configuration Verification")
    print("=" * 60)
    print(f"Account ID: {account_id}")
    print(f"Zone ID:    {zone_id}")
    print(f"Domain:     {DOMAIN}")
    print(f"API Domain: {API_SUBDOMAIN}")
    
    check_dns_records(zone_id, token)
    check_workers_custom_domain(account_id, token)
    check_pages_custom_domain(account_id, token)
    check_ssl_status(zone_id, token)
    test_endpoints()
    
    print("\n" + "=" * 60)
    print("✅ Verification complete!")
    print("=" * 60)
    print("\n📊 Dashboard Links:")
    print(f"   Workers: https://dash.cloudflare.com/{account_id}/workers/services/view/{WORKER_SERVICE}")
    print(f"   Pages:   https://dash.cloudflare.com/{account_id}/pages/view/{PAGES_PROJECT}")
    print(f"   DNS:     https://dash.cloudflare.com/{account_id}/dns/records")


if __name__ == "__main__":
    main()


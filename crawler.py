import os
import re
import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "https://camillemormal.com"
OUTPUT_DIR = "/Users/wuanngo/Profile"
STATIC_DIR = os.path.join(OUTPUT_DIR, "static")

os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(os.path.join(OUTPUT_DIR, "data"), exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

ROUTES = [
    "/",
    "/about",
    "/gucci",
    "/samsung",
    "/rituals",
    "/moco",
    "/sennheiser",
    "/swarovski",
    "/activia",
    "/saeco"
]

all_asset_urls = set()

# 1. Base static assets
base_static = [
    "/static/font/s.woff2",
    "/static/css/d.css",
    "/static/css/m.css",
    "/static/js/d.js",
    "/static/js/m.js",
    "/static/fav/fav.ico",
    "/static/fav/fav.svg",
    "/static/fav/apple-touch.png",
    "/static/fav/manifest.json",
    "/static/og/1200-630.png",
]
all_asset_urls.update(base_static)

# 2. Fetch and save HTML shells for all routes
print("Fetching HTML shells for all routes...")
html_shells = {}
for r in ROUTES:
    url = BASE_URL + (r if r != "/" else "")
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode("utf-8")
            html_shells[r] = content
            # save html file
            if r == "/":
                save_path = os.path.join(OUTPUT_DIR, "index.html")
            else:
                route_dir = os.path.join(OUTPUT_DIR, r.lstrip("/"))
                os.makedirs(route_dir, exist_ok=True)
                save_path = os.path.join(route_dir, "index.html")
            with open(save_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Saved HTML shell for {r} -> {save_path}")
    except Exception as e:
        print(f"Error fetching HTML for {r}: {e}")

# 3. Fetch and save all JSON data for all devices and webp settings for each route
print("\nFetching JSON payloads...")
api_payloads = {}
for r in ROUTES:
    for device in ["d", "m"]:
        for webp in ["false", "true"]:
            suburl = f"{r}?webp={webp}&device={device}" if r != "/" else f"/?webp={webp}&device={device}"
            full_url = BASE_URL + suburl
            key = f"{r.strip('/') or 'home'}_{device}_{webp}"
            try:
                req = urllib.request.Request(full_url, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=10) as resp:
                    raw_data = resp.read()
                    data = json.loads(raw_data.decode("utf-8"))
                    api_payloads[key] = data
                    
                    # save json
                    json_path = os.path.join(OUTPUT_DIR, "data", f"{key}.json")
                    with open(json_path, "wb") as f:
                        f.write(raw_data)
                    
                    # Extract assets from cache HTML
                    for page, item in data.get("cache", {}).items():
                        html = item.get("html", "") if isinstance(item, dict) else str(item)
                        for match in re.findall(r'(/static/[^\s\"\'\?]+)', html):
                            all_asset_urls.add(match)
                    
                    # Extract assets from body HTML
                    body = data.get("body", "")
                    for match in re.findall(r'(/static/[^\s\"\'\?]+)', body):
                        all_asset_urls.add(match)
                        
                    # Extract assets from data textures
                    for page, tdata in data.get("data", {}).items():
                        for tex in tdata.get("tex", []):
                            all_asset_urls.add(tex + ".jpg")
                            all_asset_urls.add(tex + ".webp")
            except Exception as e:
                print(f"Error fetching API for {suburl}: {e}")

print(f"\nTotal assets to download: {len(all_asset_urls)}")

# 4. Download all assets in parallel
def download_asset(rel_url):
    rel_path = rel_url.lstrip("/")
    local_path = os.path.join(OUTPUT_DIR, rel_path)
    if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
        return rel_url, "already_exists", 0
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    
    remote_url = BASE_URL + rel_url
    req = urllib.request.Request(remote_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            with open(local_path, "wb") as f:
                f.write(data)
            return rel_url, "ok", len(data)
    except Exception as e:
        return rel_url, f"error: {e}", 0

print("Downloading assets concurrently...")
success_count = 0
failed = []
with ThreadPoolExecutor(max_workers=16) as executor:
    futures = {executor.submit(download_asset, url): url for url in all_asset_urls}
    for future in as_completed(futures):
        url, status, size = future.result()
        if "ok" in status or "already_exists" in status:
            success_count += 1
            if success_count % 50 == 0 or success_count == len(all_asset_urls):
                print(f"Downloaded {success_count}/{len(all_asset_urls)} assets...")
        else:
            failed.append((url, status))

print(f"\nDownload finished. Success: {success_count}/{len(all_asset_urls)}")
if failed:
    print(f"Failed ({len(failed)}):", failed[:10])

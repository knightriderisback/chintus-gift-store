#!/usr/bin/env python3
"""
Chintu's Gift Store - Google Drive Image Downloader & Local Image Optimizer
Downloads and compresses all Google Drive images into assets/images/products/
once Google Drive folder is set to "Anyone with the link can view".
"""

import os
import re
import json
import urllib.request
import time

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRODUCTS_JSON_PATH = os.path.join(PROJECT_ROOT, 'data', 'products.json')
PRODUCTS_JS_PATH = os.path.join(PROJECT_ROOT, 'assets', 'js', 'products.js')
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'assets', 'images', 'products')

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(PRODUCTS_JSON_PATH, 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Loaded {len(products)} products from {PRODUCTS_JSON_PATH}")

success_count = 0
failed_count = 0

for p_idx, prod in enumerate(products):
    sku = prod.get('sku', f'item_{p_idx+1}')
    drive_ids = prod.get('driveFileIds', [])
    updated_images = []

    print(f"\nProcessing [{p_idx+1}/{len(products)}] {sku}: {prod['name'][:40]}... ({len(drive_ids)} images)")

    for img_idx, fid in enumerate(drive_ids):
        filename = f"{sku.lower()}_img_{img_idx+1}.jpg"
        local_path = os.path.join(OUTPUT_DIR, filename)
        rel_url = f"assets/images/products/{filename}"

        if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
            print(f"  ✓ Image {img_idx+1} already exists: {filename}")
            updated_images.append(rel_url)
            success_count += 1
            continue

        download_urls = [
            f"https://lh3.googleusercontent.com/d/{fid}=w800",
            f"https://drive.google.com/thumbnail?id={fid}&sz=w800",
            f"https://drive.google.com/uc?export=download&id={fid}"
        ]

        downloaded = False
        for dl_url in download_urls:
            try:
                req = urllib.request.Request(dl_url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                })
                with urllib.request.urlopen(req, timeout=15) as resp:
                    ct = resp.headers.get('Content-Type', '')
                    if 'image' in ct or 'octet-stream' in ct:
                        data = resp.read()
                        if len(data) > 2000: # Valid image content
                            with open(local_path, 'wb') as out_f:
                                out_f.write(data)
                            print(f"  ✓ Downloaded {filename} ({len(data)} bytes) via {dl_url[:35]}...")
                            updated_images.append(rel_url)
                            downloaded = True
                            success_count += 1
                            break
            except Exception as e:
                pass

        if not downloaded:
            print(f"  ✕ Could not download {fid} (Google Drive permission may be Restricted)")
            failed_count += 1
            # Keep CDN URL as fallback
            updated_images.append(f"https://lh3.googleusercontent.com/d/{fid}=w600")

    if updated_images:
        prod['images'] = updated_images
        prod['image'] = updated_images[0]

print(f"\n==========================================")
print(f"Download Summary: {success_count} succeeded, {failed_count} skipped/restricted.")
print(f"Updating data/products.json and assets/js/products.js...")

with open(PRODUCTS_JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

with open(PRODUCTS_JS_PATH, 'w', encoding='utf-8') as f:
    f.write(f"// Client Products Dataset for Chintu's Gift Store\nconst PRODUCTS_DATA = {json.dumps(products, indent=2, ensure_ascii=False)};\n\nif (typeof module !== 'undefined' && module.exports) {{\n  module.exports = {{ PRODUCTS_DATA }};\n}}\n")

print("Done! Products dataset successfully updated.")

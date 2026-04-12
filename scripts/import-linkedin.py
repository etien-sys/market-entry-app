#!/usr/bin/env python3
"""
Enrich LinkedIn connections CSV with org type, industry, and location
using Claude AI, then write results to:
  - public/contacts.json   (feeds the live app — both public map and admin view)
  - /tmp/enriched-contacts.csv  (for manual review)

Usage:
  ANTHROPIC_API_KEY=sk-ant-... python3 scripts/import-linkedin.py [/path/to/linkedin.csv]

Input:  /tmp/linkedin_connections.csv  (LinkedIn export format)
        or the first positional argument
Output: public/contacts.json + /tmp/enriched-contacts.csv
"""

import csv, json, os, sys, time
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

INPUT_CSV  = sys.argv[1] if len(sys.argv) > 1 else '/tmp/linkedin_connections.csv'
REPO_ROOT  = Path(__file__).resolve().parent.parent
OUTPUT_JSON = REPO_ROOT / 'public' / 'contacts.json'
OUTPUT_CSV  = '/tmp/enriched-contacts.csv'
BATCH_SIZE  = 30
MODEL       = 'claude-haiku-4-5-20251001'

ANTHROPIC_KEY = os.environ.get('ANTHROPIC_API_KEY')
if not ANTHROPIC_KEY:
    raise SystemExit('Error: ANTHROPIC_API_KEY not set')

# Must match the exact org type strings used in Admin.jsx / marketFilter.js
ORG_TYPES = [
    'Investor',
    'Family Office',
    'High-Net-Worth Individual',
    'Product Startup',
    'Product Scaleup',
    'Corporation',
    'Bank',
    'Media',
    'Event Organizer',
    'Service Provider',
    'Accelerator/ Incubator',
    'NGO',
    'Policymaker/ Public Sector Agency',
    'Research',
    'Other',
]

PAID_KEYWORDS = ['investor', 'family office', 'high-net-worth']

def parse_tier(org_type):
    lower = (org_type or '').lower()
    return 'paid' if any(k in lower for k in PAID_KEYWORDS) else 'free'

# ── Read CSV ──────────────────────────────────────────────────────────────────

print(f'Reading {INPUT_CSV}…')
rows = []
with open(INPUT_CSV, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for r in reader:
        company = r.get('Company', '').strip()
        if not company:
            continue
        rows.append({
            'first_name':   r.get('First Name', '').strip(),
            'last_name':    r.get('Last Name', '').strip(),
            'url':          r.get('URL', '').strip(),
            'email':        r.get('Email Address', '').strip(),
            'company':      company,
            'position':     r.get('Position', '').strip(),
            'connected_on': r.get('Connected On', '').strip(),
        })

print(f'  {len(rows)} rows with a company name')

# ── Claude enrichment ─────────────────────────────────────────────────────────

import anthropic
client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

SYSTEM = f"""You are a B2B data enrichment assistant.
Given a list of people with their company and job title, classify each one.
Return ONLY valid JSON — an array matching the input order, no markdown fences.

For each item return:
{{
  "orgType":    one of {json.dumps(ORG_TYPES)},
  "industry":   short industry label (e.g. "Fintech", "SaaS", "Healthcare", "Real Estate", "Media"),
  "location":   best-guess country (e.g. "UAE", "UK", "Bulgaria", "Germany") — use "" if truly unknown,
  "confidence": "high" | "medium" | "low"
}}

Rules:
- Use "Product Startup" for early-stage companies, "Product Scaleup" for growth-stage ones
- Use "Investor" for VCs, PE firms, angel investors; "Family Office" for family-owned investment vehicles
- Use "Corporation" for large enterprises; "Bank" for financial institutions
- Infer location from company HQ or person's likely base — company name or well-known brand often gives it away
- confidence "high" = you're certain; "medium" = reasonable guess; "low" = very uncertain"""

def enrich_batch(batch):
    items = [{'i': i, 'company': c['company'], 'position': c['position']}
             for i, c in enumerate(batch)]
    msg = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=SYSTEM,
        messages=[{'role': 'user', 'content': json.dumps(items, ensure_ascii=False)}],
    )
    text = msg.content[0].text.strip()
    if text.startswith('```'):
        text = text.split('\n', 1)[1].rsplit('```', 1)[0].strip()
    results = json.loads(text)
    if len(results) != len(batch):
        raise ValueError(f'Got {len(results)} results for {len(batch)} inputs')
    return results

enriched = []
total_batches = (len(rows) + BATCH_SIZE - 1) // BATCH_SIZE
print(f'\nEnriching {len(rows)} contacts in {total_batches} batches of {BATCH_SIZE}…')

for batch_num, start in enumerate(range(0, len(rows), BATCH_SIZE), 1):
    batch = rows[start:start + BATCH_SIZE]
    print(f'  Batch {batch_num}/{total_batches}  ({start + 1}–{start + len(batch)})…', end=' ', flush=True)

    retries = 0
    while True:
        try:
            results = enrich_batch(batch)
            break
        except (json.JSONDecodeError, ValueError) as e:
            retries += 1
            if retries >= 3:
                print(f'FAILED ({e}) — using blanks')
                results = [{'orgType': 'Other', 'industry': '', 'location': '', 'confidence': 'low'}] * len(batch)
                break
            print(f'retry {retries}…', end=' ', flush=True)
            time.sleep(2)
        except Exception as e:
            retries += 1
            if retries >= 5:
                raise
            wait = 2 ** retries
            print(f'error ({e}), waiting {wait}s…', end=' ', flush=True)
            time.sleep(wait)

    for contact, result in zip(batch, results):
        enriched.append({**contact, **result})
    print('done')

# ── Write enriched CSV (for review) ──────────────────────────────────────────

CSV_FIELDS = ['first_name', 'last_name', 'company', 'position', 'url', 'email',
              'orgType', 'industry', 'location', 'confidence', 'connected_on']

print(f'\nWriting review CSV → {OUTPUT_CSV}…')
with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=CSV_FIELDS, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(enriched)

# ── Write public/contacts.json (feeds the app) ────────────────────────────────

def to_contact(c):
    name = f"{c['first_name']} {c['last_name']}".strip() or c['company']
    org_type = c.get('orgType', 'Other')
    notes_parts = [
        'LinkedIn connection',
        c['connected_on'] and f"Connected: {c['connected_on']}",
    ]
    return {
        'name':     name,
        'role':     c['position'],
        'company':  c['company'],
        'basedIn':  c.get('location', ''),
        'orgType':  org_type,
        'industry': c.get('industry', ''),
        'website':  c['url'],
        'contact':  c['email'],
        'notes':    ' · '.join(p for p in notes_parts if p),
        'tier':     parse_tier(org_type),
        'source':   'linkedin',
        'confidence': c.get('confidence', 'low'),
    }

contacts_json = [to_contact(c) for c in enriched]

OUTPUT_JSON.parent.mkdir(exist_ok=True)
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(contacts_json, f, ensure_ascii=False, separators=(',', ':'))

size_kb = OUTPUT_JSON.stat().st_size / 1024
print(f'Writing app JSON → {OUTPUT_JSON}  ({len(contacts_json)} contacts, {size_kb:.0f} KB)')
print('\nDone. Commit public/contacts.json to deploy to the app.')

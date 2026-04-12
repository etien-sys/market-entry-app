#!/usr/bin/env python3
"""
Enrich LinkedIn connections CSV with org type, industry, and location
using Claude AI, then write results to enriched-contacts.csv.

Optionally push to Notion contacts DB (disabled by default).

Usage:
  ANTHROPIC_API_KEY=sk-ant-... python3 scripts/import-linkedin.py
  ANTHROPIC_API_KEY=... NOTION_API_KEY=... python3 scripts/import-linkedin.py --push-notion

Input:  /tmp/linkedin_connections.csv  (LinkedIn export format)
Output: /tmp/enriched-contacts.csv
"""

import csv, json, os, sys, time, urllib.request, urllib.error
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

INPUT_CSV   = '/tmp/linkedin_connections.csv'
OUTPUT_CSV  = '/tmp/enriched-contacts.csv'
BATCH_SIZE  = 30       # contacts per Claude call
PUSH_NOTION = '--push-notion' in sys.argv
MODEL       = 'claude-haiku-4-5-20251001'   # fast + cheap for classification

ANTHROPIC_KEY = os.environ.get('ANTHROPIC_API_KEY')
NOTION_KEY    = os.environ.get('NOTION_API_KEY')
CONTACTS_DB   = '2f19a7b410ae8060bc56c9b96da24234'

ORG_TYPES = ['Startup', 'SME', 'Enterprise', 'VC / PE Fund', 'Angel Investor',
             'Accelerator / Incubator', 'Government / Public sector',
             'NGO / Non-profit', 'Consulting / Agency', 'Media', 'Other']

# ── Guards ────────────────────────────────────────────────────────────────────

if not ANTHROPIC_KEY:
    raise SystemExit('Error: ANTHROPIC_API_KEY not set')
if PUSH_NOTION and not NOTION_KEY:
    raise SystemExit('Error: --push-notion requires NOTION_API_KEY')

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
            'first_name':  r.get('First Name', '').strip(),
            'last_name':   r.get('Last Name', '').strip(),
            'url':         r.get('URL', '').strip(),
            'email':       r.get('Email Address', '').strip(),
            'company':     company,
            'position':    r.get('Position', '').strip(),
            'connected_on': r.get('Connected On', '').strip(),
        })

print(f'  {len(rows)} rows with a company name')

# ── Claude enrichment ─────────────────────────────────────────────────────────

import anthropic
client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

SYSTEM = f"""You are a B2B data enrichment assistant.
Given a list of companies and job titles, classify each one.
Return ONLY valid JSON — an array matching the input order.

For each item return:
{{
  "orgType":    one of {json.dumps(ORG_TYPES)},
  "industry":   short industry label (e.g. "Fintech", "SaaS", "Healthcare", "Real Estate"),
  "location":   best-guess country or city (e.g. "UAE", "UK", "Sofia, Bulgaria") — use "" if truly unknown,
  "confidence": "high" | "medium" | "low"
}}
Return nothing else — no markdown, no explanation."""

def enrich_batch(batch):
    """Call Claude once for a batch of contacts. Returns list of dicts."""
    items = [{'i': i, 'company': c['company'], 'position': c['position']}
             for i, c in enumerate(batch)]
    user_msg = json.dumps(items, ensure_ascii=False)

    msg = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=SYSTEM,
        messages=[{'role': 'user', 'content': user_msg}],
    )
    text = msg.content[0].text.strip()
    # Strip markdown fences if Claude added them
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
                results = [{'orgType': '', 'industry': '', 'location': '', 'confidence': 'low'}] * len(batch)
                break
            print(f'retry {retries}…', end=' ', flush=True)
            time.sleep(2)
        except Exception as e:
            # Rate limit or network — back off
            retries += 1
            if retries >= 5:
                raise
            wait = 2 ** retries
            print(f'error ({e}), waiting {wait}s…', end=' ', flush=True)
            time.sleep(wait)

    for contact, result in zip(batch, results):
        enriched.append({**contact, **result})
    print('done')

# ── Write output CSV ──────────────────────────────────────────────────────────

FIELDS = ['first_name', 'last_name', 'company', 'position', 'url', 'email',
          'orgType', 'industry', 'location', 'confidence', 'connected_on']

print(f'\nWriting {OUTPUT_CSV}…')
with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=FIELDS, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(enriched)

print(f'  Done — {len(enriched)} contacts written')

# ── Optional Notion push ──────────────────────────────────────────────────────

if not PUSH_NOTION:
    print('\nNotion push skipped. Run with --push-notion to upload.')
    sys.exit(0)

print(f'\nPushing to Notion contacts DB…')

def notion_request(method, path, body=None):
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        f'https://api.notion.com/v1{path}',
        data=data,
        headers={
            'Authorization': f'Bearer {NOTION_KEY}',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f'Notion API error {e.code}: {e.read().decode()}')

# Fetch existing company names to avoid duplicates
existing = set()
cursor = None
while True:
    query_body = {'page_size': 100}
    if cursor:
        query_body['start_cursor'] = cursor
    res = notion_request('POST', f'/databases/{CONTACTS_DB}/query', query_body)
    for page in res.get('results', []):
        props = page.get('properties', {})
        title_prop = props.get('Company name') or props.get('Name') or {}
        title_list = title_prop.get('title', [])
        if title_list:
            existing.add(title_list[0].get('plain_text', '').lower().strip())
    if not res.get('has_more'):
        break
    cursor = res.get('next_cursor')

print(f'  {len(existing)} existing companies found — will skip duplicates')

added = skipped = errors = 0
for c in enriched:
    key = c['company'].lower().strip()
    if key in existing:
        skipped += 1
        continue

    name = f"{c['first_name']} {c['last_name']}".strip()
    properties = {
        'Company name': {'title': [{'text': {'content': c['company']}}]},
    }
    if name:
        properties['Contact person'] = {'rich_text': [{'text': {'content': name}}]}
    if c.get('url'):
        properties['LinkedIn URL'] = {'url': c['url']}
    if c.get('orgType'):
        properties['Org type'] = {'select': {'name': c['orgType']}}
    if c.get('industry'):
        properties['Industry'] = {'multi_select': [{'name': c['industry']}]}
    if c.get('location'):
        properties['Based in'] = {'rich_text': [{'text': {'content': c['location']}}]}

    try:
        notion_request('POST', '/pages', {
            'parent': {'database_id': CONTACTS_DB},
            'properties': properties,
        })
        existing.add(key)
        added += 1
        if added % 50 == 0:
            print(f'  {added} added…')
        time.sleep(0.35)   # Notion rate limit: ~3 req/s
    except SystemExit as e:
        print(f'  Error for {c["company"]}: {e}')
        errors += 1

print(f'\nDone — {added} added, {skipped} skipped (duplicate), {errors} errors')

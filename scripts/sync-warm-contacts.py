#!/usr/bin/env python3
"""Sync warm contacts from Notion CRM database into public/contacts.json.

Mirrors the same pattern as sync-events.py.
Replaces all 'notion-warm' source entries; preserves everything else.
Also propagates connection=warm to existing contacts at the same company.

Usage:  NOTION_API_KEY=... python3 scripts/sync-warm-contacts.py
DB:     https://www.notion.so/2889a7b410ae81f39a23c065ab103614
"""

import json, os, sys, urllib.request, urllib.error
from pathlib import Path

KEY = os.environ.get('NOTION_API_KEY')
DB  = '2889a7b410ae81f39a23c065ab103614'
OUTPUT = Path(__file__).resolve().parent.parent / 'public' / 'contacts.json'

if not KEY:
    raise SystemExit('Error: NOTION_API_KEY not set')

PAID = {'Investor', 'Family Office', 'High-Net-Worth Individual'}


def notion_post(path, body=None):
    data = json.dumps(body or {}).encode()
    req = urllib.request.Request(
        f'https://api.notion.com/v1{path}',
        data=data,
        headers={
            'Authorization': f'Bearer {KEY}',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        print(f'Notion API error {e.code}: {body_text}', file=sys.stderr)
        if e.code in (401, 403):
            print('→ Ensure the integration is connected to this database in Notion.', file=sys.stderr)
        raise SystemExit(1)


def notion_get(path):
    req = urllib.request.Request(
        f'https://api.notion.com/v1{path}',
        headers={
            'Authorization': f'Bearer {KEY}',
            'Notion-Version': '2022-06-28',
        },
        method='GET',
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        print(f'Notion API error {e.code}: {body_text}', file=sys.stderr)
        raise SystemExit(1)


def extract(prop):
    """Extract plain text from any Notion property."""
    if not prop:
        return ''
    t = prop.get('type', '')
    if t == 'title':        return ''.join(x['plain_text'] for x in prop.get('title', []))
    if t == 'rich_text':    return ''.join(x['plain_text'] for x in prop.get('rich_text', []))
    if t == 'url':          return prop.get('url') or ''
    if t == 'email':        return prop.get('email') or ''
    if t == 'phone_number': return prop.get('phone_number') or ''
    if t == 'select':       return (prop.get('select') or {}).get('name', '')
    if t == 'multi_select': return ', '.join(s['name'] for s in prop.get('multi_select', []))
    if t == 'people':       return '; '.join(p.get('name', '') for p in prop.get('people', []))
    if t == 'formula':
        f = prop.get('formula', {})
        return f.get('string') or ''
    return ''


def find(props, *names):
    """Find first matching property (case-insensitive)."""
    lower = {k.lower(): v for k, v in props.items()}
    for n in names:
        v = lower.get(n.lower())
        if v is not None:
            return v
    return {}


# ── Discover schema ───────────────────────────────────────────────────────────

print(f'Fetching schema for DB {DB}…')
schema = notion_get(f'/databases/{DB}')
prop_names = list(schema.get('properties', {}).keys())
print(f'  Properties found: {prop_names}')

# ── Fetch all pages ───────────────────────────────────────────────────────────

print('Fetching pages…')
pages, cursor = [], None
while True:
    body = {'page_size': 100}
    if cursor:
        body['start_cursor'] = cursor
    res = notion_post(f'/databases/{DB}/query', body)
    pages.extend(res.get('results', []))
    if not res.get('has_more'):
        break
    cursor = res['next_cursor']
    print(f'  {len(pages)} pages…', end='\r', flush=True)

print(f'  {len(pages)} pages fetched')

# ── Parse pages ───────────────────────────────────────────────────────────────

warm_contacts = []
skipped = 0

for page in pages:
    p = page['properties']

    # Company name: first look for 'title' type property (Notion always has one)
    company = ''
    for prop in p.values():
        if prop.get('type') == 'title':
            company = extract(prop).strip()
            break
    if not company:
        # Fallback: look by common names
        company = extract(find(p, 'Company', 'Company name', 'Name', 'Organization')).strip()

    if not company:
        skipped += 1
        continue

    # All other fields — try user-described names first, then common aliases
    industry     = extract(find(p, 'Industry', 'Sector', 'Vertical')).strip()
    based_in     = extract(find(p, 'Market', 'Based In', 'Based in', 'Location', 'Country', 'Region', 'Geography')).strip()
    email        = extract(find(p, 'Email', 'Email Address', 'Contact Email', 'Associated Contact')).strip()
    person       = extract(find(p, 'Person', 'Contact', 'Contact Name', 'Point of Contact', 'Associated Contact')).strip()
    introduced   = extract(find(p, 'Lead Owner', 'Owner', 'Introduced By', 'Introducer', 'Company owner', 'Relationship Owner')).strip()
    website      = extract(find(p, 'Website', 'Website URL', 'URL', 'LinkedIn URL', 'LinkedIn')).strip()
    org_type     = extract(find(p, 'Organization Type', 'Org Type', 'Type', 'Category', 'Company Type')).strip()
    notes_raw    = extract(find(p, 'Notes', 'Description', 'Comment', 'Details')).strip()

    # Build notes
    notes_parts = []
    if notes_raw:
        notes_parts.append(notes_raw)
    if introduced:
        notes_parts.append(f'Intro: {introduced}')

    # If person is the same as an email address, clear it
    if '@' in person:
        email = email or person
        person = ''

    tier = 'paid' if org_type in PAID else 'free'

    warm_contacts.append({
        'name':         person or company,
        'role':         person and company or '',
        'company':      company,
        'basedIn':      based_in,
        'orgType':      org_type,
        'industry':     industry,
        'website':      website,
        'contact':      email,
        'notes':        ' · '.join(notes_parts),
        'tier':         tier,
        'source':       'notion-warm',
        'connection':   'warm',
        'introducedBy': introduced,
        'confidence':   'high',
    })

print(f'  {len(warm_contacts)} warm contacts parsed ({skipped} skipped — no name)')

# ── Merge into contacts.json ──────────────────────────────────────────────────

existing = []
if OUTPUT.exists():
    try:
        existing = json.loads(OUTPUT.read_text())
    except Exception:
        pass

# Replace old notion-warm entries (full refresh)
non_warm = [c for c in existing if c.get('source') != 'notion-warm']

# Propagate warm badge to any existing contact at the same company
warm_cos = {c['company'].lower().strip() for c in warm_contacts}
marked = 0
for c in non_warm:
    if (c.get('company') or '').lower().strip() in warm_cos and not c.get('connection'):
        c['connection'] = 'warm'
        marked += 1

print(f'  Marked {marked} existing contacts at warm companies as warm')

merged = non_warm + warm_contacts
for i, c in enumerate(merged):
    c['id'] = i

OUTPUT.write_text(json.dumps(merged, ensure_ascii=False, separators=(',', ':')))
print(f'contacts.json updated: {len(merged)} total ({len(warm_contacts)} warm contacts added)')
print('Done.')

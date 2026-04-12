#!/usr/bin/env python3
"""Sync warm contacts from Notion CRM database into public/contacts.json.

Replaces all existing 'notion-warm' source entries with fresh data, then
preserves everything else (linkedin, events, notion, etc.).

Also marks any matching existing contacts (by company name) as connection=warm
so warm badges appear on LinkedIn-sourced entries too.

Usage:
  NOTION_API_KEY=sk-... python3 scripts/sync-warm-contacts.py

Database: https://www.notion.so/2889a7b410ae81f39a23c065ab103614
Properties expected:
  Name / Company  → company + name
  Industry        → industry
  Market          → basedIn
  Email           → contact (email)
  Person          → role / contact person name
  Lead Owner      → introducedBy (person who owns the relationship)
  (any Connection/Warmth property is forced to "warm")
"""

import json, os, sys, urllib.request, urllib.error
from pathlib import Path

KEY = os.environ.get('NOTION_API_KEY')
if not KEY:
    sys.exit('Error: NOTION_API_KEY not set')

DB_ID  = '2889a7b410ae81f39a23c065ab103614'
OUTPUT = Path(__file__).resolve().parent.parent / 'public' / 'contacts.json'

PAID_TYPES = {'Investor', 'Family Office', 'High-Net-Worth Individual'}


# ── Notion helpers ─────────────────────────────────────────────────────────────

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
        raise SystemExit(f'Notion API error {e.code}: {e.read().decode()}')


def extract(prop):
    """Extract a plain string value from any Notion property type."""
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
    if t == 'people':       return ', '.join(p.get('name', '') for p in prop.get('people', []))
    if t == 'relation':     return ''  # skip relations
    if t == 'formula':
        f = prop.get('formula', {})
        return f.get('string') or str(f.get('number', '')) or ''
    return ''


def first_email(prop):
    """Return first email found in an email or rich_text property."""
    raw = extract(prop)
    if not raw:
        return ''
    # could be "Name (email@x.com); ..." format from old sync
    for part in raw.replace(';', ',').split(','):
        part = part.strip()
        if '@' in part:
            # strip surrounding parens if present
            if '(' in part and ')' in part:
                part = part[part.index('(') + 1:part.index(')')]
            return part.strip()
    return raw


# ── Fetch all pages from the warm contacts database ───────────────────────────

print(f'Fetching warm contacts from Notion DB {DB_ID}…')
pages, cursor = [], None
while True:
    body = {'page_size': 100}
    if cursor:
        body['start_cursor'] = cursor
    res = notion_post(f'/databases/{DB_ID}/query', body)
    pages.extend(res.get('results', []))
    if not res.get('has_more'):
        break
    cursor = res['next_cursor']
    print(f'  {len(pages)} pages so far…', end='\r', flush=True)

print(f'  {len(pages)} pages fetched')

# ── Discover property names (print on first run to help debugging) ─────────────

if pages:
    sample_props = list(pages[0]['properties'].keys())
    print(f'  Property names: {sample_props}')


# ── Map each Notion page → contact record ─────────────────────────────────────

def find_prop(props, *candidates):
    """Return first property that exists, case-insensitive."""
    lower_map = {k.lower(): k for k in props}
    for c in candidates:
        key = lower_map.get(c.lower())
        if key:
            return props[key]
    return {}


warm_contacts = []
skipped = 0
for page in pages:
    p = page['properties']

    # Company / Name (try several common property names)
    company = (
        extract(find_prop(p, 'Company', 'Company name', 'Organization', 'Name'))
        or extract(find_prop(p, 'Name', 'Title'))
    ).strip()

    if not company:
        skipped += 1
        continue

    # Person contact name
    person = extract(find_prop(p, 'Person', 'Contact', 'Contact Name', 'Point of Contact')).strip()

    # Industry
    industry = extract(find_prop(p, 'Industry', 'Sector')).strip()

    # Location — the user says "Market" is the column name for location
    based_in = extract(find_prop(p, 'Market', 'Based In', 'Based in', 'Location', 'Country', 'Region')).strip()

    # Email
    email_raw = extract(find_prop(p, 'Email', 'Email Address', 'Contact Email'))
    email = first_email({'type': 'rich_text', 'rich_text': [{'plain_text': email_raw}]} if email_raw else {})
    if not email:
        email = email_raw

    # Website
    website = extract(find_prop(p, 'Website', 'Website URL', 'URL', 'LinkedIn')).strip()

    # Lead owner / introduced by
    introduced_by = extract(find_prop(p, 'Lead Owner', 'Owner', 'Introduced By', 'Introducer', 'Company owner')).strip()

    # Org type (if present)
    org_type = extract(find_prop(p, 'Organization Type', 'Org Type', 'Type', 'Category')).strip()

    tier = 'paid' if org_type in PAID_TYPES else 'free'

    # Notes / extra context
    notes_parts = []
    raw_notes = extract(find_prop(p, 'Notes', 'Description', 'Comment')).strip()
    if raw_notes:
        notes_parts.append(raw_notes)
    if introduced_by:
        notes_parts.append(f'Intro: {introduced_by}')

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
        'introducedBy': introduced_by,
        'confidence':   'high',
    })

print(f'  {len(warm_contacts)} warm contacts parsed ({skipped} skipped — no company name)')

# ── Load existing contacts.json ────────────────────────────────────────────────

existing = []
if OUTPUT.exists():
    try:
        existing = json.loads(OUTPUT.read_text())
    except Exception:
        pass

# Strip old notion-warm entries (full refresh)
non_warm = [c for c in existing if c.get('source') != 'notion-warm']

# ── Propagate warm badge to matching existing contacts ─────────────────────────
# If we know company X is warm, mark ALL existing contacts at that company as warm.

warm_companies = {c['company'].lower().strip() for c in warm_contacts}
marked = 0
for c in non_warm:
    co_key = (c.get('company') or '').lower().strip()
    if co_key in warm_companies and not c.get('connection'):
        c['connection'] = 'warm'
        marked += 1

print(f'  Marked {marked} existing contacts at warm companies as warm')

# ── Merge and re-index ────────────────────────────────────────────────────────

merged = non_warm + warm_contacts
for i, c in enumerate(merged):
    c['id'] = i

OUTPUT.write_text(json.dumps(merged, ensure_ascii=False, separators=(',', ':')))
print(f'contacts.json updated: {len(merged)} total ({len(non_warm)} existing + {len(warm_contacts)} warm)')
print('Done. Commit public/contacts.json to deploy.')

#!/usr/bin/env python3
"""Sync warm contacts from Notion Sales Leads database into public/contacts.json.

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
    # relation, rollup, etc. — not plainly extractable
    return ''


def find(props, *names):
    """Find first matching property (case-insensitive, whitespace-stripped)."""
    # Strip surrounding whitespace from keys when matching
    lower = {k.strip().lower(): v for k, v in props.items()}
    for n in names:
        v = lower.get(n.strip().lower())
        if v is not None:
            return v
    return {}


# ── Fetch all pages from the database ────────────────────────────────────────

print(f'Querying Sales Leads DB ({DB})…')
pages, cursor = [], None
while True:
    body = {'page_size': 100}
    if cursor:
        body['start_cursor'] = cursor
    res = notion_post(f'/databases/{DB}/query', body)
    if res.get('object') == 'error':
        print(f'Error querying DB: {res}', file=sys.stderr)
        break
    pages.extend(res.get('results', []))
    if not res.get('has_more'):
        break
    cursor = res['next_cursor']

print(f'  {len(pages)} pages fetched')

# Print first page properties for debugging
if pages:
    print('  First page field mapping (for verification):')
    for k, v in list(pages[0]['properties'].items())[:20]:
        val = extract(v)
        print(f'    {k!r} ({v.get("type")}): {val!r}')

# ── Parse pages ───────────────────────────────────────────────────────────────
#
# Field mapping (Sales Leads DB):
#   Company name  (title)         → company
#   Contact       (rich_text)     → person
#   Email         (rich_text)     → contact/email
#   Industry      (multi_select)  → industry
#   Market        (multi_select)  → basedIn  [note: stored as ' Market' with leading space]
#   Website       (url)           → website
#   Lead temp     (select)        → used to determine connection strength (Hot/Warm/Cold)
#   AI summary    (rich_text)     → notes
#   Lead owner    (relation)      → introducedBy (relation type; name not directly available)

warm_contacts = []
skipped = 0

for page in pages:
    p = page['properties']

    # Company name is the title property
    company = ''
    for prop in p.values():
        if prop.get('type') == 'title':
            company = extract(prop).strip()
            break

    if not company:
        skipped += 1
        continue

    person   = extract(find(p, 'Contact', 'Person', 'Contact Name', 'Point of Contact')).strip()
    email    = extract(find(p, 'Email', 'Email Address')).strip()
    industry = extract(find(p, 'Industry', 'Sector', 'Vertical')).strip()
    based_in = extract(find(p, 'Market', 'Based In', 'Location', 'Country', 'Region', 'Geography')).strip()
    website  = extract(find(p, 'Website', 'Website URL', 'LinkedIn', 'LinkedIn URL', 'URL')).strip()
    notes_raw = extract(find(p, 'AI summary', 'Notes', 'Description', 'Comment', 'Details')).strip()
    lead_temp = extract(find(p, 'Lead temp', 'Lead temperature', 'Temperature')).strip()

    # If person looks like an email address, move it
    if person and '@' in person:
        email = email or person
        person = ''

    # Determine connection from Lead temp
    connection = 'warm'  # all entries from this DB are warm by definition

    notes_parts = []
    if notes_raw:
        # AI summaries can be very long — truncate to first sentence or 200 chars
        summary = notes_raw.split('.')[0].strip()
        if len(summary) > 200:
            summary = summary[:200] + '…'
        if summary:
            notes_parts.append(summary)
    if lead_temp and lead_temp.lower() != 'warm':
        notes_parts.append(f'Lead temp: {lead_temp}')

    warm_contacts.append({
        'name':         person or company,
        'role':         person and company or '',
        'company':      company,
        'basedIn':      based_in,
        'orgType':      '',
        'industry':     industry,
        'website':      website,
        'contact':      email,
        'notes':        ' · '.join(notes_parts),
        'tier':         'free',
        'source':       'notion-warm',
        'connection':   connection,
        'introducedBy': '',
        'confidence':   'high',
    })

print(f'  {len(warm_contacts)} warm contacts parsed ({skipped} skipped — no company name)')

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

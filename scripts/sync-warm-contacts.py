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


# ── Resolve database ID ───────────────────────────────────────────────────────
# The URL may point to a PAGE that contains an embedded database rather than to
# the database itself. Try the configured ID first; if it returns 0 results,
# search for all databases the integration can access and pick the best match.

def query_db(db_id):
    """Return all pages from a database, or [] if the ID is wrong."""
    results, cursor = [], None
    while True:
        body = {'page_size': 100}
        if cursor:
            body['start_cursor'] = cursor
        try:
            res = notion_post(f'/databases/{db_id}/query', body)
        except SystemExit:
            return None   # API error — wrong ID or no access
        if res.get('object') == 'error':
            return None
        results.extend(res.get('results', []))
        if not res.get('has_more'):
            break
        cursor = res['next_cursor']
    return results

print(f'Querying DB {DB}…')
pages = query_db(DB)

if pages is None or len(pages) == 0:
    reason = 'returned no results' if pages is not None else 'returned an error'
    print(f'  Configured DB ID {reason}. Searching for accessible databases…')

    # Search all databases the integration can see
    search_res = notion_post('/search', {
        'filter': {'value': 'database', 'property': 'object'},
        'page_size': 50,
    })
    dbs = search_res.get('results', [])
    print(f'  Found {len(dbs)} accessible database(s):')
    for d in dbs:
        title = ''.join(t['plain_text'] for t in d.get('title', []))
        print(f'    ID={d["id"]}  title={title!r}')
        # Try each database until we find one with data
        if pages is not None and len(pages) == 0:
            candidate = query_db(d['id'])
            if candidate:
                print(f'  → Using database {d["id"]!r} ({title!r}) with {len(candidate)} pages')
                pages = candidate
                break
    if not pages:
        print('No accessible database with content found. Check integration permissions.')
        pages = []
else:
    print(f'  {len(pages)} pages fetched')

# Print first page properties so we can verify the field mapping
if pages:
    print('  First page field mapping (for debugging):')
    for k, v in list(pages[0]['properties'].items())[:15]:
        val = extract(v)
        print(f'    {k!r} ({v.get("type")}): {val!r}')

# ── Parse pages ───────────────────────────────────────────────────────────────

warm_contacts = []
skipped = 0

for page in pages:
    p = page['properties']

    # In a CRM database the title property is typically the PERSON/CONTACT name.
    # The company name lives in a separate property (Company, Organization, etc.).
    title_val = ''
    for prop in p.values():
        if prop.get('type') == 'title':
            title_val = extract(prop).strip()
            break

    # Try to find a dedicated company field; fall back to title if nothing found
    company = extract(find(p, 'Company', 'Company name', 'Organization', 'Firm',
                           'Account', 'Account Name', 'Contact company')).strip()

    # The title might BE the company name (some DBs are structured that way)
    # Use title as person name if a separate company field was found, else as company
    if company:
        person_from_title = title_val   # title = person name
    else:
        company = title_val             # title = company name
        person_from_title = ''

    # Last resort: use any non-empty text value from the page as the company name
    if not company:
        for prop_val in p.values():
            val = extract(prop_val).strip()
            if val and len(val) > 1:
                company = val
                break

    if not company:
        skipped += 1
        continue

    # All other fields — try user-described names first, then common aliases
    industry     = extract(find(p, 'Industry', 'Sector', 'Vertical')).strip()
    based_in     = extract(find(p, 'Market', 'Based In', 'Based in', 'Location', 'Country', 'Region', 'Geography')).strip()
    email        = extract(find(p, 'Email', 'Email Address', 'Contact Email', 'Associated Contact')).strip()
    person       = (extract(find(p, 'Person', 'Contact', 'Contact Name', 'Point of Contact')).strip()
                    or person_from_title)
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

    # If person looks like an email address, move it
    if person and '@' in person:
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

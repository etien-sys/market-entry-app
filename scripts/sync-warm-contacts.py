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

# The Sales Leads DB is a CRM: one row per DEAL, not per person.
# The same person can appear many times (one row per pipeline stage / touchpoint).
# We deduplicate by (company, person) and merge deal notes into a single entry.

# keyed by (company.lower(), person.lower()) → accumulated data
deduped = {}   # key → dict
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

    person    = extract(find(p, 'Contact', 'Person', 'Contact Name', 'Point of Contact')).strip()
    email     = extract(find(p, 'Email', 'Email Address')).strip()
    industry  = extract(find(p, 'Industry', 'Sector', 'Vertical')).strip()
    based_in  = extract(find(p, 'Market', 'Based In', 'Location', 'Country', 'Region', 'Geography')).strip()
    website   = extract(find(p, 'Website', 'Website URL', 'LinkedIn', 'LinkedIn URL', 'URL')).strip()
    notes_raw = extract(find(p, 'AI summary', 'Notes', 'Description', 'Comment', 'Details')).strip()
    lead_temp = extract(find(p, 'Lead temp', 'Lead temperature', 'Temperature')).strip()

    # If person looks like an email address, treat it as email
    if person and '@' in person:
        email = email or person
        person = ''

    # Truncate AI summary to first sentence (max 200 chars)
    note = ''
    if notes_raw:
        summary = notes_raw.split('.')[0].strip()
        note = (summary[:200] + '…') if len(summary) > 200 else summary

    key = (company.lower().strip(), person.lower().strip())
    if key not in deduped:
        deduped[key] = {
            'company':  company,
            'person':   person,
            'email':    email,
            'industry': industry,
            'based_in': based_in,
            'website':  website,
            'notes':    [note] if note else [],
            'lead_temp': lead_temp,
        }
    else:
        # Accumulate: fill in any missing fields, append unique notes
        d = deduped[key]
        d['email']    = d['email']    or email
        d['industry'] = d['industry'] or industry
        d['based_in'] = d['based_in'] or based_in
        d['website']  = d['website']  or website
        if note and note not in d['notes']:
            d['notes'].append(note)

warm_records = []   # (company_lower, person_lower, enrichment_dict)
for d in deduped.values():
    company  = d['company']
    person   = d['person']
    notes_parts = d['notes'][:3]   # cap at 3 deal notes to keep it readable
    if d['lead_temp'] and d['lead_temp'].lower() not in ('warm', ''):
        notes_parts = [f"Lead temp: {d['lead_temp']}"] + notes_parts

    warm_records.append({
        'co_key':  company.lower().strip(),
        'nm_key':  person.lower().strip(),
        'company': company,
        'person':  person,
        'basedIn':   d['based_in'],
        'industry':  d['industry'],
        'website':   d['website'],
        'contact':   d['email'],
        'notes':     ' · '.join(notes_parts),
    })

print(f'  {len(pages)} rows → {len(warm_records)} unique contacts after deduplication ({skipped} skipped — no company name)')

# ── Merge into contacts.json ──────────────────────────────────────────────────

existing = []
if OUTPUT.exists():
    try:
        existing = json.loads(OUTPUT.read_text())
    except Exception:
        pass

# Remove old notion-warm entries (full refresh)
non_warm = [c for c in existing if c.get('source') != 'notion-warm']

# Build a lookup of existing contacts by (company, name) for merging
# key → index into non_warm list
existing_idx = {}
for i, c in enumerate(non_warm):
    co = (c.get('company') or '').lower().strip()
    nm = (c.get('name')    or '').lower().strip()
    existing_idx[(co, nm)] = i

merged_in = 0
new_entries = []

for wr in warm_records:
    co_key, nm_key = wr['co_key'], wr['nm_key']
    idx = existing_idx.get((co_key, nm_key))

    if idx is not None:
        # Person already exists (e.g. from LinkedIn) — enrich in-place
        c = non_warm[idx]
        c['connection'] = 'warm'
        c['contact']    = c.get('contact')  or wr['contact']
        c['basedIn']    = c.get('basedIn')  or wr['basedIn']
        c['industry']   = c.get('industry') or wr['industry']
        c['website']    = c.get('website')  or wr['website']
        # Prepend deal notes (don't overwrite LinkedIn "Connected on" note)
        if wr['notes']:
            existing_note = c.get('notes', '')
            c['notes'] = (wr['notes'] + ' · ' + existing_note).strip(' · ') if existing_note else wr['notes']
        merged_in += 1
    else:
        # New person not in existing data — add as notion-warm entry
        new_entries.append({
            'name':       wr['person'] or wr['company'],
            'role':       '',
            'company':    wr['company'],
            'basedIn':    wr['basedIn'],
            'orgType':    '',
            'industry':   wr['industry'],
            'website':    wr['website'],
            'contact':    wr['contact'],
            'notes':      wr['notes'],
            'tier':       'free',
            'source':     'notion-warm',
            'connection': 'warm',
            'confidence': 'high',
        })

# Propagate warm badge to any other contact at a warm company (not yet marked)
warm_cos = {wr['co_key'] for wr in warm_records}
propagated = 0
for c in non_warm:
    co = (c.get('company') or '').lower().strip()
    if co in warm_cos and not c.get('connection'):
        c['connection'] = 'warm'
        propagated += 1

print(f'  Merged into {merged_in} existing contacts; {len(new_entries)} new entries; {propagated} others marked warm')

merged = non_warm + new_entries
for i, c in enumerate(merged):
    c['id'] = i

OUTPUT.write_text(json.dumps(merged, ensure_ascii=False, separators=(',', ':')))
print(f'contacts.json updated: {len(merged)} total')
print('Done.')

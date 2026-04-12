#!/usr/bin/env python3
"""Sync events from Notion Events Database into public/contacts.json.
Replaces all existing 'events' source entries with fresh data from Notion."""

import json, os, urllib.request, urllib.error
from pathlib import Path

KEY    = os.environ.get('NOTION_API_KEY')
DB     = 'ab3c82ff7d9346988b09051356109643'
OUTPUT = Path(__file__).resolve().parent.parent / 'public' / 'contacts.json'

if not KEY:
    raise SystemExit('Error: NOTION_API_KEY not set')

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

# ── Fetch all pages ───────────────────────────────────────────────────────────

print(f'Fetching events from Notion (DB: {DB})…')
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

print(f'  {len(pages)} pages fetched')

# ── Parse ─────────────────────────────────────────────────────────────────────

events = []
for page in pages:
    props = page['properties']

    title_parts = props.get('Event Name', {}).get('title', [])
    name = ''.join(t.get('plain_text', '') for t in title_parts).strip()
    if not name:
        continue

    loc_prop = props.get('Location', {})
    location = ''
    if loc_prop.get('type') == 'place':
        place = loc_prop.get('place') or {}
        location = place.get('name', '') or ''

    email   = props.get('Contact Email', {}).get('email', '') or ''
    website = props.get('Website', {}).get('url', '') or ''

    events.append({
        'name':     name,
        'role':     '',
        'company':  name,
        'basedIn':  location,
        'orgType':  'Event Organizer',
        'industry': 'Events',
        'website':  website,
        'contact':  email,
        'notes':    '',
        'tier':     'free',
        'source':   'events',
        'confidence': 'high',
    })

print(f'  {len(events)} events parsed ({sum(1 for e in events if e["basedIn"])} with location)')

# ── Merge into contacts.json ──────────────────────────────────────────────────

existing = []
if OUTPUT.exists():
    try:
        existing = json.loads(OUTPUT.read_text())
    except Exception:
        pass

non_events = [c for c in existing if c.get('source') != 'events']
merged = non_events + events
for i, c in enumerate(merged):
    c['id'] = i

OUTPUT.write_text(json.dumps(merged, ensure_ascii=False, separators=(',', ':')))
print(f'contacts.json updated: {len(merged)} total ({len(non_events)} other + {len(events)} events)')

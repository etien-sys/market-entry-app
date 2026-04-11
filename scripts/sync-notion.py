#!/usr/bin/env python3
"""Sync contacts from Notion database to public/contacts.json
Usage: NOTION_API_KEY=... python3 scripts/sync-notion.py
"""

import json, os, sys, urllib.request
from pathlib import Path

KEY   = os.environ.get('NOTION_API_KEY')
DB_ID = os.environ.get('NOTION_DATABASE_ID', '2f19a7b410ae8060bc56c9b96da24234')

if not KEY:
    sys.exit('Error: set NOTION_API_KEY environment variable')
OUT   = Path(__file__).parent.parent / 'public' / 'contacts.json'

def notion_post(path, body):
    req = urllib.request.Request(
        f'https://api.notion.com/v1{path}',
        data=json.dumps(body).encode(),
        headers={
            'Authorization': f'Bearer {KEY}',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
        },
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def extract(prop):
    if not prop:
        return ''
    t = prop.get('type')
    if t == 'title':      return ''.join(x['plain_text'] for x in prop.get('title', []))
    if t == 'rich_text':  return ''.join(x['plain_text'] for x in prop.get('rich_text', []))
    if t == 'url':        return prop.get('url') or ''
    if t == 'select':     return (prop.get('select') or {}).get('name', '')
    if t == 'multi_select': return ', '.join(s['name'] for s in prop.get('multi_select', []))
    if t == 'people':     return ', '.join(p.get('name', '') for p in prop.get('people', []))
    if t == 'email':      return prop.get('email') or ''
    return ''

def parse_tier(org_type):
    low = (org_type or '').lower()
    if any(k in low for k in ['investor', 'family office', 'high-net-worth']):
        return 'paid'
    return 'free'

ROW_NAME = __import__('re').compile(r'^row\s*\d+$', __import__('re').I)

def name_from_website(url):
    if not url:
        return None
    domain = url.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0].strip()
    base = domain.split('.')[0] if domain else ''
    return base.capitalize() if base else None

def fetch_all():
    contacts, cursor = [], None
    while True:
        body = {'page_size': 100}
        if cursor:
            body['start_cursor'] = cursor
        data = notion_post(f'/databases/{DB_ID}/query', body)
        for page in data['results']:
            p = page['properties']
            company = extract(p.get('Company name'))
            if not company:
                continue

            # Skip Row XXXX placeholders with no real website
            if ROW_NAME.match(company):
                website = extract(p.get('Website URL'))
                derived = name_from_website(website)
                if not derived:
                    continue
                company = derived

            org_type = extract(p.get('Organization Type'))
            contacts.append({
                'id':         len(contacts),
                'name':       company,
                'company':    company,
                'orgType':    org_type,
                'website':    extract(p.get('Website URL')),
                'basedIn':    extract(p.get('Based in: ')),
                'industry':   extract(p.get('Industry')),
                'contact':    extract(p.get('Associated Contact')),
                'owner':      extract(p.get('Company owner')),
                'connection': extract(p.get('Connection', p.get('Warmth', {}))).lower(),
                'role':       '',
                'notes':      '',
                'tier':       parse_tier(org_type),
            })

        if not data.get('has_more'):
            break
        cursor = data.get('next_cursor')
        print(f'  fetched {len(contacts)} so far…', end='\r', flush=True)

    return contacts

print('Fetching from Notion…')
contacts = fetch_all()
OUT.write_text(json.dumps(contacts))
print(f'Done — {len(contacts)} contacts written to {OUT}')

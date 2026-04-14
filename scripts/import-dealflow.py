#!/usr/bin/env python3
"""
Import dealflow startup contacts from the XLSX.

Sheet: "Dealflow Startups"
Columns: ID, First name, Last name, Role, Linkedin, Email, Phone,
         Startup name, Description, Website, Industry, Launch status,
         Usage, Raised, To raise, Country, Deck

Each row = a person (founder/team member) at a startup.
Multiple rows with the same Startup name → multiple person sub-rows in the UI.

Usage:
  python3 scripts/import-dealflow.py
"""

import json, re, urllib.request
from pathlib import Path

try:
    import openpyxl
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'openpyxl', '-q'])
    import openpyxl

XLSX_URL = (
    'https://docs.google.com/spreadsheets/d/'
    '1KE2YoWuY-50nQHnUpPZmbMs68zLR2Hnn/export?format=xlsx'
)
REPO     = Path(__file__).resolve().parent.parent
OUT_JSON = REPO / 'public' / 'contacts.json'
XLSX_TMP = Path('/tmp/dealflow_import.xlsx')

# ── Industry mapping ──────────────────────────────────────────────────────────

INDUSTRY_MAP = {
    'artificial intelligence':      'AI / ML',
    'software':                     'SaaS',
    'health care':                  'HealthTech',
    'healthcare':                   'HealthTech',
    'education':                    'EdTech',
    'apps':                         'Mobile',
    'data and analytics':           'Data & Analytics',
    'sales and marketing':          'MarTech',
    'financial services':           'Fintech',
    'payments':                     'Fintech',
    'lending and investments':      'Fintech',
    'platforms':                    'SaaS',
    'internet services':            'SaaS',
    'information technology':       'IT Services',
    'transportation':               'Transportation',
    'travel and tourism':           'Travel',
    'blockchain and cryptocurrency':'Web3',
    'web3':                         'Web3',
    'commerce and shopping':        'eCommerce',
    'sustainability':               'CleanTech',
    'energy':                       'Energy',
    'advertising':                  'AdTech',
    'agriculture and farming':      'AgriTech',
    'design':                       'Design',
    'professional services':        'B2B Services',
    'cybersecurity':                'Cybersecurity',
    'privacy and security':         'Cybersecurity',
    'social impact':                'Social Impact',
    'media and entertainment':      'Media',
    'content and publishing':       'Media',
    'music and audio':              'Media',
    'gaming':                       'Gaming',
    'food and beverage':            'FoodTech',
    'science and engineering':      'Deep Tech',
    'sports':                       'Sports',
    'real estate':                  'PropTech',
    'consumer services':            'Consumer',
    'hardware':                     'Hardware',
    'biotechnology':                'BioTech',
    'ar / vr':                      'AR/VR',
    'mobile':                       'Mobile',
    'manufacturing':                'Manufacturing',
    'other':                        '',
}

def map_industry(raw):
    return INDUSTRY_MAP.get((raw or '').strip().lower(), (raw or '').strip())

# ── Country normalisation ─────────────────────────────────────────────────────

COUNTRY_MAP = {
    'czech republic':         'Czechia',
    'bosnia & herzegovina':   'Bosnia and Herzegovina',
    'bosnia and herzegovina': 'Bosnia and Herzegovina',
    'north macedonia':        'North Macedonia',
    'united kingdom':         'United Kingdom',
    'united states':          'United States',
}

def map_country(raw):
    return COUNTRY_MAP.get((raw or '').strip().lower(), (raw or '').strip())

# ── Website normalisation ─────────────────────────────────────────────────────

def clean_url(raw):
    if not raw:
        return ''
    raw = raw.strip()
    if not raw or raw.upper() in ('N/A', '-', 'NONE'):
        return ''
    if not raw.startswith('http'):
        raw = 'https://' + raw
    return raw

# ── Download ──────────────────────────────────────────────────────────────────

print('Downloading XLSX…')
urllib.request.urlretrieve(XLSX_URL, XLSX_TMP)
print(f'  Saved to {XLSX_TMP}')

wb  = openpyxl.load_workbook(XLSX_TMP, read_only=True, data_only=True)
ws  = wb['Dealflow Startups']
raw_rows = list(ws.iter_rows(values_only=True))
headers  = [str(h or '').strip() for h in raw_rows[0]]
data     = [dict(zip(headers, [str(v or '').strip() for v in r]))
            for r in raw_rows[1:] if any(r)]
print(f'  {len(data)} rows in "Dealflow Startups"')

# ── Build contacts ────────────────────────────────────────────────────────────

new_contacts = []
for r in data:
    first    = r.get('First name', '').strip()
    last     = r.get('Last name',  '').strip()
    person   = f'{first} {last}'.strip()
    startup  = r.get('Startup name', '').strip()
    if not startup:
        continue

    role     = r.get('Role',    '').strip()
    email    = r.get('Email',   '').strip()
    linkedin = clean_url(r.get('Linkedin', ''))
    website  = clean_url(r.get('Website', ''))
    industry = map_industry(r.get('Industry', ''))
    country  = map_country(r.get('Country', ''))
    desc     = r.get('Description', '').strip()
    raised   = r.get('Raised', '').strip()
    to_raise = r.get('To raise', '').strip()

    # Notes: first sentence of description + funding info
    first_sentence = re.split(r'[\n\r]', desc)[0][:140].strip()
    notes_parts = []
    if first_sentence:
        notes_parts.append(first_sentence)
    if raised and raised.upper() not in ('N/A', ''):
        notes_parts.append(f'Raised: {raised}')
    if to_raise and to_raise.upper() not in ('N/A', ''):
        notes_parts.append(f'Seeking: {to_raise}')

    # For website: prefer company website, fall back to LinkedIn
    display_website = website or linkedin

    new_contacts.append({
        'name':     person or startup,
        'role':     role,
        'company':  startup,
        'basedIn':  country,
        'orgType':  'Product Startup',
        'industry': industry,
        'website':  display_website,
        'contact':  email,
        'notes':    ' · '.join(notes_parts),
        'tier':     'free',
        'source':   'dealflow',
    })

print(f'Built {len(new_contacts)} person-level contacts')

# ── Merge with existing contacts.json ────────────────────────────────────────

existing = json.loads(OUT_JSON.read_text())
# Remove old dealflow entries for clean re-import
existing = [c for c in existing if c.get('source') != 'dealflow']

# Deduplicate: by (company|name) to handle multiple founders at same startup
seen_keys = set()
for c in existing:
    co  = (c.get('company') or c.get('name', '')).lower().strip()
    nm  = (c.get('name') or '').lower().strip()
    key = f'{co}|{nm}' if nm and nm != co else co
    seen_keys.add(key)

added = 0
for c in new_contacts:
    co  = c['company'].lower().strip()
    nm  = (c['name'] or '').lower().strip()
    key = f'{co}|{nm}' if nm and nm != co else co
    if key not in seen_keys:
        seen_keys.add(key)
        existing.append(c)
        added += 1

# Re-number IDs
for i, c in enumerate(existing):
    c['id'] = i

OUT_JSON.write_text(json.dumps(existing, ensure_ascii=False, separators=(',', ':')))
print(f'Added {added} new contacts (skipped {len(new_contacts) - added} duplicates)')
print(f'Total contacts: {len(existing)}')

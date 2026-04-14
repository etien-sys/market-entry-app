#!/usr/bin/env python3
"""
Import AI Product Companies and AI Service Companies from the CEE AI landscape XLSX.

Sheet 1 (AI Product Companies 2024):
  - Columns: Country, Name, Team Size, Industry, AI Specialization, Founded date, Last Funding Type, Website
  - orgType: "Product Startup" if < 100 people, "Corporation" if >= 100
  - industry: mapped to clean label (HealthTech, Fintech, EdTech …)
  - source: "ai-product"

Sheet 2 (AI Service Companies 2024):
  - Columns: Country, Name, Team Size, Founding Date, Website
  - orgType: "Service Provider" for all
  - industry: "AI / ML"
  - source: "ai-service"

Usage:
  python3 scripts/import-ai-companies.py
  (downloads the XLSX from Google Sheets, merges into public/contacts.json)
"""

import json, re
from pathlib import Path

try:
    import openpyxl
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'openpyxl', '-q'])
    import openpyxl

import urllib.request

XLSX_URL = (
    'https://docs.google.com/spreadsheets/d/'
    '1XFz7TvGlR516Mq333ZugkecTP7l8tl4cAQ4ePvpOIkw/export?format=xlsx'
)
REPO      = Path(__file__).resolve().parent.parent
OUT_JSON  = REPO / 'public' / 'contacts.json'
XLSX_TMP  = Path('/tmp/ai_companies_import.xlsx')

# ── Industry normalisation ────────────────────────────────────────────────────

INDUSTRY_MAP = {
    'information technology':                'AI / ML',
    'information technnology':               'AI / ML',   # typo
    'information technology & services':     'AI / ML',
    'ai integration':                        'AI / ML',
    'artificial intelligence':               'AI / ML',
    'healthcare and life sciences':          'HealthTech',
    'health':                                'HealthTech',
    'marketing, sales, and customer service':'MarTech',
    'marketing':                             'Marketing',
    'sales':                                 'Sales',
    'finance':                               'Fintech',
    'agriculture':                           'AgriTech',
    'human resources':                       'HR Tech',
    'hr':                                    'HR Tech',
    'retail':                                'Retail Tech',
    'education':                             'EdTech',
    'edcation':                              'EdTech',    # typo
    'manufacturing':                         'Manufacturing',
    'manufacturer':                          'Manufacturing',
    'security and cybersecurity':            'Cybersecurity',
    'security':                              'Cybersecurity',
    'cybersecurity':                         'Cybersecurity',
    'energy and utilities':                  'Energy',
    'energy':                                'Energy',
    'cleantech':                             'CleanTech',
    'climattech':                            'CleanTech',
    'climatetech':                           'CleanTech',
    'esg':                                   'ESG',
    'logistics':                             'Logistics',
    'media & entertainment':                 'Media',
    'media and entertainment':               'Media',
    'media & enterntainment':                'Media',     # typo
    'space':                                 'Space Tech',
    'space manufacturing':                   'Space Tech',
    'automotive':                            'Automotive',
    'travel and hospitality':                'Travel',
    'aerospace':                             'Aerospace',
    'sports':                                'Sports',
    'maritime':                              'Maritime',
    'real estate':                           'PropTech',
    'real estare':                           'PropTech',  # typo
    'public sector':                         'GovTech',
    'gaming and esports':                    'Gaming',
    'gaming and esports and esports':        'Gaming',    # duplicate typo
    'gaming':                                'Gaming',
    'video games':                           'Gaming',
    'transportation':                        'Transportation',
    'legal':                                 'LegalTech',
    'telecommunications':                    'Telecom',
    'ecommerce':                             'eCommerce',
    'construction':                          'Construction',
    'food':                                  'FoodTech',
    'smart homes':                           'Smart Home',
    'homeliving':                            'Smart Home',
    'weather':                               'ClimaTech',
    'science':                               'Research',
    'waste management':                      'CleanTech',
    'waste man/agement':                     'CleanTech',
    'content production':                    'Media',
    'consumer electronics':                  'Consumer Electronics',
    'product design':                        'Product Design',
    'productdesign':                         'Product Design',
    'pets':                                  'Pets',
    'defense':                               'Defense',
    'procurement':                           'Procurement',
    'communication':                         'Telecom',
    'marketing research':                    'MarTech',
    'marketing, media':                      'MarTech',
    'hr':                                    'HR Tech',
    'fin/ance':                              'Fintech',   # mangled value
    'esports':                               'Gaming',
}

def map_industry(raw):
    """Take the first industry value and map to clean label."""
    if not raw:
        return ''
    # Split on ; and , then take first meaningful segment
    first = re.split(r'[;,]', raw)[0].strip().rstrip(';').strip().lower()
    return INDUSTRY_MAP.get(first, raw.split(';')[0].split(',')[0].strip())

# ── orgType from team size ────────────────────────────────────────────────────

STARTUP_SIZES  = {'below 10', '11 to 50', '51 to 100', '10 to 99', 'below 100'}
CORP_SIZES     = {'101 to 200', '201 to 500', '501 to 1000', 'above 1000',
                  'over 500', '100 to 499', '500 to 1000'}

def org_type_from_size(size_str, default):
    s = (size_str or '').strip().lower()
    if s in STARTUP_SIZES:  return 'Product Startup'
    if s in CORP_SIZES:     return 'Corporation'
    return default

# ── Website normalisation ─────────────────────────────────────────────────────

def clean_website(raw):
    if not raw:
        return ''
    raw = raw.strip()
    if not raw:
        return ''
    if not raw.startswith('http'):
        raw = 'https://' + raw
    return raw

# ── Tier ─────────────────────────────────────────────────────────────────────

def parse_tier(org_type):
    return 'paid' if (org_type or '').lower() in ('investor', 'family office', 'high-net-worth individual') else 'free'

# ── Download ──────────────────────────────────────────────────────────────────

print(f'Downloading XLSX…')
urllib.request.urlretrieve(XLSX_URL, XLSX_TMP)
print(f'  Saved to {XLSX_TMP}')

wb = openpyxl.load_workbook(XLSX_TMP, read_only=True, data_only=True)

def sheet_to_dicts(ws):
    rows = list(ws.iter_rows(values_only=True))
    headers = [str(h or '').strip() for h in rows[0]]
    return [
        dict(zip(headers, [str(v or '').strip() for v in r]))
        for r in rows[1:]
        if any(v for v in r)
    ]

data1 = sheet_to_dicts(wb['AI Product Companies 2024'])
data2 = sheet_to_dicts(wb['AI Service Companies 2024'])
print(f'  Sheet 1 (Product): {len(data1)} rows')
print(f'  Sheet 2 (Service): {len(data2)} rows')

# ── Build new contacts ────────────────────────────────────────────────────────

new_contacts = []

for r in data1:
    name    = r.get('Name', '').strip()
    country = r.get('Country', '').strip()
    website = clean_website(r.get('Website', ''))
    size    = r.get('Team Size', '')
    org_type = org_type_from_size(size, 'Product Startup')
    industry = map_industry(r.get('Industry', ''))
    ai_spec  = r.get('AI Specialization', '').strip()
    funding  = r.get('Last Funding Type', '').strip()
    notes_parts = []
    if ai_spec and ai_spec.upper() != 'N/A':
        notes_parts.append(f'AI: {ai_spec}')
    if funding and funding.upper() not in ('N/A', ''):
        notes_parts.append(f'Funding: {funding}')

    if not name:
        continue
    new_contacts.append({
        'name':     name,
        'role':     '',
        'company':  name,
        'basedIn':  country,
        'orgType':  org_type,
        'industry': industry,
        'website':  website,
        'contact':  '',
        'notes':    ' · '.join(notes_parts),
        'tier':     parse_tier(org_type),
        'source':   'ai-product',
    })

for r in data2:
    name    = r.get('Name', '').strip()
    country = r.get('Country', '').strip()
    website = clean_website(r.get('Website', ''))
    if not name:
        continue
    new_contacts.append({
        'name':     name,
        'role':     '',
        'company':  name,
        'basedIn':  country,
        'orgType':  'Service Provider',
        'industry': 'AI / ML',
        'website':  website,
        'contact':  '',
        'notes':    '',
        'tier':     'free',
        'source':   'ai-service',
    })

print(f'\nBuilt {len(new_contacts)} contacts ({sum(1 for c in new_contacts if c["source"]=="ai-product")} product, {sum(1 for c in new_contacts if c["source"]=="ai-service")} service)')

# ── Merge with existing contacts.json ─────────────────────────────────────────

existing = json.loads(OUT_JSON.read_text())
# Remove any previously imported ai-product / ai-service contacts to allow re-import
existing = [c for c in existing if c.get('source') not in ('ai-product', 'ai-service')]

seen_companies = {(c.get('company') or c.get('name', '')).lower().strip() for c in existing}

added = 0
for c in new_contacts:
    key = c['company'].lower().strip()
    if key not in seen_companies:
        seen_companies.add(key)
        existing.append(c)
        added += 1

# Re-number IDs
for i, c in enumerate(existing):
    c['id'] = i

OUT_JSON.write_text(json.dumps(existing, ensure_ascii=False, separators=(',', ':')))
print(f'Added {added} new contacts (skipped {len(new_contacts) - added} duplicates)')
print(f'Total contacts: {len(existing)}')
print(f'\nRun: python3 scripts/apply-overrides.py  (to re-apply manual overrides)')

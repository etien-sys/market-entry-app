#!/usr/bin/env python3
"""Apply manual overrides from data/overrides.json to public/contacts.json.
Run after any enrichment or sync step to ensure corrections are preserved."""

import json
from pathlib import Path

REPO      = Path(__file__).resolve().parent.parent
OVERRIDES = REPO / 'data' / 'overrides.json'
CONTACTS  = REPO / 'public' / 'contacts.json'

raw = json.loads(OVERRIDES.read_text())
# Strip comment/meta keys
overrides = {k: v for k, v in raw.items() if not k.startswith('_')}

contacts = json.loads(CONTACTS.read_text())

PAID = {'Investor', 'Family Office', 'High-Net-Worth Individual'}
changed = 0
for c in contacts:
    key = (c.get('company') or c.get('name', '')).lower().strip()
    if key in overrides:
        patch = overrides[key]
        for field, value in patch.items():
            if c.get(field) != value:
                c[field] = value
                changed += 1
        # Keep tier in sync with orgType
        if 'orgType' in patch:
            c['tier'] = 'paid' if patch['orgType'] in PAID else 'free'

CONTACTS.write_text(json.dumps(contacts, ensure_ascii=False, separators=(',', ':')))
print(f'Applied {len(overrides)} overrides → {changed} field(s) updated across {len(contacts)} contacts')

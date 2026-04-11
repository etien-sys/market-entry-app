#!/usr/bin/env python3
"""Write a single intake form lead to the Notion Sales Leads database.
Triggered by the save-lead GitHub Actions workflow via repository_dispatch."""

import json, os, urllib.request, urllib.error

KEY = os.environ.get('NOTION_API_KEY')
if not KEY:
    raise SystemExit('Error: NOTION_API_KEY secret not set')

LEADS_DB_ID = '2889a7b410ae81f39a23c065ab103614'


lead = json.loads(os.environ.get('LEAD_JSON', '{}'))

name         = lead.get('name', '')
email        = lead.get('email', '')
company_name = lead.get('companyName', '')
market       = lead.get('market', '')
industry     = lead.get('industry', '')
location     = lead.get('location', '')
goal         = lead.get('goal', '')
company_intro = lead.get('companyIntro', '')
submitted_at  = lead.get('submittedAt', '')

summary = '\n\n'.join(filter(None, [
    goal         and f'Goal: {goal}',
    company_intro and f'About: {company_intro}',
    industry     and f'Industry: {industry}',
    location     and f'Based in: {location}',
    market       and f'Target market: {market}',
    submitted_at and f'Submitted: {submitted_at}',
]))[:2000]

properties = {
    'Company name': {'title': [{'text': {'content': company_name or name or email or 'SETI App Lead'}}]},
    'Contact':      {'rich_text': [{'text': {'content': name}}]},
    'Email':        {'rich_text': [{'text': {'content': email}}]},
    'AI summary':   {'rich_text': [{'text': {'content': summary}}]},
    'Stage':        {'status': {'name': 'New'}},
    'Lead source':  {'select': {'name': 'Website / Registration form'}},
    'Lead type':    {'select': {'name': 'New lead'}},
}

if goal:
    properties['Deal name'] = {'rich_text': [{'text': {'content': goal[:2000]}}]}
if industry:
    properties['Industry'] = {'multi_select': [{'name': industry}]}


body = json.dumps({
    'parent': {'database_id': LEADS_DB_ID},
    'properties': properties,
}).encode()

req = urllib.request.Request(
    'https://api.notion.com/v1/pages',
    data=body,
    headers={
        'Authorization': f'Bearer {KEY}',
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
    },
    method='POST'
)

try:
    with urllib.request.urlopen(req, timeout=30) as r:
        result = json.loads(r.read())
    print(f"Lead saved: {result.get('id')} — {company_name or name or email}")
except urllib.error.HTTPError as e:
    raise SystemExit(f'Notion API error {e.code}: {e.read().decode()}')

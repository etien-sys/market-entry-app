#!/usr/bin/env node
// Sync contacts from Notion database to public/contacts.json
// Usage: NOTION_API_KEY=... NOTION_DATABASE_ID=... node scripts/sync-notion.js

const KEY = process.env.NOTION_API_KEY;
const DB_ID = process.env.NOTION_DATABASE_ID || '2f19a7b410ae8060bc56c9b96da24234';
const OUT = new URL('../public/contacts.json', import.meta.url).pathname;

if (!KEY) { console.error('Missing NOTION_API_KEY'); process.exit(1); }

function extractText(prop) {
  if (!prop) return '';
  if (prop.type === 'title') return prop.title.map(t => t.plain_text).join('');
  if (prop.type === 'rich_text') return prop.rich_text.map(t => t.plain_text).join('');
  if (prop.type === 'url') return prop.url || '';
  return '';
}

function parseTier(orgType) {
  if (!orgType) return 'free';
  const lower = orgType.toLowerCase();
  if (['investor', 'family office', 'high-net-worth'].some(k => lower.includes(k))) return 'paid';
  return 'free';
}

async function fetchAll() {
  const contacts = [];
  let cursor;
  while (true) {
    const body = JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) });
    const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body,
    });
    if (!res.ok) throw new Error(`Notion API error: ${res.status} ${await res.text()}`);
    const data = await res.json();

    for (const page of data.results) {
      const p = page.properties;
      const company = extractText(p['Company name']);
      if (!company) continue;
      const orgType = extractText(p['Organization Type']);
      contacts.push({
        id: contacts.length,
        name: company,
        company,
        orgType,
        website: extractText(p['Website URL']),
        basedIn: extractText(p['Based in: ']),
        industry: extractText(p['Industry']),
        role: '',
        notes: '',
        tier: parseTier(orgType),
      });
    }

    if (!data.has_more) break;
    cursor = data.next_cursor;
  }
  return contacts;
}

const { writeFileSync } = await import('fs');
console.log('Fetching from Notion...');
const contacts = await fetchAll();
writeFileSync(OUT, JSON.stringify(contacts));
console.log(`Done — ${contacts.length} contacts written to public/contacts.json`);

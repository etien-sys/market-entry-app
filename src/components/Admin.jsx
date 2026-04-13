import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

const PURPLE = '#7c6fe0';
const API_KEY_STORAGE   = 'seti-admin-api-key';
const BACKLOG_KEY       = 'seti-gap-backlog';
const OVERRIDES_STORAGE = 'seti-contact-overrides';
const GH_TOKEN_STORAGE  = 'seti-github-token';
const GH_REPO           = 'etien-sys/market-entry-app';
const GH_OVERRIDES_PATH = 'data/overrides.json';

// ── Inline-edit helpers ───────────────────────────────────────────────────────

function overrideKey(c) {
  const co = (c.company || c.name || '').toLowerCase().trim();
  const nm = (c.name    || '').toLowerCase().trim();
  return (nm && nm !== co) ? `${co}|${nm}` : co;
}

function loadLocalOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_STORAGE) || '{}'); } catch { return {}; }
}

// Inline editable cell — click to edit, Enter/blur to save
function EditableCell({ value, onSave, options, placeholder, style, edited }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');
  const ref = useRef();

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed !== (value || '')) onSave(trimmed);
    setEditing(false);
  }

  if (editing) {
    if (options) return (
      <select ref={ref} value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        style={{ background: '#111119', color: '#e8e8f0', border: `1px solid ${PURPLE}`, borderRadius: '4px', fontSize: '12px', padding: '2px 4px' }}>
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
    return (
      <input ref={ref} value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); } }}
        placeholder={placeholder}
        style={{ background: '#111119', color: '#e8e8f0', border: `1px solid ${PURPLE}`, borderRadius: '4px', fontSize: '12px', padding: '2px 6px', width: '100%', minWidth: '80px' }} />
    );
  }

  return (
    <span onClick={() => { setDraft(value || ''); setEditing(true); }}
      title="Click to edit"
      style={{ cursor: 'text', ...style, borderBottom: edited ? '1px dashed #7c6fe060' : undefined }}>
      {value || <span style={{ color: '#2a2a40' }}>{placeholder || '—'}</span>}
    </span>
  );
}

// Hardcoded warmth overrides — will be replaced by Notion "Connection" field once synced
const WARMTH_MAP = {
  'tech.eu': 'warm',
  'handelsblatt': 'cold',
};

function getConnection(c) {
  // Use Notion-synced field first
  if (c.connection) return c.connection.toLowerCase();
  // Fall back to hardcoded map
  const key = (c.name || '').toLowerCase();
  for (const [k, v] of Object.entries(WARMTH_MAP)) {
    if (key.includes(k)) return v;
  }
  return null;
}

const WARMTH_STYLE = {
  warm: { color: '#34d399', bg: '#14290a', border: '#34d39930' },
  cold: { color: '#60a5fa', bg: '#0a1429', border: '#60a5fa30' },
};

function WarmthBadge({ value }) {
  const s = WARMTH_STYLE[value];
  if (!s) return null;
  return (
    <span style={{ fontSize: '10px', padding: '1px 7px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', color: s.color, fontWeight: '700', letterSpacing: '0.3px' }}>
      {value}
    </span>
  );
}

// ── Keyword filter (fast, no API needed) ──────────────────────────────────────

const ORG_PATTERNS = [
  { words: ['journalist', 'press', 'reporter', 'editor', 'media', 'publication', 'magazine', 'newspaper', 'broadcast', 'tv', 'radio'], orgTypes: ['Media'] },
  { words: ['investor', 'vc', 'venture', 'fund', 'capital', 'angel', 'family office', 'high-net-worth', 'hnw'], orgTypes: ['Investor', 'Family Office', 'High-Net-Worth Individual'] },
  { words: ['event organizer', 'event organiser', 'conference', 'event'], orgTypes: ['Event Organizer'] },
  { words: ['startup', 'startups', 'founder', 'early-stage', 'early stage'], orgTypes: ['Product Startup'] },
  { words: ['scaleup', 'scaleups', 'scale-up'], orgTypes: ['Product Scaleup'] },
  { words: ['accelerator', 'incubator'], orgTypes: ['Accelerator/ Incubator'] },
  { words: ['corporate', 'corporation', 'enterprise', 'bank'], orgTypes: ['Corporation', 'Bank'] },
  { words: ['ngo', 'non-profit', 'nonprofit', 'civil society'], orgTypes: ['NGO'] },
  { words: ['service provider', 'consultant', 'agency', 'advisory'], orgTypes: ['Service Provider'] },
  { words: ['policymaker', 'government', 'ministry', 'public sector'], orgTypes: ['Policymaker/ Public Sector Agency'] },
  { words: ['research', 'university', 'academic', 'think tank'], orgTypes: ['Research'] },
];

const LOCATION_MAP = {
  'uae': ['UAE', 'United Arab Emirates', 'Dubai', 'Abu Dhabi', 'Sharjah', 'MENA'],
  'dubai': ['Dubai', 'UAE', 'United Arab Emirates'],
  'abu dhabi': ['Abu Dhabi', 'UAE', 'United Arab Emirates'],
  'mena': ['MENA', 'UAE', 'United Arab Emirates', 'Dubai', 'Abu Dhabi'],
  'gcc': ['MENA', 'UAE', 'United Arab Emirates', 'Dubai', 'Abu Dhabi'],
  'germany': ['Germany'], 'austria': ['Austria'], 'switzerland': ['Switzerland'],
  'dach': ['Germany', 'Austria', 'Switzerland'],
  'poland': ['Poland'], 'romania': ['Romania'], 'bulgaria': ['Bulgaria'],
  'greece': ['Greece'], 'czechia': ['Czechia'], 'czech republic': ['Czechia'],
  'hungary': ['Hungary'], 'croatia': ['Croatia'], 'serbia': ['Serbia'],
  'slovakia': ['Slovakia'], 'albania': ['Albania'], 'ukraine': ['Ukraine'],
  'estonia': ['Estonia'], 'latvia': ['Latvia'], 'lithuania': ['Lithuania'],
  'cee': ['Bulgaria', 'Romania', 'Poland', 'Greece', 'Czechia', 'Hungary', 'Croatia', 'Serbia', 'Slovakia', 'Albania', 'Ukraine', 'Estonia', 'Latvia', 'Lithuania', 'Moldova', 'Montenegro', 'North Macedonia', 'Bosnia and Herzegovina'],
  'balkans': ['Bulgaria', 'Romania', 'Greece', 'Croatia', 'Serbia', 'Albania', 'Bosnia and Herzegovina', 'Montenegro', 'North Macedonia', 'Slovenia'],
  'us': ['United States'], 'usa': ['United States'], 'united states': ['United States'], 'america': ['United States'],
  'uk': ['United Kingdom'], 'united kingdom': ['United Kingdom'], 'britain': ['United Kingdom'],
  'france': ['France'], 'italy': ['Italy'], 'spain': ['Spain'],
  'netherlands': ['The Netherlands'], 'belgium': ['Belgium'],
  'portugal': ['Portugal'], 'ireland': ['Ireland'], 'luxembourg': ['Luxembourg'],
  'nordics': ['Nordics'], 'sweden': ['Nordics'], 'norway': ['Nordics'], 'denmark': ['Nordics'], 'finland': ['Nordics'],
  'europe': ['Germany', 'France', 'United Kingdom', 'Italy', 'Spain', 'The Netherlands', 'Belgium', 'Austria', 'Switzerland', 'Poland', 'Romania', 'Bulgaria', 'Greece', 'Czechia', 'Hungary', 'Croatia', 'Portugal', 'Ireland', 'Nordics', 'Luxembourg'],
};

// Match a keyword as a whole word (surrounded by spaces or at string boundaries).
// Prevents "media" in "social media analytics" from triggering when the user
// types a company name like "TechMedia Corp".
function wordMatch(text, word) {
  // Multi-word phrases: substring is fine (e.g. "family office")
  if (word.includes(' ')) return text.includes(word);
  // Single words: require word boundary so "media" doesn't match inside "multimedia"
  return new RegExp(`(^|[^a-z])${word}([^a-z]|$)`).test(text);
}

function parseQuery(q) {
  const lower = q.toLowerCase();
  let remainder = lower;

  const orgTypes = [];
  for (const p of ORG_PATTERNS) {
    for (const w of p.words) {
      if (wordMatch(lower, w)) {
        orgTypes.push(...p.orgTypes);
        // Strip matched keyword from remainder (word-boundary aware)
        const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
        remainder = remainder.replace(new RegExp(`(^|\\s)${esc}(\\s|$)`, 'g'), ' ').trim();
      }
    }
  }

  const locations = [];
  for (const key of Object.keys(LOCATION_MAP).sort((a, b) => b.length - a.length)) {
    if (lower.includes(key)) {
      locations.push(...LOCATION_MAP[key]);
      remainder = remainder.replace(key, '').trim();
      break;
    }
  }

  return { orgTypes: [...new Set(orgTypes)], locations: [...new Set(locations)], raw: lower, remainder };
}

function matchesFilter(c, { orgTypes, locations, raw, remainder }) {
  const orgType  = (c.orgType   || '').toLowerCase();
  const industry = (c.industry  || '').toLowerCase();
  const basedIn  = (c.basedIn   || '').toLowerCase();
  const name     = (c.name      || '').toLowerCase();
  const company  = (c.company   || '').toLowerCase();
  const role     = (c.role      || '').toLowerCase();
  const notes    = (c.notes     || '').toLowerCase();
  const website  = (c.website   || '').toLowerCase();
  const contact  = (c.contact   || '').toLowerCase();

  if (orgTypes.length === 0 && locations.length === 0) {
    // Raw text: search identity/contact fields only — NOT orgType or industry
    // (those are filter dimensions, not free-text content)
    return [name, company, role, notes, website, contact, basedIn].some(f => f.includes(raw));
  }

  // For Media: also match contacts whose role is clearly journalistic even if
  // orgType wasn't set (e.g. "Senior Reporter" at FinTech Futures with no orgType).
  const JOURNALIST_ROLE = /\b(journalist|reporter|correspondent|anchor|columnist|editor|newsroom)\b/i;
  const orgMatch = orgTypes.length === 0 || orgTypes.some(ot => {
    if (orgType.includes(ot.toLowerCase())) return true;
    if (ot.toLowerCase() === 'media' && JOURNALIST_ROLE.test(c.role || '')) return true;
    return false;
  });
  const locMatch = locations.length === 0 || locations.some(l => basedIn.toLowerCase().includes(l.toLowerCase()));

  // If the query had leftover words beyond the keyword (e.g. "fintech" in "fintech media"),
  // require them to also match somewhere in the contact's text fields.
  const textMatch = !remainder || [name, company, role, notes, industry, website, contact, basedIn].some(f => f.includes(remainder));

  return orgMatch && locMatch && textMatch;
}

// ── AI-powered semantic search ────────────────────────────────────────────────

const AVAILABLE_ORG_TYPES = [
  'Investor', 'Family Office', 'High-Net-Worth Individual',
  'Product Startup', 'Product Scaleup', 'Media', 'Event Organizer',
  'Corporation', 'Bank', 'Service Provider', 'NGO',
  'Policymaker/ Public Sector Agency', 'Research', 'Accelerator/ Incubator',
];

async function expandQueryWithAI(query, apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: `You expand search queries for a B2B contact database. Each contact has: name, orgType, industry, basedIn, notes, role fields.

Available orgTypes (use these exact strings only):
${AVAILABLE_ORG_TYPES.join(', ')}

Given a search query, return a JSON object:
{
  "orgTypes": [],    // exact strings from the available list that match the intent
  "locations": [],   // country or city names to match against basedIn
  "keywords": []     // SUBJECT-MATTER keywords only — topic, sector, vertical
}

CRITICAL RULE FOR KEYWORDS: keywords must describe the TOPIC/SUBJECT, not the job function.
If orgTypes is non-empty, do NOT include words that describe the job function already captured
by the orgType. Examples of what NOT to include:
- orgType=Media → do NOT add: journalist, reporter, editor, writer, content, press, media, publication
- orgType=Investor → do NOT add: investor, fund, capital, investment, venture, VC, portfolio
- orgType=Event Organizer → do NOT add: event, conference, organizer, summit

Instead, only include the TOPIC the user specified:
"fintech journalists" → orgTypes:["Media"], keywords:["fintech","financial technology","payments","banking","insurtech","wealth management","lending"]
"climate investors" → orgTypes:["Investor","Family Office"], keywords:["climate","cleantech","sustainability","renewable","carbon","ESG","net zero","green energy"]
"AI startups" → orgTypes:["Product Startup","Product Scaleup"], keywords:["artificial intelligence","machine learning","AI","LLM","deep learning","generative AI"]

Return ONLY the JSON, no markdown.`,
      messages: [{ role: 'user', content: query }],
    }),
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  const text = (data.content[0]?.text || '').trim()
    .replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(text);
}

function matchesAIFilter(c, { orgTypes, locations, keywords }) {
  // When orgTypes are set, keywords describe the TOPIC — check against topic fields.
  // Include company name (e.g. "Fintech Futures" → matches "fintech") but exclude
  // person name and orgType field to avoid noise.
  // When no orgTypes, also include person name for broader discovery.
  const topicText = [c.company, c.industry, c.notes, c.role, c.website, c.basedIn]
    .map(f => (f || '').toLowerCase()).join(' ');
  const allText = [c.name, c.orgType, c.industry, c.basedIn, c.notes, c.role, c.website]
    .map(f => (f || '').toLowerCase()).join(' ');

  const orgMatch = orgTypes.length === 0
    || orgTypes.some(ot => (c.orgType || '').toLowerCase().includes(ot.toLowerCase()));
  const locMatch = locations.length === 0
    || locations.some(l => (c.basedIn || '').toLowerCase().includes(l.toLowerCase()));
  const searchText = orgTypes.length > 0 ? topicText : allText;
  const kwMatch = keywords.length === 0
    || keywords.some(kw => searchText.includes(kw.toLowerCase()));

  // Logic: if both orgType and location specified → must satisfy both; keywords are bonus
  // If only orgTypes → must satisfy orgType AND at least one keyword (if keywords provided)
  // If only locations → must be in location AND have keyword match
  // If only keywords → full text search
  if (orgTypes.length > 0 && locations.length > 0) return orgMatch && locMatch;
  if (orgTypes.length > 0) return orgMatch && (keywords.length === 0 || kwMatch);
  if (locations.length > 0) return locMatch && (keywords.length === 0 || kwMatch);
  return kwMatch;
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function firstEmail(str) {
  if (!str) return null;
  const match = str.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  return match ? match[0] : null;
}

// Parse "Name (email)" or plain "email" into { name, email }
function parsePart(p) {
  const named = p.match(/^(.*?)\s*\(([^)]*@[^)]*)\)\s*$/);
  if (named) return { name: named[1].trim(), email: named[2].trim() };
  if (/^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(p)) return { name: null, email: p };
  const email = firstEmail(p);
  return { name: p.replace(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i, '').replace(/[()<>]/g, '').trim() || p, email };
}

function ContactEntry({ name, email }) {
  return (
    <div style={{ lineHeight: '1.5' }}>
      {name && <div style={{ fontSize: '11px', color: '#6b6b85' }}>{name.length > 28 ? name.slice(0, 28) + '…' : name}</div>}
      {email
        ? <a href={`mailto:${email}`} style={{ fontSize: '12px', color: '#34d399', textDecoration: 'none' }}
            onMouseOver={e => { e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseOut={e => { e.currentTarget.style.textDecoration = 'none'; }}
          >{email}</a>
        : <span style={{ fontSize: '12px', color: '#4a4a65' }}>—</span>
      }
    </div>
  );
}

function ContactCell({ value }) {
  const [expanded, setExpanded] = useState(false);
  const parts = value.split(';').map(s => s.trim()).filter(Boolean);
  const parsed = parts.map(parsePart);

  if (expanded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {parsed.map((p, i) => <ContactEntry key={i} {...p} />)}
        <button onClick={() => setExpanded(false)}
          style={{ alignSelf: 'flex-start', marginTop: '2px', fontSize: '10px', color: '#3a3a52', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ▲ less
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
      <ContactEntry {...parsed[0]} />
      {parts.length > 1 && (
        <button onClick={() => setExpanded(true)}
          style={{ flexShrink: 0, marginTop: '2px', fontSize: '11px', color: '#c4befc', background: `${PURPLE}30`, border: `1px solid ${PURPLE}50`, borderRadius: '8px', padding: '1px 6px', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>
          +{parts.length - 1}
        </button>
      )}
    </div>
  );
}

function exportCSV(contacts, label) {
  const headers = ['Company', 'Org Type', 'Industry', 'Based In', 'Website', 'Associated Contact'];
  const rows = contacts.map(c =>
    [c.name, c.orgType, c.industry, c.basedIn, c.website, c.contact]
      .map(v => `"${(v || '').replace(/"/g, '""')}"`)
      .join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `seti-${label || 'contacts'}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Network overview ───────────────────────────────────────────────────────────

const ORG_GROUPS = [
  { label: 'Investors', query: 'all investors', orgTypes: ['Investor', 'Family Office', 'High-Net-Worth Individual'], color: '#9d94f0' },
  { label: 'Startups', query: 'startups', orgTypes: ['Product Startup', 'Product Scaleup'], color: '#34d399' },
  { label: 'Media', query: 'journalists', orgTypes: ['Media'], color: '#60a5fa' },
  { label: 'Corporates', query: 'corporates', orgTypes: ['Corporation', 'Bank'], color: '#fbbf24' },
  { label: 'Service Providers', query: 'service providers', orgTypes: ['Service Provider'], color: '#f87171' },
  { label: 'Events', query: 'event organizers', orgTypes: ['Event Organizer'], color: '#a78bfa' },
  { label: 'Accelerators', query: 'accelerators', orgTypes: ['Accelerator/ Incubator'], color: '#2dd4bf' },
  { label: 'NGOs / Gov', query: 'ngo government', orgTypes: ['NGO', 'Policymaker/ Public Sector Agency'], color: '#94a3b8' },
];

const REGION_GROUPS = [
  { label: 'United States', query: 'contacts in united states', locations: ['United States'] },
  { label: 'Bulgaria', query: 'contacts in Bulgaria', locations: ['Bulgaria'] },
  { label: 'Romania', query: 'contacts in Romania', locations: ['Romania'] },
  { label: 'Germany', query: 'contacts in Germany', locations: ['Germany'] },
  { label: 'United Kingdom', query: 'contacts in united kingdom', locations: ['United Kingdom'] },
  { label: 'CEE', query: 'contacts in CEE', locations: ['Bulgaria', 'Romania', 'Poland', 'Greece', 'Czechia', 'Hungary', 'Croatia', 'Serbia', 'Slovakia', 'Albania', 'Ukraine', 'Estonia', 'Latvia', 'Lithuania', 'Moldova', 'Montenegro', 'North Macedonia', 'Bosnia and Herzegovina'] },
  { label: 'DACH', query: 'contacts in DACH', locations: ['Germany', 'Austria', 'Switzerland'] },
  { label: 'UAE / MENA', query: 'investors in UAE', locations: ['UAE', 'United Arab Emirates', 'Dubai', 'Abu Dhabi', 'Sharjah', 'MENA'] },
];

function NetworkOverview({ contacts, onQuery }) {
  function countForGroup(group) {
    return contacts.filter(c => group.orgTypes.some(ot => (c.orgType || '').toLowerCase().includes(ot.toLowerCase()))).length;
  }
  function countForRegion(group) {
    return contacts.filter(c => group.locations.some(l => (c.basedIn || '').toLowerCase().includes(l.toLowerCase()))).length;
  }

  return (
    <div style={{ marginBottom: '28px' }}>
      <p style={{ fontSize: '11px', fontWeight: '700', color: '#4a4a65', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>
        Browse by type
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', marginBottom: '20px' }}>
        {ORG_GROUPS.map(g => {
          const count = countForGroup(g);
          return (
            <button key={g.label} onClick={() => onQuery(g.query)}
              style={{ padding: '12px 14px', background: '#111119', border: `1px solid #1e1e2e`, borderRadius: '10px', textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = g.color; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#1e1e2e'; }}
            >
              <div style={{ fontSize: '18px', fontWeight: '800', color: g.color, marginBottom: '2px' }}>{count.toLocaleString()}</div>
              <div style={{ fontSize: '11px', color: '#6b6b85', fontWeight: '500' }}>{g.label}</div>
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: '11px', fontWeight: '700', color: '#4a4a65', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>
        Browse by region
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {REGION_GROUPS.map(g => {
          const count = countForRegion(g);
          return (
            <button key={g.label} onClick={() => onQuery(g.query)}
              style={{ padding: '7px 14px', background: '#111119', border: '1px solid #1e1e2e', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = PURPLE; e.currentTarget.style.background = '#17172a'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.background = '#111119'; }}
            >
              <span style={{ fontSize: '12px', color: '#c8c8d8', fontWeight: '500' }}>{g.label}</span>
              <span style={{ fontSize: '11px', color: '#3a3a52', background: '#0d0d16', borderRadius: '10px', padding: '1px 6px' }}>{count.toLocaleString()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'all investors', 'investors in UAE', 'journalists in Germany',
  'event organizers in CEE', 'startups in Poland', 'investors with contact',
  'media contacts in DACH', 'service providers in Bulgaria', 'accelerators',
  'climate tech companies', 'fintech investors in Europe', 'B2B SaaS startups',
];

export default function Admin({ contacts: rawContacts, loading }) {
  const [query, setQuery] = useState('');
  const [showOverview, setShowOverview] = useState(true);

  // ── Local overrides (inline edits) ──────────────────────────────────────────
  const [localOverrides, setLocalOverrides] = useState(loadLocalOverrides);
  const [ghToken, setGhToken]               = useState(() => localStorage.getItem(GH_TOKEN_STORAGE) || '');
  const [ghStatus, setGhStatus]             = useState(null); // null | 'pushing' | 'ok' | string(error)
  const [showEditPanel, setShowEditPanel]   = useState(false);

  // Apply overrides on top of raw contacts
  const contacts = useMemo(() => {
    if (Object.keys(localOverrides).length === 0) return rawContacts;
    return rawContacts.map(c => {
      const ov = localOverrides[overrideKey(c)];
      return ov ? { ...c, ...ov } : c;
    });
  }, [rawContacts, localOverrides]);

  function applyOverride(c, patch) {
    const key     = overrideKey(c);
    const updated = { ...localOverrides, [key]: { ...(localOverrides[key] || {}), ...patch } };
    setLocalOverrides(updated);
    localStorage.setItem(OVERRIDES_STORAGE, JSON.stringify(updated));
  }

  function clearAllOverrides() {
    setLocalOverrides({});
    localStorage.removeItem(OVERRIDES_STORAGE);
  }

  async function pushToGitHub() {
    if (!ghToken) return;
    setGhStatus('pushing');
    try {
      // Read current overrides.json from GitHub
      const getRes = await fetch(
        `https://api.github.com/repos/${GH_REPO}/contents/${GH_OVERRIDES_PATH}`,
        { headers: { Authorization: `token ${ghToken}`, Accept: 'application/vnd.github+json' } }
      );
      if (!getRes.ok) throw new Error(`GitHub read failed: ${getRes.status}`);
      const fileData   = await getRes.json();
      const currentObj = JSON.parse(atob(fileData.content.replace(/\n/g, '')));

      // Merge: local overrides keyed as "co|name" map to company key in overrides.json
      const merged = { ...currentObj };
      for (const [k, patch] of Object.entries(localOverrides)) {
        const coKey = k.includes('|') ? k.split('|')[0] : k;
        merged[coKey] = { ...(merged[coKey] || {}), ...patch };
      }

      // Write back
      const putRes = await fetch(
        `https://api.github.com/repos/${GH_REPO}/contents/${GH_OVERRIDES_PATH}`,
        {
          method: 'PUT',
          headers: { Authorization: `token ${ghToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `chore: update contact overrides from admin UI (${Object.keys(localOverrides).length} changes)`,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(merged, null, 2)))),
            sha: fileData.sha,
            branch: 'claude/market-entry-navigator-mvp-n5McH',
          }),
        }
      );
      if (!putRes.ok) {
        const err = await putRes.json();
        throw new Error(err.message || `GitHub write failed: ${putRes.status}`);
      }
      setGhStatus('ok');
      setTimeout(() => setGhStatus(null), 3000);
    } catch (e) {
      setGhStatus(e.message);
    }
  }

  // ── API key for AI search — auto-open the panel if no key is set yet ────────
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '');
  const [showKeyInput, setShowKeyInput] = useState(() => !localStorage.getItem(API_KEY_STORAGE));
  const [keyDraft, setKeyDraft] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '');

  // AI search state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExpansion, setAiExpansion] = useState(null); // { orgTypes, locations, keywords }
  const [aiError, setAiError] = useState(null);
  const debounceRef = useRef(null);

  // Persist API key
  useEffect(() => {
    if (apiKey) localStorage.setItem(API_KEY_STORAGE, apiKey);
  }, [apiKey]);

  // Debounced AI expansion — fires 700ms after the user stops typing
  useEffect(() => {
    setAiExpansion(null);
    setAiError(null);

    if (!query.trim() || !apiKey) {
      setAiLoading(false);
      return;
    }

    // Don't use AI for the simple "with contact/email" filter
    if (/with (contact|email)|has (contact|email)/.test(query.toLowerCase())) {
      setAiLoading(false);
      return;
    }

    setAiLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const expansion = await expandQueryWithAI(query, apiKey);
        setAiExpansion(expansion);
      } catch (err) {
        setAiError(err.message);
      } finally {
        setAiLoading(false);
      }
    }, 700);

    return () => clearTimeout(debounceRef.current);
  }, [query, apiKey]);

  const parsed = useMemo(() => parseQuery(query), [query]);

  // How much useful info does this contact have? Higher = shown first.
  const richnessScore = useCallback((c) => {
    let s = 0;
    if (c.orgType)    s += 2;
    if (c.industry)   s += 1;
    if (c.basedIn)    s += 1;
    if (c.contact)    s += 2;
    if (c.website)    s += 1;
    // Notes beyond the bare "LinkedIn connection" boilerplate
    if (c.notes && !/^LinkedIn connection( · Connected: [\d-]+)?$/.test(c.notes)) s += 1;
    if (c.connection === 'warm')      s += 3;
    if (c.source === 'notion-warm')   s += 2;
    if (c.source === 'events')        s += 1;
    return s;
  }, []);

  const results = useMemo(() => {
    // No query: sort all contacts by richness so best-data contacts appear first
    if (!query.trim()) return [...contacts].sort((a, b) => richnessScore(b) - richnessScore(a));

    // "with contact/email" special case — always keyword-driven
    if (/with (contact|email)|has (contact|email)/.test(query.toLowerCase())) {
      const rest = query.toLowerCase().replace(/with (contact|email)|has (contact|email)/g, '').trim();
      const base = rest ? contacts.filter(c => matchesFilter(c, parseQuery(rest))) : contacts;
      return base.filter(c => c.contact).sort((a, b) => richnessScore(b) - richnessScore(a));
    }

    // Direct company/name matches always surface first — even in AI mode.
    // This ensures searching "Europe Cloud" finds that company before any
    // location/org-type expanded results.
    const raw = query.toLowerCase().trim();

    function directScore(c) {
      const co       = (c.company || '').toLowerCase();
      const nm       = (c.name    || '').toLowerCase();
      // Person contacts (distinct name) rank ahead of company-level entries (name===company).
      // Add 0.5 to company-level entries so individual contacts always come first.
      const personBonus = (nm && nm !== co) ? 0 : 0.5;
      if (co === raw || nm === raw)                  return personBonus;       // exact
      if (co.startsWith(raw) || nm.startsWith(raw)) return 1 + personBonus;  // prefix
      if (co.includes(raw))                          return 2 + personBonus;  // company contains
      if (nm.includes(raw))                          return 3;                // name contains
      return Infinity;
    }

    // For pure orgType/location keyword searches (no leftover text), name-based
    // direct matches only make sense when the contact also satisfies the filter.
    // This prevents "Startups Magazine" (orgType=Media) from appearing at the top
    // when searching "startups" (orgType filter for Product Startup).
    // For plain text searches (no structured filter) all name matches are kept.
    const isFilterOnly = (parsed.orgTypes.length > 0 || parsed.locations.length > 0) && !parsed.remainder;

    const directMatches = contacts
      .filter(c => {
        if (directScore(c) >= Infinity) return false;
        if (isFilterOnly) return matchesFilter(c, parsed);
        return true;
      })
      .sort((a, b) => directScore(a) - directScore(b) || richnessScore(b) - richnessScore(a));

    const directIds = new Set(directMatches.map(c => c.id));

    // AI mode: expanded criteria for everything except direct matches (already above).
    // When isFilterOnly (pure category search), AI matches must also satisfy the
    // structured filter — prevents "EU-Startups" (industry: "Startup News/Content")
    // from matching on the "startup" AI keyword when the user wants actual startups.
    if (aiExpansion) {
      const aiMatches = contacts
        .filter(c => {
          if (directIds.has(c.id)) return false;
          if (isFilterOnly && !matchesFilter(c, parsed)) return false;
          return matchesAIFilter(c, aiExpansion);
        })
        .sort((a, b) => richnessScore(b) - richnessScore(a));
      return [...directMatches, ...aiMatches];
    }

    // Keyword/location filter results — sorted by richness within the group
    const structuredMatches = contacts
      .filter(c => !directIds.has(c.id) && matchesFilter(c, parsed))
      .sort((a, b) => richnessScore(b) - richnessScore(a));

    return [...directMatches, ...structuredMatches];
  }, [contacts, query, parsed, aiExpansion, richnessScore]);

  function setQueryAndSearch(q) {
    setQuery(q);
    setShowOverview(false);
  }

  const hasApiKey = Boolean(apiKey);

  return (
    <div style={{ padding: '32px 24px 60px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: PURPLE, textTransform: 'uppercase', letterSpacing: '0.8px' }}>SETI Internal</span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#e8e8f0', letterSpacing: '-0.5px', margin: '4px 0 2px' }}>
            Contact Database
          </h1>
          <p style={{ fontSize: '13px', color: '#4a4a65' }}>
            {loading ? 'Loading…' : (() => {
              const li = contacts.filter(c => c.source === 'linkedin').length;
              const sh = contacts.filter(c => c.source !== 'linkedin').length;
              const withContact = contacts.filter(c => c.contact).length;
              const parts = [];
              if (li) parts.push(`${li.toLocaleString()} LinkedIn`);
              if (sh) parts.push(`${sh.toLocaleString()} curated`);
              return `${contacts.length.toLocaleString()} contacts (${parts.join(' + ')}) · ${withContact.toLocaleString()} with contact info`;
            })()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Pending edits button */}
          {Object.keys(localOverrides).length > 0 && (
            <button onClick={() => setShowEditPanel(o => !o)}
              style={{ padding: '8px 14px', background: '#1a1400', border: '1px solid #fbbf2440', borderRadius: '8px', fontSize: '12px', color: '#fbbf24', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              ✎ {Object.keys(localOverrides).length} edit{Object.keys(localOverrides).length > 1 ? 's' : ''}
            </button>
          )}
          {/* AI key button */}
          <button
            onClick={() => { setShowKeyInput(o => !o); setKeyDraft(apiKey); }}
            title={hasApiKey ? 'AI search active — click to update key' : 'Set Anthropic API key to enable AI search'}
            style={{
              padding: '8px 14px', background: 'transparent',
              border: `1px solid ${hasApiKey ? '#7c6fe040' : '#1e1e2e'}`,
              borderRadius: '8px', fontSize: '12px',
              color: hasApiKey ? PURPLE : '#3a3a52',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            <span>{hasApiKey ? '✦' : '○'}</span>
            <span>AI search {hasApiKey ? 'on' : 'off'}</span>
          </button>
          <button
            onClick={() => setShowOverview(o => !o)}
            style={{ padding: '8px 16px', background: 'transparent', border: `1px solid #1e1e2e`, borderRadius: '8px', fontSize: '12px', color: '#4a4a65', cursor: 'pointer' }}
          >
            {showOverview ? 'Hide overview' : 'Show overview'}
          </button>
        </div>
      </div>

      {/* API key panel */}
      {showKeyInput && (
        <div style={{ marginBottom: '20px', padding: '18px 20px', background: '#0f0f1e', border: `1px solid ${PURPLE}40`, borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#c4befc', marginBottom: '3px' }}>
                ✦ Enable AI semantic search
              </p>
              <p style={{ fontSize: '12px', color: '#4a4a65', margin: 0 }}>
                Search with natural language — "climate tech founders in CEE", "who covers fintech", "B2B SaaS with enterprise clients". Claude expands your query across all fields including notes and industry. Stored in your browser only.
              </p>
            </div>
            {apiKey && (
              <button onClick={() => setShowKeyInput(false)}
                style={{ marginLeft: '16px', fontSize: '12px', color: '#3a3a52', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                ✕
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="password"
              value={keyDraft}
              onChange={e => setKeyDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && keyDraft) { setApiKey(keyDraft); setShowKeyInput(false); } }}
              placeholder="sk-ant-api03-…"
              style={{ flex: 1, padding: '10px 13px', background: '#0d0d16', border: `1px solid ${PURPLE}40`, borderRadius: '8px', fontSize: '13px', color: '#e8e8f0', outline: 'none', fontFamily: 'monospace' }}
            />
            <button
              onClick={() => { if (keyDraft) { setApiKey(keyDraft); setShowKeyInput(false); } }}
              disabled={!keyDraft}
              style={{ padding: '10px 20px', background: keyDraft ? PURPLE : '#1a1a2e', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: keyDraft ? '#fff' : '#3a3a52', cursor: keyDraft ? 'pointer' : 'default' }}
            >
              Enable
            </button>
            {apiKey && (
              <button
                onClick={() => { setApiKey(''); localStorage.removeItem(API_KEY_STORAGE); setKeyDraft(''); }}
                style={{ padding: '10px 14px', background: 'transparent', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '12px', color: '#3a3a52', cursor: 'pointer' }}
              >
                Remove key
              </button>
            )}
          </div>
        </div>
      )}

      {/* Network overview */}
      {showOverview && !loading && (
        <NetworkOverview contacts={contacts} onQuery={setQueryAndSearch} />
      )}

      {/* Edit panel — pending local changes + GitHub push */}
      {showEditPanel && (
        <div style={{ marginBottom: '20px', padding: '18px 20px', background: '#0f1400', border: '1px solid #fbbf2430', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24', marginBottom: '3px' }}>✎ Pending edits — {Object.keys(localOverrides).length} contact{Object.keys(localOverrides).length > 1 ? 's' : ''}</p>
              <p style={{ fontSize: '12px', color: '#6b6b50', margin: 0 }}>Changes are live in your browser. Push to GitHub to make them permanent for everyone.</p>
            </div>
            <button onClick={() => setShowEditPanel(false)} style={{ fontSize: '12px', color: '#3a3a52', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>

          {/* GitHub token */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', color: '#6b6b50', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GitHub Personal Access Token (repo write scope)</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="password" value={ghToken}
                onChange={e => { setGhToken(e.target.value); localStorage.setItem(GH_TOKEN_STORAGE, e.target.value); }}
                placeholder="github_pat_… or ghp_…"
                style={{ flex: 1, padding: '8px 12px', background: '#0d0d16', border: '1px solid #fbbf2430', borderRadius: '8px', fontSize: '12px', color: '#e8e8f0', outline: 'none', fontFamily: 'monospace' }} />
              <button onClick={pushToGitHub} disabled={!ghToken || ghStatus === 'pushing'}
                style={{ padding: '8px 18px', background: ghToken ? '#fbbf2420' : '#111', border: `1px solid ${ghToken ? '#fbbf2460' : '#1e1e2e'}`, borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: ghToken ? '#fbbf24' : '#3a3a52', cursor: ghToken ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>
                {ghStatus === 'pushing' ? 'Pushing…' : ghStatus === 'ok' ? '✓ Pushed!' : 'Push to GitHub'}
              </button>
            </div>
            {ghStatus && ghStatus !== 'pushing' && ghStatus !== 'ok' && (
              <p style={{ fontSize: '11px', color: '#f87171', marginTop: '6px' }}>Error: {ghStatus}</p>
            )}
            <p style={{ fontSize: '11px', color: '#3a3a52', marginTop: '5px' }}>
              Creates or updates <code style={{ color: '#4a4a65' }}>data/overrides.json</code> on your feature branch.
              Generate a token at GitHub → Settings → Developer settings → Personal access tokens (classic), with <code style={{ color: '#4a4a65' }}>repo</code> scope.
            </p>
          </div>

          {/* Preview of pending changes */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', color: '#6b6b50', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending changes</p>
            <pre style={{ background: '#0a0a14', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#6b6b85', overflowX: 'auto', margin: 0, maxHeight: '200px' }}>
              {JSON.stringify(localOverrides, null, 2)}
            </pre>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(localOverrides, null, 2)); }}
              style={{ padding: '7px 14px', background: 'transparent', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '12px', color: '#4a4a65', cursor: 'pointer' }}>
              Copy JSON
            </button>
            <button onClick={() => { if (window.confirm('Clear all local edits?')) clearAllOverrides(); }}
              style={{ padding: '7px 14px', background: 'transparent', border: '1px solid #3a1a1a', borderRadius: '8px', fontSize: '12px', color: '#f87171', cursor: 'pointer' }}>
              Clear all edits
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); if (!showOverview && !e.target.value) setShowOverview(true); }}
            onKeyDown={e => { if (e.key === 'Escape') { setQuery(''); setShowOverview(true); } }}
            placeholder={hasApiKey
              ? '"climate tech investors in CEE" · "B2B SaaS startups with traction" · "who covers AI for major publications"'
              : '"investors in UAE" · "journalists in Germany" · "event organizers CEE" · "startups with email"'}
            autoFocus
            style={{
              width: '100%', padding: '13px 16px', boxSizing: 'border-box',
              background: '#111119', border: `1.5px solid ${PURPLE}`,
              borderRadius: '10px', fontSize: '14px', color: '#e8e8f0', outline: 'none', fontFamily: 'inherit',
            }}
          />
          {aiLoading && (
            <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: PURPLE, opacity: 0.7 }}>
              thinking…
            </span>
          )}
        </div>
        <button
          onClick={() => exportCSV(results, query || 'all')}
          disabled={results.length === 0}
          style={{
            padding: '13px 20px',
            background: results.length ? '#1a1a2e' : '#111119',
            color: results.length ? '#c4befc' : '#3a3a52',
            border: `1px solid ${results.length ? PURPLE : '#1e1e2e'}`,
            borderRadius: '10px', fontSize: '13px', fontWeight: '600',
            cursor: results.length ? 'pointer' : 'default', whiteSpace: 'nowrap',
          }}
        >
          Export ({results.length.toLocaleString()})
        </button>
      </div>

      {/* Suggestion chips */}
      {!query && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setQueryAndSearch(s)}
              style={{ padding: '5px 12px', background: 'transparent', border: '1px solid #1e1e2e', borderRadius: '20px', fontSize: '12px', color: '#4a4a65', cursor: 'pointer' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = PURPLE; e.currentTarget.style.color = '#c4befc'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.color = '#4a4a65'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Active filter tags */}
      {query && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
          {aiExpansion ? (
            <>
              <span style={{ fontSize: '11px', padding: '3px 9px', background: `${PURPLE}25`, border: `1px solid ${PURPLE}50`, borderRadius: '20px', color: PURPLE, fontWeight: '700' }}>✦ AI</span>
              {aiExpansion.orgTypes.map(ot => (
                <span key={ot} style={{ fontSize: '11px', padding: '3px 10px', background: `${PURPLE}20`, border: `1px solid ${PURPLE}40`, borderRadius: '20px', color: '#c4befc', fontWeight: '600' }}>{ot}</span>
              ))}
              {aiExpansion.locations.map(l => (
                <span key={l} style={{ fontSize: '11px', padding: '3px 10px', background: '#17172a', border: '1px solid #252535', borderRadius: '20px', color: '#6b6b85' }}>📍 {l}</span>
              ))}
              {aiExpansion.keywords.slice(0, 5).map(kw => (
                <span key={kw} style={{ fontSize: '11px', padding: '3px 10px', background: '#0f1a14', border: '1px solid #1a3020', borderRadius: '20px', color: '#34d39980' }}>{kw}</span>
              ))}
              {aiExpansion.keywords.length > 5 && (
                <span style={{ fontSize: '11px', color: '#3a3a52' }}>+{aiExpansion.keywords.length - 5} keywords</span>
              )}
            </>
          ) : (
            <>
              {parsed.orgTypes.map(ot => (
                <span key={ot} style={{ fontSize: '11px', padding: '3px 10px', background: `${PURPLE}20`, border: `1px solid ${PURPLE}40`, borderRadius: '20px', color: '#c4befc', fontWeight: '600' }}>{ot}</span>
              ))}
              {parsed.locations.map(l => (
                <span key={l} style={{ fontSize: '11px', padding: '3px 10px', background: '#17172a', border: '1px solid #252535', borderRadius: '20px', color: '#6b6b85' }}>📍 {l}</span>
              ))}
            </>
          )}
          {aiError && (
            <span style={{ fontSize: '11px', color: '#f87171' }}>AI error: {aiError}</span>
          )}
          <span style={{ fontSize: '11px', color: '#3a3a52' }}>→ {results.length.toLocaleString()} results</span>
          <button onClick={() => { setQuery(''); setShowOverview(true); }}
            style={{ fontSize: '11px', color: '#3a3a52', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '4px' }}>
            ✕ clear
          </button>
        </div>
      )}

      {/* Results table */}
      {query && (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #1e1e2e' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#111119', borderBottom: '2px solid #1e1e2e' }}>
                {['Company / Person', 'Connection', 'Org Type', 'Industry', 'Based In', 'Contact', 'Website'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#4a4a65', textTransform: 'uppercase', letterSpacing: '0.7px', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Group contacts by company so all people at the same company appear together
                const seen = new Map();
                const groups = [];
                for (const c of results.slice(0, 500)) {
                  const key = (c.company || c.name || '').toLowerCase().trim();
                  if (!seen.has(key)) { seen.set(key, groups.length); groups.push([]); }
                  groups[seen.get(key)].push(c);
                }

                return groups.map((group) => {
                  const companyName = group[0].company || group[0].name || '';
                  // Use best metadata: prefer curated entries for org info
                  const meta = group.find(c => c.source !== 'linkedin' && (c.orgType || c.industry || c.basedIn))
                    || group.find(c => c.orgType || c.industry || c.basedIn)
                    || group[0];
                  const connection = group.find(c => c.connection)?.connection;
                  const connStyle = connection === 'warm'
                    ? { color: '#34d399', bg: '#0f1a0a', border: '#34d39940' }
                    : connection === 'cold'
                    ? { color: '#60a5fa', bg: '#0a1429', border: '#60a5fa40' }
                    : null;
                  // People = contacts with a distinct person name; company-level entries last
                  const people = group.filter(c => c.name && c.name !== c.company);
                  const companyEntries = group.filter(c => !c.name || c.name === c.company);

                  // Collect all contacts/websites from the group
                  const allContacts = [...new Set(group.map(c => c.contact).filter(Boolean))];
                  const mainWebsite = meta.website || group.find(c => c.website && c.source !== 'linkedin')?.website || '';
                  const websiteLabel = mainWebsite ? mainWebsite.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : null;

                  // Company-level override key is always the bare company name — never a person key.
                  // This prevents company-row edits from colliding with person sub-row edits when
                  // `meta` happens to be a LinkedIn person (e.g. Salesforce → Tibor Horvath).
                  const coKey = companyName.toLowerCase().trim();
                  const coOv  = localOverrides[coKey] || {};
                  // Synthetic company contact used as the target for applyOverride on the header row.
                  // overrideKey({ company: X, name: X }) === X  (nm === co → returns plain company key)
                  const companyContact = { company: companyName, name: companyName };
                  // Display values for the header: company-level override wins, then meta's value
                  const displayOrgType  = coOv.orgType  ?? meta.orgType;
                  const displayIndustry = coOv.industry ?? meta.industry;
                  const displayBasedIn  = coOv.basedIn  ?? meta.basedIn;

                  return (
                    <React.Fragment key={companyName + group[0].id}>
                      {/* Company header row */}
                      <tr style={{ borderBottom: people.length ? 'none' : '1px solid #0f0f1a', background: '#0d0d17' }}>
                        <td style={{ padding: '9px 14px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          <div style={{ color: '#e8e8f0' }}>{companyName}</div>
                          {people.length > 0 && (
                            <div style={{ fontSize: '11px', color: '#4a4a65', marginTop: '1px' }}>
                              {people.length} contact{people.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                          {connStyle && (
                            <span style={{ fontSize: '10px', padding: '2px 8px', background: connStyle.bg, border: `1px solid ${connStyle.border}`, borderRadius: '10px', color: connStyle.color, fontWeight: '700', textTransform: 'capitalize' }}>
                              {connection}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '9px 14px', color: '#6b6b85', whiteSpace: 'nowrap' }}>
                          <EditableCell
                            value={displayOrgType}
                            options={AVAILABLE_ORG_TYPES}
                            placeholder="org type"
                            edited={!!coOv.orgType}
                            onSave={v => applyOverride(companyContact, { orgType: v })}
                          />
                        </td>
                        <td style={{ padding: '9px 14px', color: '#6b6b85' }}>
                          <EditableCell
                            value={displayIndustry}
                            placeholder="industry"
                            edited={!!coOv.industry}
                            onSave={v => applyOverride(companyContact, { industry: v })}
                          />
                        </td>
                        <td style={{ padding: '9px 14px', color: '#6b6b85', whiteSpace: 'nowrap' }}>
                          <EditableCell
                            value={displayBasedIn}
                            placeholder="location"
                            edited={!!coOv.basedIn}
                            onSave={v => applyOverride(companyContact, { basedIn: v })}
                          />
                        </td>
                        <td style={{ padding: '9px 14px', maxWidth: '220px' }}>
                          {allContacts[0] && <ContactCell value={allContacts[0]} />}
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          {websiteLabel && (
                            <a href={mainWebsite} target="_blank" rel="noreferrer"
                              style={{ color: PURPLE, fontSize: '12px', textDecoration: 'none' }}
                              onMouseOver={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                              onMouseOut={e => { e.currentTarget.style.textDecoration = 'none'; }}
                            >{websiteLabel}</a>
                          )}
                        </td>
                      </tr>
                      {/* Person sub-rows */}
                      {people.map((c, pi) => {
                        const isLinkedIn = c.source === 'linkedin';
                        const isLast = pi === people.length - 1;
                        const liUrl = isLinkedIn && c.website ? c.website : null;
                        return (
                          <tr key={c.id} style={{ borderBottom: isLast ? '2px solid #1a1a2e' : '1px solid #0a0a14', background: '#08080f' }}>
                            <td style={{ padding: '6px 14px 6px 28px', whiteSpace: 'nowrap' }}>
                              <span style={{ color: '#c8c8e0', fontWeight: '500' }}>{c.name}</span>
                              {c.role && <span style={{ color: '#4a4a65', fontSize: '11px' }}> · {c.role}</span>}
                            </td>
                            <td style={{ padding: '6px 14px' }}>
                              {isLinkedIn ? (
                                <span style={{ fontSize: '10px', padding: '2px 7px', background: '#0a1429', border: '1px solid #1e4080', borderRadius: '10px', color: '#60a5fa', fontWeight: '700' }}>LinkedIn</span>
                              ) : (
                                <span style={{ fontSize: '10px', padding: '2px 7px', background: '#0f1a0a', border: '1px solid #1a3010', borderRadius: '10px', color: '#34d399', fontWeight: '700' }}>Curated</span>
                              )}
                            </td>
                            <td /><td />
                            <td style={{ padding: '6px 14px', color: '#4a4a65', fontSize: '12px' }}>
                              <EditableCell
                                value={c.basedIn}
                                placeholder="location"
                                edited={!!localOverrides[overrideKey(c)]?.basedIn}
                                onSave={v => applyOverride(c, { basedIn: v })}
                              />
                            </td>
                            <td style={{ padding: '6px 14px', maxWidth: '220px' }}>
                              {c.contact && <ContactCell value={c.contact} />}
                            </td>
                            <td style={{ padding: '6px 14px' }}>
                              {liUrl && (
                                <a href={liUrl} target="_blank" rel="noreferrer"
                                  style={{ color: '#3a3a5a', fontSize: '12px', textDecoration: 'none' }}
                                  onMouseOver={e => { e.currentTarget.style.color = PURPLE; }}
                                  onMouseOut={e => { e.currentTarget.style.color = '#3a3a5a'; }}
                                >LinkedIn ↗</a>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>

          {results.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#3a3a52', fontSize: '13px' }}>
              No contacts matched — try different keywords{hasApiKey ? ' or rephrase your query' : ' or enable AI search for semantic queries'}
            </div>
          )}

          {results.length > 500 && (
            <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#3a3a52', borderTop: '1px solid #1e1e2e', background: '#0d0d16' }}>
              Showing 500 of {results.length.toLocaleString()} — use <strong style={{ color: '#4a4a65' }}>Export</strong> for the full list
            </div>
          )}
        </div>
      )}

      <GapBacklog />
    </div>
  );
}

// ── Gap Backlog ────────────────────────────────────────────────────────────────

const PRIORITY = ['high', 'medium', 'low'];
const PRIORITY_STYLE = {
  high:   { color: '#f87171', bg: '#1a0a0e', border: '#f8717130' },
  medium: { color: '#fbbf24', bg: '#1a1400', border: '#fbbf2430' },
  low:    { color: '#60a5fa', bg: '#0a1020', border: '#60a5fa30' },
};

function GapBacklog() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(BACKLOG_KEY) || '[]'); } catch { return []; }
  });
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('high');
  const [showDone, setShowDone] = useState(false);

  function persist(next) {
    setItems(next);
    localStorage.setItem(BACKLOG_KEY, JSON.stringify(next));
  }

  function add() {
    if (!desc.trim()) return;
    persist([{ id: Date.now(), description: desc.trim(), priority, createdAt: new Date().toISOString().slice(0, 10), resolved: false }, ...items]);
    setDesc('');
  }

  function resolve(id) { persist(items.map(i => i.id === id ? { ...i, resolved: true } : i)); }
  function reopen(id)  { persist(items.map(i => i.id === id ? { ...i, resolved: false } : i)); }
  function remove(id)  { persist(items.filter(i => i.id !== id)); }

  function copyOpen() {
    const text = items
      .filter(i => !i.resolved)
      .sort((a, b) => PRIORITY.indexOf(a.priority) - PRIORITY.indexOf(b.priority))
      .map(i => `[${i.priority.toUpperCase()}] ${i.description}  (${i.createdAt})`)
      .join('\n');
    navigator.clipboard?.writeText(text);
  }

  const open = items.filter(i => !i.resolved);
  const done = items.filter(i => i.resolved);

  return (
    <div style={{ marginTop: '56px', borderTop: '1px solid #1e1e2e', paddingTop: '32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#4a4a65', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>
            Relationship Gap Backlog
          </p>
          <p style={{ fontSize: '13px', color: '#4a4a65', margin: 0 }}>
            Flag missing relationship groups so the team knows where to build next.
          </p>
        </div>
        {open.length > 0 && (
          <button onClick={copyOpen}
            style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '12px', color: '#4a4a65', cursor: 'pointer' }}>
            Copy list
          </button>
        )}
      </div>

      {/* Add form */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add(); }}
          placeholder='"Media contacts in the Middle East" · "Climate tech investors in CEE"'
          style={{ flex: 1, minWidth: '240px', padding: '11px 14px', background: '#111119', border: '1px solid #1e1e2e', borderRadius: '10px', fontSize: '13px', color: '#e8e8f0', outline: 'none', fontFamily: 'inherit' }}
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          style={{ padding: '11px 12px', background: '#111119', border: '1px solid #1e1e2e', borderRadius: '10px', fontSize: '13px', color: PRIORITY_STYLE[priority].color, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {PRIORITY.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)} priority</option>)}
        </select>
        <button
          onClick={add}
          disabled={!desc.trim()}
          style={{ padding: '11px 20px', background: desc.trim() ? PURPLE : '#111119', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: desc.trim() ? '#fff' : '#3a3a52', cursor: desc.trim() ? 'pointer' : 'default' }}
        >
          Add gap
        </button>
      </div>

      {/* Open items */}
      {open.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#2a2a3a', fontStyle: 'italic' }}>No gaps logged yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
          {PRIORITY.map(prio => open.filter(i => i.priority === prio).map(item => {
            const s = PRIORITY_STYLE[item.priority];
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#0d0d16', border: `1px solid #1e1e2e`, borderRadius: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', padding: '2px 8px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', color: s.color, fontWeight: '700', flexShrink: 0 }}>
                  {item.priority}
                </span>
                <span style={{ flex: 1, fontSize: '13px', color: '#c8c8d8', minWidth: '160px' }}>{item.description}</span>
                <span style={{ fontSize: '11px', color: '#3a3a52', flexShrink: 0 }}>{item.createdAt}</span>
                <button onClick={() => resolve(item.id)}
                  style={{ fontSize: '11px', color: '#34d399', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', flexShrink: 0 }}>
                  ✓ Done
                </button>
                <button onClick={() => remove(item.id)}
                  style={{ fontSize: '12px', color: '#3a3a52', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}>
                  ×
                </button>
              </div>
            );
          }))}
        </div>
      )}

      {/* Resolved items */}
      {done.length > 0 && (
        <div>
          <button onClick={() => setShowDone(s => !s)}
            style={{ fontSize: '12px', color: '#3a3a52', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '10px' }}>
            {showDone ? '▾' : '▸'} Resolved ({done.length})
          </button>
          {showDone && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {done.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', background: 'transparent', border: '1px solid #111119', borderRadius: '10px', opacity: 0.5 }}>
                  <span style={{ fontSize: '10px', padding: '2px 8px', background: '#111119', borderRadius: '10px', color: '#3a3a52', fontWeight: '600' }}>{item.priority}</span>
                  <span style={{ flex: 1, fontSize: '13px', color: '#4a4a65', textDecoration: 'line-through' }}>{item.description}</span>
                  <span style={{ fontSize: '11px', color: '#2a2a3a' }}>{item.createdAt}</span>
                  <button onClick={() => reopen(item.id)}
                    style={{ fontSize: '11px', color: '#4a4a65', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
                    Reopen
                  </button>
                  <button onClick={() => remove(item.id)}
                    style={{ fontSize: '12px', color: '#2a2a3a', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

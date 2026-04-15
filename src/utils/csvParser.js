const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1_REP2jJbLAuGXBe8cmXuFjgCiaXBHsra-KfDdmNFKpM/export?format=csv';

const HEALTH_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1HvdzZqgFV-wZLaArg830jjC0jifiwF9NPw5fDSkyEUg/export?format=csv';

const ROW_NAME = /^row\s*\d+$/i;

function nameFromWebsite(url) {
  if (!url) return null;
  const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].trim();
  if (!domain) return null;
  const base = domain.split('.')[0];
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : null;
}

function parseTier(orgType) {
  if (!orgType) return 'free';
  const lower = orgType.toLowerCase();
  if (['investor', 'family office', 'high-net-worth', 'enterprise'].some(k => lower.includes(k))) return 'paid';
  return 'free';
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else current += char;
  }
  result.push(current.trim());
  return result;
}

// Maps the "I am attending as a" field to a canonical orgType.
// Multi-select values (comma-separated) are ranked by priority: Investor first.
function mapHealthOrgType(val) {
  if (!val) return '';
  const PRIORITY = [
    [['investor'], 'Investor'],
    [['pharma', 'biotech', 'hospital', 'health system', 'insurance', 'payer'], 'Corporation'],
    [['startup', 'founder'], 'Product Startup'],
    [['researcher', 'academic'], 'Research'],
    [['policymaker', 'public sector'], 'Policymaker/ Public Sector Agency'],
    [['ecosystem'], 'Service Provider'],
  ];
  const parts = val.split(',').map(s => s.trim().toLowerCase());
  for (const [keywords, orgType] of PRIORITY) {
    if (parts.some(p => keywords.some(k => p.includes(k)))) return orgType;
  }
  return '';
}

async function fetchSheetContacts() {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) return [];
    const text = await response.text();
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
    return lines.slice(1).map((line) => {
      const values = parseCSVLine(line);
      const row = {};
      headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
      return {
        name: row['name'] || '',
        role: row['role'] || '',
        company: row['company'] || row['name'] || '',
        basedIn: row['based_in'] || '',
        orgType: row['organization_type'] || '',
        industry: row['industry'] || '',
        website: row['website'] || '',
        contact: row['email'] || row['associated_email'] || '',
        notes: row['notes'] || '',
        tier: parseTier(row['organization_type']),
        source: 'sheet',
      };
    }).map((c) => {
      // Fix "Row XXXX" placeholder names
      if (ROW_NAME.test(c.name)) {
        const derived = nameFromWebsite(c.website);
        if (!derived) return null; // no website — drop it
        c.name = derived;
        c.company = derived;
      }
      return c;
    }).filter(Boolean).filter((c) => c.name);
  } catch (_) {
    return [];
  }
}

async function fetchNotionContacts() {
  try {
    const jsonUrl = import.meta.env.BASE_URL + 'contacts.json';
    const res = await fetch(jsonUrl);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (_) {
    return [];
  }
}

async function fetchHealthEventContacts() {
  try {
    const response = await fetch(HEALTH_SHEET_URL);
    if (!response.ok) return [];
    const text = await response.text();
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return [];
    // Headers are kept as-is (lowercased) for lookup
    const rawHeaders = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
    return lines.slice(1).map((line) => {
      const values = parseCSVLine(line);
      const row = {};
      rawHeaders.forEach((h, i) => { row[h] = (values[i] ?? '').trim(); });

      // Prefer first_name + last_name (better casing); fall back to name column
      const firstName = row['first_name'] || '';
      const lastName  = row['last_name']  || '';
      const fullName  = (firstName + ' ' + lastName).trim() || row['name'] || '';
      if (!fullName) return null;

      const company = row['what company do you work for?'] || '';
      if (!company) return null;

      const orgType  = mapHealthOrgType(row['i am attending as a'] || '');
      const lookingFor = row['what are you looking for at this event? (multi-select)'] || '';

      return {
        name:     fullName,
        role:     row['what is your job title?'] || '',
        company:  company.trim(),
        basedIn:  row['where is your company based?'] || '',
        orgType,
        industry: 'Health',
        website:  '',
        contact:  row['email'] || '',
        notes:    lookingFor ? `Looking for: ${lookingFor}` : '',
        tier:     parseTier(orgType),
        source:   'health-event',
      };
    }).filter(Boolean);
  } catch (_) {
    return [];
  }
}

export async function fetchContacts() {
  // Fetch all sources in parallel and merge
  const [sheetContacts, notionContacts, healthContacts] = await Promise.all([
    fetchSheetContacts(),
    fetchNotionContacts(),
    fetchHealthEventContacts(),
  ]);

  // Company-level entries (sheet, notion, curated): one per company name.
  // Person-level entries (linkedin, health-event): one per (company + person name).
  const seenCompanies    = new Set();
  const seenPersons      = new Set();
  // Tracks every person name added from a curated source.
  // LinkedIn entries whose name is already present are suppressed.
  const seenCuratedNames = new Set();
  const merged = [];

  // 1. Sheet contacts — highest priority, curated source.
  // Company-level entries (name === company) dedup by company key.
  // Person-level entries (name ≠ company, e.g. "Cherian Varghese" at "Oracle") dedup
  // by name+company pair so multiple people from the same company all make it through.
  for (const c of sheetContacts) {
    const nm = (c.name || '').toLowerCase().trim();
    const co = (c.company || c.name || '').toLowerCase().trim();
    if (nm && nm !== co) {
      // Person-level sheet entry
      if (nm && seenCuratedNames.has(nm)) continue;
      const personKey = co + '|' + nm;
      if (seenPersons.has(personKey)) continue;
      seenPersons.add(personKey);
      seenCuratedNames.add(nm);
      merged.push({ ...c, id: merged.length });
    } else {
      // Company-level sheet entry
      if (seenCompanies.has(co)) continue;
      seenCompanies.add(co);
      if (c.name) seenCuratedNames.add(nm);
      merged.push({ ...c, id: merged.length });
    }
  }

  // 2. Notion/contacts.json — company-level entries (non-linkedin, non-dealflow)
  for (const c of notionContacts) {
    if (c.source === 'linkedin' || c.source === 'dealflow') continue;
    const key = (c.company || c.name).toLowerCase().trim();
    if (!seenCompanies.has(key)) {
      seenCompanies.add(key);
      if (c.name) seenCuratedNames.add(c.name.toLowerCase().trim());
      merged.push({ ...c, id: merged.length });
    }
  }

  // 3. Health event contacts (person-level, curated — higher priority than LinkedIn)
  for (const c of healthContacts) {
    const nm = (c.name || '').toLowerCase().trim();
    if (nm && seenCuratedNames.has(nm)) continue; // already in curated data
    const personKey = ((c.company || '') + '|' + nm).toLowerCase().trim();
    if (!seenPersons.has(personKey)) {
      seenPersons.add(personKey);
      if (nm) seenCuratedNames.add(nm); // prevent LinkedIn duplicate for same person
      merged.push({ ...c, id: merged.length });
    }
  }

  // 3b. Dealflow contacts (person-level, curated — higher priority than LinkedIn)
  for (const c of notionContacts) {
    if (c.source !== 'dealflow') continue;
    const nm = (c.name || '').toLowerCase().trim();
    if (nm && seenCuratedNames.has(nm)) continue;
    const personKey = ((c.company || '') + '|' + nm).toLowerCase().trim();
    if (!seenPersons.has(personKey)) {
      seenPersons.add(personKey);
      if (nm) seenCuratedNames.add(nm);
      merged.push({ ...c, id: merged.length });
    }
  }

  // 4. LinkedIn contacts (person-level, lowest priority)
  for (const c of notionContacts) {
    if (c.source !== 'linkedin') continue;
    const nm = (c.name || '').toLowerCase().trim();
    if (nm && seenCuratedNames.has(nm)) continue; // curated/health entry already covers this person
    const personKey = ((c.company || '') + '|' + nm).toLowerCase().trim();
    if (!seenPersons.has(personKey)) {
      seenPersons.add(personKey);
      merged.push({ ...c, id: merged.length });
    }
  }

  return merged;
}

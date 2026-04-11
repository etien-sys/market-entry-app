const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1_REP2jJbLAuGXBe8cmXuFjgCiaXBHsra-KfDdmNFKpM/export?format=csv';

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
        notes: row['notes'] || '',
        tier: parseTier(row['organization_type']),
      };
    }).filter((c) => c.name);
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

export async function fetchContacts() {
  // Fetch both sources in parallel and merge
  const [sheetContacts, notionContacts] = await Promise.all([
    fetchSheetContacts(),
    fetchNotionContacts(),
  ]);

  // Deduplicate by company name (sheet contacts take priority for name/role fields)
  const seen = new Set();
  const merged = [];

  for (const c of sheetContacts) {
    const key = (c.company || c.name).toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({ ...c, id: merged.length });
    }
  }
  for (const c of notionContacts) {
    const key = (c.company || c.name).toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({ ...c, id: merged.length });
    }
  }

  return merged;
}

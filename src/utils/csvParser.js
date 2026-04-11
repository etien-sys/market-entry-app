const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1_REP2jJbLAuGXBe8cmXuFjgCiaXBHsra-KfDdmNFKpM/export?format=csv';

export async function fetchContacts() {
  // Try Notion-synced JSON first
  try {
    const jsonUrl = import.meta.env.BASE_URL + 'contacts.json';
    const res = await fetch(jsonUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (_) {}

  // Fall back to Google Sheet CSV
  function parseTier(orgType) {
    if (!orgType) return 'free';
    const lower = orgType.toLowerCase();
    if (lower.includes('investor') || lower.includes('enterprise')) return 'paid';
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

  const response = await fetch(SHEET_URL);
  if (!response.ok) throw new Error(`Failed to fetch contacts: ${response.status}`);
  const text = await response.text();
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const contacts = lines.slice(1).map((line, idx) => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return {
      id: idx,
      name: row['name'] || '',
      role: row['role'] || '',
      company: row['company'] || '',
      basedIn: row['based_in'] || '',
      orgType: row['organization_type'] || '',
      industry: row['industry'] || '',
      website: row['website'] || '',
      notes: row['notes'] || '',
      tier: parseTier(row['organization_type']),
    };
  });
  return contacts.filter((c) => c.name);
}

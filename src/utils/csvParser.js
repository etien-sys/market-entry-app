const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1_REP2jJbLAuGXBe8cmXuFjgCiaXBHsra-KfDdmNFKpM/export?format=csv';

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
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function fetchContacts() {
  const response = await fetch(SHEET_URL);
  if (!response.ok) throw new Error(`Failed to fetch sheet: ${response.status}`);
  const text = await response.text();

  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));

  const contacts = lines.slice(1).map((line, idx) => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });

    return {
      id: idx,
      name: row['name'] || '',
      role: row['role'] || '',
      company: row['company'] || '',
      basedIn: row['based_in'] || '',
      orgType: row['organization_type'] || '',
      notes: row['notes'] || '',
      tier: parseTier(row['organization_type']),
    };
  });

  return contacts.filter((c) => c.name);
}

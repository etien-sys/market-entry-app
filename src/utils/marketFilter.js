const MARKET_LOCATIONS = {
  UAE: ['uae', 'united arab emirates', 'dubai', 'abu dhabi', 'sharjah', 'mena'],
  CEE: [
    'albania', 'bosnia', 'bulgaria', 'croatia', 'cyprus', 'czechia', 'czech republic',
    'estonia', 'greece', 'hungary', 'latvia', 'lithuania', 'moldova', 'montenegro',
    'north macedonia', 'poland', 'romania', 'serbia', 'slovakia', 'slovenia',
    'ukraine', 'nordics', 'cee', 'balkans',
    'sofia', 'bucharest', 'athens', 'zagreb', 'warsaw', 'prague', 'budapest',
  ],
  DACH: [
    'germany', 'austria', 'switzerland', 'deutschland',
    'berlin', 'munich', 'hamburg', 'vienna', 'zurich', 'geneva',
  ],
  US: [
    'united states', 'usa', 'new york', 'san francisco', 'los angeles',
    'chicago', 'boston', 'seattle', 'austin', 'miami',
  ],
  All: [],
};

export function filterByMarket(contacts, market) {
  if (market === 'All') return contacts;
  const keywords = MARKET_LOCATIONS[market] || [];
  return contacts.filter((c) => {
    const loc = c.basedIn.toLowerCase();
    return keywords.some((kw) => loc.includes(kw));
  });
}

export const ORG_TYPE_COLORS = {
  Investor: '#9d94f0',
  Enterprise: '#34d399',
  Events: '#fbbf24',
  Startup: '#f87171',
  'Service Provider': '#94a3b8',
  Media: '#60a5fa',
};

export function getOrgColor(orgType) {
  if (!orgType) return '#9CA3AF';
  for (const [key, color] of Object.entries(ORG_TYPE_COLORS)) {
    if (orgType.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#9CA3AF';
}

export const CATEGORY_FILTERS = ['All', 'Investor', 'Startup', 'Corporate', 'Events', 'Media', 'Service Provider'];

const CATEGORY_KEYWORDS = {
  Investor: ['investor', 'family office', 'high-net-worth'],
  Startup: ['startup', 'scaleup', 'accelerator', 'incubator'],
  Corporate: ['corporation', 'bank', 'enterprise'],
  Events: ['event organizer', 'events'],
  Media: ['media'],
  'Service Provider': ['service provider'],
};

export function filterByCategory(contacts, category) {
  if (category === 'All') return contacts;
  const keywords = CATEGORY_KEYWORDS[category] || [category.toLowerCase()];
  return contacts.filter((c) => {
    const ot = (c.orgType || '').toLowerCase();
    return keywords.some((k) => ot.includes(k));
  });
}

const MARKET_LOCATIONS = {
  UAE: ['uae', 'dubai', 'abu dhabi', 'sharjah'],
  'Saudi Arabia': ['saudi arabia', 'riyadh', 'jeddah', 'ksa'],
  CEE: ['sofia', 'bucharest', 'athens', 'zagreb', 'london', 'warsaw', 'prague', 'budapest'],
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
  Investor: '#7F77DD',
  Enterprise: '#0D9488',
  Events: '#D97706',
  Startup: '#F06B6B',
  'Service Provider': '#6B7280',
  Media: '#2563EB',
};

export function getOrgColor(orgType) {
  if (!orgType) return '#9CA3AF';
  for (const [key, color] of Object.entries(ORG_TYPE_COLORS)) {
    if (orgType.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#9CA3AF';
}

export const CATEGORY_FILTERS = ['All', 'Investor', 'Enterprise', 'Events', 'Startup', 'Service Provider', 'Media'];

export function filterByCategory(contacts, category) {
  if (category === 'All') return contacts;
  return contacts.filter((c) => c.orgType.toLowerCase().includes(category.toLowerCase()));
}

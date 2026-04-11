export const REPS = {
  slavena: {
    initials: 'SV',
    name: 'Slavena',
    focus: 'Market Entry & BD',
    bio: 'Connects companies with the right decision-makers across UAE, CEE, and beyond.',
    color: '#7c6fe0',
    calendly: 'https://calendly.com',
  },
  teodor: {
    initials: 'TD',
    name: 'Teodor',
    focus: 'Partnerships & Growth',
    bio: 'Helps founders build the right partnerships and navigate new markets with confidence.',
    color: '#34d399',
    calendly: 'https://calendly.com',
  },
};

// Default when no ?rep= param — show both
export const DEFAULT_REPS = [REPS.slavena, REPS.teodor];

export function getRepFromUrl() {
  const param = new URLSearchParams(window.location.search).get('rep');
  return param ? (REPS[param.toLowerCase()] || null) : null;
}

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
    color: '#60a5fa',
    calendly: 'https://calendly.com',
  },
  etien: {
    initials: 'ET',
    name: 'Etien',
    focus: 'Strategy & Investors',
    bio: 'Helps founders sharpen their story and get in front of the right investors and partners.',
    color: '#34d399',
    calendly: 'https://calendly.com',
  },
};

// Default: Slavena + Etien (no ?rep= param)
export const DEFAULT_REPS = [REPS.slavena, REPS.etien];

export function getRepFromUrl() {
  const param = new URLSearchParams(window.location.search).get('rep');
  return param ? (REPS[param.toLowerCase()] || null) : null;
}

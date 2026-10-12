import type { Sponsor } from '../types';

/**
 * Confirmed sponsors, shown in this order. While the list is empty the Sponsors
 * section shows "Sponsors to be announced". When adding one: put the logo in
 * public/sponsor-logos/, add an entry here, and update knowledge/sponsors.md
 * (then npm run rag:ingest).
 */
export const sponsors: Sponsor[] = [
  {
    id: 'b7g-aoa',
    name: 'B7G AOA',
    logo: '/sponsor-logos/b7glogo-transparent.png',
    amount: { en: '₹2.5 Lakh', kn: '₹2.5 ಲಕ್ಷ' },
  },
  {
    id: '7wow-ventures',
    name: '7WOW Ventures',
    logo: '/sponsor-logos/7wowlogo.jpeg',
    amount: { en: '₹10,000', kn: '₹10,000' },
  },
];

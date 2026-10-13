import type { Sponsor } from '../types';

/**
 * Confirmed sponsors, shown in this order. While the list is empty the Sponsors
 * section shows "Sponsors to be announced". When adding one: put the logo in
 * public/sponsor-logos/ (or leave `logo` out for a monogram badge), add an entry
 * here, and update knowledge/sponsors.md (then npm run rag:ingest).
 */
export const sponsors: Sponsor[] = [
  {
    id: 'b7g-aoa',
    name: 'B7G AOA',
    logo: '/sponsor-logos/b7glogo-transparent.png',
  },
  {
    id: '7wow-ventures',
    name: '7WOW Ventures',
    logo: '/sponsor-logos/7wowlogo.jpeg',
  },
  {
    id: 'space-factor-interiors',
    name: 'Space Factor Interiors',
  },
  {
    id: 'fundskart',
    name: 'Fundskart',
    logo: '/sponsor-logos/fundskart-transparent.png',
  },
  {
    id: 'pranathi-enterprises',
    name: 'Pranathi Enterprises',
    logo: '/sponsor-logos/pranathi-name.jpg',
  },
];

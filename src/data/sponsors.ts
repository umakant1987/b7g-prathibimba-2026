import type { Sponsor } from '../types';

/**
 * Confirmed sponsors only. While this list is empty the Sponsors section shows
 * "Sponsors to be announced" and the assistant says sponsors are coming soon.
 * To announce one, add an entry (logo under public/sponsors/) and update
 * knowledge/sponsors.md, e.g.
 *   { id: 'sponsor-001', name: 'Company Name', logo: '/sponsors/company.svg', category: 'Title Sponsor' },
 */
export const sponsors: Sponsor[] = [];

export const sponsorCategoryOrder: Sponsor['category'][] = [
  'Title Sponsor',
  'Powered By',
  'Gold Sponsor',
  'Silver Sponsor',
  'Community Partner',
];

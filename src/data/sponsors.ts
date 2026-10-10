import type { Sponsor } from '../types';

export const sponsors: Sponsor[] = [
  {
    id: 'sponsor-001',
    name: 'B7G Foundation',
    logo: '/sponsors/b7g-foundation.svg',
    category: 'Title Sponsor',
  },
  {
    id: 'sponsor-002',
    name: 'Namma Bengaluru Tech',
    logo: '/sponsors/namma-bengaluru-tech.svg',
    category: 'Powered By',
  },
  {
    id: 'sponsor-003',
    name: 'Kaveri Enterprises',
    logo: '/sponsors/kaveri-enterprises.svg',
    category: 'Gold Sponsor',
  },
  {
    id: 'sponsor-004',
    name: 'Mysuru Silks',
    logo: '/sponsors/mysuru-silks.svg',
    category: 'Gold Sponsor',
  },
  {
    id: 'sponsor-005',
    name: 'Malnad Coffee Co.',
    logo: '/sponsors/malnad-coffee.svg',
    category: 'Silver Sponsor',
  },
  {
    id: 'sponsor-006',
    name: 'Hampi Crafts',
    logo: '/sponsors/hampi-crafts.svg',
    category: 'Silver Sponsor',
  },
  {
    id: 'sponsor-007',
    name: 'Kannada Kalika Trust',
    logo: '/sponsors/kannada-kalika-trust.svg',
    category: 'Community Partner',
  },
];

export const sponsorCategoryOrder: Sponsor['category'][] = [
  'Title Sponsor',
  'Powered By',
  'Gold Sponsor',
  'Silver Sponsor',
  'Community Partner',
];

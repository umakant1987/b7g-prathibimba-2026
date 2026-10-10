import { programs } from '../data/programs';
import type { ImpactStats } from '../types';
import { apiGet } from './api';

const BASE_STATS: ImpactStats = {
  contributors: 1320,
  familiesParticipating: 650,
  // The real number of items in the official programme.
  programsCount: programs.length,
  updatedAt: new Date().toISOString(),
};

/**
 * Production: this calls `${API_URL}/impact-stats`, which should be backed by
 * Supabase aggregates — COUNT(DISTINCT contributor) over approved donations.
 * See docs/ARCHITECTURE.md for the schema.
 */
export async function fetchImpactStats(): Promise<ImpactStats> {
  return apiGet('/impact-stats', () => BASE_STATS);
}

/** Dev-only: simulates live increments so the counter UI can be demoed without a backend. */
export function mockNextTick(current: ImpactStats): ImpactStats {
  const contributorBump = Math.random() > 0.7 ? 1 : 0;
  return {
    ...current,
    contributors: current.contributors + contributorBump,
    updatedAt: new Date().toISOString(),
  };
}

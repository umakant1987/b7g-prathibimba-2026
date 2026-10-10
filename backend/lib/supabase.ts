import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { RagConfig } from '../config.ts';

let client: SupabaseClient | null = null;

/**
 * The backend's single Supabase client, authenticated with the service-role
 * key so it can read/write knowledge_documents (blocked for the browser by
 * RLS). Never import this from frontend code.
 */
export function getServiceClient(config: RagConfig): SupabaseClient {
  if (client) return client;
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Supabase is not configured: set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
  }
  client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

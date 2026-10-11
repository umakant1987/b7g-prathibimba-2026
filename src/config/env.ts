export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export const API_URL = import.meta.env.VITE_API_URL ?? '';
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
/** Backend RAG endpoint (e.g. "/api/rag/query"). Empty = the chat runs fully offline. */
export const RAG_API_URL = import.meta.env.VITE_RAG_API_URL ?? '';

/**
 * Detailed programme (running order, performers) on the website and in the AI assistant.
 * Off until the organisers release it; programme posters are shown meanwhile.
 * Turn on with VITE_SHOW_PROGRAMME_DETAILS=true in .env, then rebuild and restart the RAG server.
 */
export const SHOW_PROGRAMME_DETAILS = import.meta.env.VITE_SHOW_PROGRAMME_DETAILS === 'true';

/**
 * Contribute section (QR codes, phone) and every Contribute button, on the website and in
 * the AI assistant. Off until the organisers are ready to collect contributions.
 * Turn on with VITE_SHOW_CONTRIBUTE=true, then rebuild and restart the RAG server.
 */
export const SHOW_CONTRIBUTE = import.meta.env.VITE_SHOW_CONTRIBUTE === 'true';

export const EVENT_DATE = '2026-11-01';

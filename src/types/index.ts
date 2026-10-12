export type LocalizedText = {
  en: string;
  kn: string;
};

export type Language = 'en' | 'kn';

/** Filter groups for the programme, derived from the organisers' performance types. */
export type ProgramCategory = 'ceremony' | 'music' | 'dance' | 'drama' | 'kids' | 'talks' | 'more';

export type ProgramSession = 'morning' | 'afternoon' | 'evening';

export type ProgramStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface Program {
  id: string;
  /** Official listing, e.g. "Tanya PV – Violin" (exact spelling). */
  title: LocalizedText;
  performer?: string;
  performanceType?: string;
  date: string; // YYYY-MM-DD
  session: ProgramSession;
  /** Position in its session's running order, from 1. */
  sequence: number;
  category: ProgramCategory;
  status: ProgramStatus;
  /** HH:mm (24h). Not published yet — set in knowledge/programme-2026.json once announced. */
  startTime?: string;
  endTime?: string;
}

export interface Sponsor {
  id: string;
  /** Short name shown on the card, e.g. "B7G AOA". */
  name: string;
  /** Full organisation name, shown under the short name. */
  fullName?: string;
  /** Logo under public/, e.g. "/sponsor-logos/b7glogo.jpeg". */
  logo: string;
  /** Sponsorship amount (not shown on the website). */
  amount: LocalizedText;
  website?: string;
}

export type GalleryMediaType = 'photo' | 'video';

export interface GalleryItem {
  id: string;
  type: GalleryMediaType;
  title: LocalizedText;
  /** Photo items only. Video items derive their thumbnail from youtubeId. */
  thumbnail?: string;
  /** Shareable link — YouTube watch URL for videos, image path for photos. */
  url: string;
  /** Required when type is 'video'. The YouTube video ID (not the full URL). */
  youtubeId?: string;
  year: string;
}

export interface ImpactStats {
  contributors: number;
  familiesParticipating: number;
  programsCount: number;
  updatedAt: string;
}

export interface ChatSource {
  label: string;
  type: 'schedule' | 'sponsor' | 'faq' | 'venue' | 'general';
}

/** A guest shown as a card in the chat (name search or "who are the guests?"). */
export interface GuestCard {
  id: string;
  name: string;
  emoji: string;
  /** Image path under /public; when absent the card shows an emoji avatar. */
  photo?: string;
  tagline: string;
  short: string;
  /** Exact event role, e.g. "Chief Guest" or "Special Guest". */
  role: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cards?: GuestCard[];
  sources?: ChatSource[];
  suggestedFollowUps?: string[];
  createdAt: string;
}

export interface Venue {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  mapUrl?: string;
}

export interface FAQ {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
}

export type ReactionType = 'love' | 'proud' | 'support' | 'respect' | 'celebrate';

export type ReactionCounts = Record<ReactionType, number> & { updatedAt: string };

export interface KannadaWord {
  /** The word in Kannada script. */
  kn: string;
  /** How to say it, in English letters. */
  roman: string;
  meaning: string;
}

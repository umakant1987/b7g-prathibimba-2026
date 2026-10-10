import type { ChatSource, GuestCard, Language } from '../../types';
import { guestProfiles, knowledgeChunks, type GuestProfile, type KnowledgeChunk } from './knowledgeLoader';
import { overlap, retrieveRelevantDocs, tokenize } from './retrieval';

/**
 * Structured answers about the event's guests, built from the `type: guest`
 * files in /knowledge/chief-guests. Like schedule questions, these are
 * answered from structured data first so roles and dates can't be
 * hallucinated:
 *
 * - Name-only searches ("Prakash", "Dharmi Sir", "ನಾಗಭೂಷಣ") → profile card.
 * - "Who are the guests?" → one card per guest with their exact event role.
 * - Specific questions ("What movies has he acted in?") → that guest's
 *   matching section, resolving "he/his" to the last guest discussed.
 */

export interface GuestReply {
  answer: string;
  cards?: GuestCard[];
  sources: ChatSource[];
  suggestedFollowUps: string[];
  grounded: boolean;
  /** The guest this reply was about, so the next "he/his" question can refer back to them. */
  guestId?: string;
}

const KANNADA = /[ಀ-೿]/;

function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9ಀ-೿]+/g, ' ').trim()} `;
}

/**
 * Whole-word match for English aliases. Kannada aliases only need to start a
 * word, because Kannada adds suffixes to names (ನಾಗಭೂಷಣ → ನಾಗಭೂಷಣರ, ನಾಗಭೂಷಣ ಅವರ).
 */
function containsAlias(normalizedQuestion: string, alias: string): boolean {
  const normalizedAlias = normalize(alias).trimEnd();
  return KANNADA.test(alias)
    ? normalizedQuestion.includes(normalizedAlias)
    : normalizedQuestion.includes(`${normalizedAlias} `);
}

interface GuestMatch {
  guest: GuestProfile;
  alias: string;
  isTopic: boolean;
}

function findGuestMatches(question: string): GuestMatch[] {
  const q = normalize(question);
  const matches: GuestMatch[] = [];
  for (const guest of guestProfiles) {
    const nameAlias = guest.aliases.filter((a) => containsAlias(q, a)).sort((a, b) => b.length - a.length)[0];
    if (nameAlias) {
      matches.push({ guest, alias: nameAlias, isTopic: false });
      continue;
    }
    const topic = guest.topics.filter((t) => containsAlias(q, t)).sort((a, b) => b.length - a.length)[0];
    if (topic) matches.push({ guest, alias: topic, isTopic: true });
  }
  return matches;
}

/** Words that don't change a name search into a specific question ("Who is Prakash sir?"). */
const PROFILE_FILLER = new Set(
  [
    'who', 'tell', 'about', 'sir', 'actor', 'historian', 'profile', 'info', 'information', 'detail',
    'details', 'bio', 'biography', 'more', 'show', 'know', 'want', 'search', 'shri', 'sri', 'from',
    'ಯಾರು', 'ಬಗ್ಗೆ', 'ತಿಳಿಸಿ', 'ಹೇಳಿ', 'ಅವರು', 'ಅವರ', 'ಸರ್', 'ಶ್ರೀ', 'ಮಾಹಿತಿ',
  ].flatMap((word) => [...tokenize(word)]),
);

/** The part of the question that isn't a guest's name or filler — what's actually being asked. */
function topicTokens(question: string, ...guests: GuestProfile[]): Set<string> {
  const nameTokens = new Set(guests.flatMap((guest) => guest.aliases.flatMap((alias) => [...tokenize(alias)])));
  const kannadaNames = [...nameTokens].filter((token) => KANNADA.test(token));
  const tokens = new Set<string>();
  for (const token of tokenize(question)) {
    if (nameTokens.has(token) || PROFILE_FILLER.has(token)) continue;
    if (kannadaNames.some((name) => token.startsWith(name))) continue;
    tokens.add(token);
  }
  return tokens;
}

function displayName(guest: GuestProfile): string {
  return guest.honorific ? `${guest.honorific} ${guest.name}` : guest.name;
}

export function toGuestCard(guest: GuestProfile, language: Language): GuestCard {
  return {
    id: guest.id,
    name: displayName(guest),
    emoji: guest.emoji,
    photo: guest.photo || undefined,
    tagline: guest.tagline,
    short: guest.short,
    role: language === 'kn' ? guest.eventRoleKn : guest.eventRole,
    date: language === 'kn' ? guest.eventDateKn : guest.eventDate,
  };
}

function guestChunks(guest: GuestProfile): KnowledgeChunk[] {
  return knowledgeChunks.filter((chunk) => chunk.file === guest.file);
}

function guestSource(guest: GuestProfile): ChatSource {
  return { label: `Guest — ${guest.name}`, type: 'general' };
}

function profileReply(guest: GuestProfile, language: Language): GuestReply {
  const summary = guestChunks(guest).find((chunk) => /^summary$/i.test(chunk.heading))?.text ?? guest.short;
  const answer =
    language === 'kn'
      ? [
          guest.summaryKn || summary,
          '',
          '**B7G ಸಂಪರ್ಕ**',
          `B7G ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ 2026 — ${guest.eventDateKn} — ${guest.eventRoleKn}.`,
        ].join('\n')
      : [
          summary,
          '',
          '**Known for**',
          ...guest.knownFor.map((item) => `• ${item}`),
          '',
          '**B7G connection**',
          `${displayName(guest)} is a ${guest.eventRole} at B7G Kannada Rajyotsava 2026 on ${guest.eventDate}.`,
        ].join('\n');

  return {
    answer,
    cards: [toGuestCard(guest, language)],
    sources: [guestSource(guest)],
    suggestedFollowUps: guest.ask.slice(1),
    grounded: true,
    guestId: guest.id,
  };
}

function isGuestListQuery(question: string): boolean {
  return /\bguests?\b|celebrit|ಅತಿಥಿ/i.test(question) && !/\bwhy\b|chosen|ಏಕೆ|ಯಾಕೆ|ಆಯ್ಕೆ/i.test(question);
}

function guestListReply(question: string, language: Language): GuestReply {
  const chiefOnly = /chief|ಮುಖ್ಯ/i.test(question);
  let guests = guestProfiles;
  if (/\b31(st)?\b|october|\boct\b|ಅಕ್ಟೋಬರ್/i.test(question)) guests = guests.filter((g) => /october/i.test(g.eventDate));
  else if (/november|\bnov\b|ನವೆಂಬರ್/i.test(question)) guests = guests.filter((g) => /november/i.test(g.eventDate));
  const singleDate = guests !== guestProfiles && guests.length > 0;
  const shown = chiefOnly ? guests.filter((g) => /chief/i.test(g.eventRole)) : guests;
  const others = chiefOnly ? guestProfiles.filter((g) => !/chief/i.test(g.eventRole)) : [];

  const describe = (g: GuestProfile) =>
    language === 'kn'
      ? `${displayName(g)} — ${g.eventRoleKn}, ${g.eventDateKn}`
      : `${displayName(g)} — ${g.eventRole}, ${g.eventDate}`;

  let answer: string;
  if (shown.length === 0) {
    answer =
      language === 'kn'
        ? 'ಆ ದಿನಾಂಕಕ್ಕೆ ಯಾವುದೇ ಅತಿಥಿಗಳ ಮಾಹಿತಿ ನನ್ನ B7G ಜ್ಞಾನಭಂಡಾರದಲ್ಲಿ ಇನ್ನೂ ಇಲ್ಲ.'
        : "I don't have any guests listed for that date in my B7G event knowledge base yet.";
  } else if (language === 'kn') {
    answer = [
      chiefOnly
        ? 'B7G ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ 2026ರ ಮುಖ್ಯ ಅತಿಥಿಗಳು:'
        : singleDate
          ? `${shown[0].eventDateKn}ರ ಅತಿಥಿಗಳು:`
          : 'B7G ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ 2026 ಎರಡು ದಿನಗಳ ಆಚರಣೆ — ನಮ್ಮ ಅತಿಥಿಗಳು:',
      ...shown.map((g) => `• ${describe(g)}`),
      ...(others.length ? ['', `ಜೊತೆಗೆ: ${others.map(describe).join('; ')}.`] : []),
    ].join('\n');
  } else {
    answer = [
      chiefOnly
        ? 'The Chief Guests for B7G Kannada Rajyotsava 2026 are:'
        : singleDate
          ? `Our guest${shown.length > 1 ? 's' : ''} on ${shown[0].eventDate}:`
          : 'B7G Kannada Rajyotsava 2026 is a two-day celebration. Our guests:',
      ...shown.map((g) => `• ${describe(g)}`),
      ...(others.length ? ['', `Also joining us: ${others.map(describe).join('; ')}.`] : []),
    ].join('\n');
  }

  return {
    answer,
    cards: shown.map((g) => toGuestCard(g, language)),
    sources: shown.map(guestSource),
    suggestedFollowUps: [...shown.map((g) => g.ask[0]), 'Why were these Chief Guests chosen?'],
    grounded: shown.length > 0,
  };
}

function notFoundReply(guest: GuestProfile, language: Language): GuestReply {
  const answer =
    language === 'kn'
      ? `${guest.name} ಅವರ ಬಗ್ಗೆ ಆ ಮಾಹಿತಿ ನನ್ನ B7G ಕಾರ್ಯಕ್ರಮ ಜ್ಞಾನಭಂಡಾರದಲ್ಲಿ ಇನ್ನೂ ಇಲ್ಲ.`
      : guest.id === 'nagabhushana-ns'
        ? "I have limited information about Nagabhushana in my current B7G knowledge base. I can share the information available here, but I don't want to guess or provide unverified details."
        : `I don't have that information about ${guest.name} in my B7G event knowledge base yet.`;
  return {
    answer,
    sources: [],
    suggestedFollowUps: guest.ask.slice(0, 4),
    grounded: false,
    guestId: guest.id,
  };
}

const PERSONAL_DETAIL =
  /\b(married|marriage|wife|husband|spouse|family|children|kids|parents|born|birthday|age|salary|fees?|caste|religion|address|phone|email|contact|net worth|girlfriend|boyfriend)\b/i;

function rankChunks(chunks: KnowledgeChunk[], tokens: Set<string>, topK: number): KnowledgeChunk[] {
  const needed = Math.max(1, Math.ceil(tokens.size / 2));
  return chunks
    .map((chunk) => ({
      chunk,
      body: overlap(tokens, `${chunk.heading} ${chunk.text}`),
      score: overlap(tokens, `${chunk.heading} ${chunk.text}`) + overlap(tokens, chunk.heading) * 2,
    }))
    .filter(({ body }) => body >= needed)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ chunk }) => chunk);
}

/**
 * Sections that cover what's being asked about this guest, best first. The
 * guest's own file is authoritative; other files that mention them (e.g. the
 * FAQ's "Why were these Chief Guests chosen?") are only used as a fallback.
 */
function retrieveForGuest(guest: GuestProfile, tokens: Set<string>, topK = 3): KnowledgeChunk[] {
  const own = rankChunks(guestChunks(guest), tokens, topK);
  if (own.length > 0) return own;
  const nameLower = guest.name.toLowerCase();
  const mentions = knowledgeChunks.filter(
    (chunk) => chunk.file !== guest.file && chunk.text.toLowerCase().includes(nameLower),
  );
  return rankChunks(mentions, tokens, topK);
}

async function specificReply(
  question: string,
  guest: GuestProfile,
  tokens: Set<string>,
  language: Language,
): Promise<GuestReply> {
  // Kannada questions: prefer a hand-written Kannada FAQ answer when one matches.
  if (language === 'kn') {
    const kannadaFaq = retrieveRelevantDocs(question, 'kn').find((doc) => /^faq-/.test(doc.id));
    if (kannadaFaq) {
      return {
        answer: kannadaFaq.text,
        sources: [kannadaFaq.source],
        suggestedFollowUps: guest.ask.slice(0, 4),
        grounded: true,
        guestId: guest.id,
      };
    }
  }

  const chunks = retrieveForGuest(guest, tokens);
  if (chunks.length === 0) return notFoundReply(guest, language);
  // Personal questions need a section actually about that topic — "Is he married?"
  // must not be answered from a film plot that mentions a "married couple".
  if (PERSONAL_DETAIL.test(question) && overlap(tokens, chunks[0].heading) === 0) {
    return notFoundReply(guest, language);
  }

  const answer = chunks[0].text;

  // Don't suggest the question that was just answered.
  const isSameQuestion = (suggestion: string) => {
    const suggested = topicTokens(suggestion, guest);
    return suggested.size === tokens.size && [...suggested].every((token) => tokens.has(token));
  };
  return {
    answer,
    sources: [guestSource(guest)],
    suggestedFollowUps: guest.ask.filter((q) => !isSameQuestion(q)).slice(0, 4),
    grounded: true,
    guestId: guest.id,
  };
}

const PRONOUN = /\b(he|him|his|sir)\b|ಅವರ/i;

/**
 * Questions that only make sense about a person, so right after a name search
 * "Give me a stage introduction" means that guest even without "he/his".
 */
const PERSON_QUESTION =
  /stage intro|introduction|what can i ask|\b(movies?|films?|acted|directed|awards?|achievements?|books?|known for|born|age|married|family|studied|education|theatre)\b/i;

/**
 * Returns a reply when the question is about the event's guests, or null to
 * let the rest of the RAG pipeline handle it.
 */
export async function answerGuestQuestion(
  question: string,
  language: Language,
  lastGuestId?: string,
  options: { structuredOnly?: boolean } = {},
): Promise<GuestReply | null> {
  // With the backend RAG available, only the structured replies (profile cards,
  // guest lists) are answered here; specific questions go to the backend.
  const specific = (guest: GuestProfile, tokens: Set<string>) =>
    options.structuredOnly ? null : specificReply(question, guest, tokens, language);

  const matches = findGuestMatches(question);

  if (matches.length > 1) {
    const allNames =
      matches.every((m) => !m.isTopic) && topicTokens(question, ...matches.map((m) => m.guest)).size === 0;
    if (allNames) {
      return {
        answer: matches.map((m) => profileReply(m.guest, language).answer).join('\n\n'),
        cards: matches.map((m) => toGuestCard(m.guest, language)),
        sources: matches.map((m) => guestSource(m.guest)),
        suggestedFollowUps: matches.map((m) => m.guest.ask[1]),
        grounded: true,
      };
    }
    return null; // e.g. comparing guests — leave it to general retrieval.
  }

  if (matches.length === 1) {
    const { guest, alias, isTopic } = matches[0];
    const tokens = topicTokens(question, guest);
    const isProfile = isTopic ? normalize(question).trim() === normalize(alias).trim() : tokens.size === 0;
    return isProfile ? profileReply(guest, language) : specific(guest, tokens);
  }

  if (isGuestListQuery(question)) return guestListReply(question, language);

  const lastGuest = guestProfiles.find((g) => g.id === lastGuestId);
  if (lastGuest && (PRONOUN.test(question) || PERSON_QUESTION.test(question))) {
    const tokens = topicTokens(question, lastGuest);
    return tokens.size === 0 ? profileReply(lastGuest, language) : specific(lastGuest, tokens);
  }

  return null;
}

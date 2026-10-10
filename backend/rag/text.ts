/**
 * Text helpers shared by ingestion and retrieval, so English and Kannada are
 * tokenized the same way everywhere.
 */

export const KANNADA = /[ಀ-೿]/;

const STOPWORDS = new Set([
  // English question/filler words
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'am', 'be', 'been', 'of', 'at', 'in', 'on', 'to', 'for',
  'and', 'or', 'what', 'whats', 'where', 'when', 'who', 'whom', 'whose', 'which', 'why', 'how', 'do', 'does',
  'did', 'it', 'its', 'this', 'that', 'these', 'those', 'me', 'about', 'tell', 'you', 'your', 'can', 'could',
  'would', 'should', 'will', 'i', 'my', 'we', 'our', 'us', 'he', 'him', 'his', 'she', 'her', 'they', 'them',
  'their', 'has', 'have', 'had', 'by', 'with', 'from', 'any', 'some', 'give', 'please', 'there', 'here', 'more',
  'know', 'want', 'like', 'show', 'get', 'also', 'just', 'than', 'then', 'so', 'if', 'as', 'all',
  // contraction stems ("isn't" → "isn")
  'isn', 'aren', 'don', 'doesn', 'didn', 'won', 'can', 'couldn', 'wasn', 'weren',
  // Kanglish (Kannada typed in English letters) question/filler words
  'alli', 'enu', 'yenu', 'ide', 'ideya', 'ideye', 'andre', 'ge', 'ella', 'hege', 'yaaru', 'yavaga', 'bahuda', 'madbahuda',
  // Kannada question/filler words
  'ಯಾರು', 'ಏನು', 'ಎಂದರೇನು', 'ಬಗ್ಗೆ', 'ಹೇಳಿ', 'ತಿಳಿಸಿ', 'ಯಾವಾಗ', 'ಎಲ್ಲಿ', 'ಹೇಗೆ', 'ಅವರು', 'ಅವರ', 'ಇದು', 'ಆ', 'ಈ',
]);

/** Lower-cases and folds Unicode variants so "Café"/"cafe" and Kannada forms compare consistently. */
export function normalize(text: string): string {
  return text.normalize('NFKC').toLowerCase();
}

/** Naive English plural folding ("movies"→"movie", "awards"→"award", "studied"→"study"). */
function stem(token: string): string {
  if (KANNADA.test(token)) return token;
  if (/^\d+(st|nd|rd|th)$/.test(token)) return token.replace(/\D+$/, ''); // "31st" → "31"
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && token.endsWith('ied')) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

/** Words in the text: Latin letters/digits or Kannada script runs. */
export function words(text: string): string[] {
  return normalize(text).match(/[a-z0-9]+|[ಀ-೿]+/g) ?? [];
}

/** Meaningful search terms: stopwords removed, plurals folded, de-duplicated. */
export function searchTerms(text: string): string[] {
  const terms = new Set<string>();
  for (const word of words(text)) {
    if (word.length < 2 || STOPWORDS.has(word)) continue;
    terms.add(stem(word));
  }
  return [...terms];
}

/** Rough token count: ~4 Latin characters per token, ~1 token per Kannada character. */
export function estimateTokens(text: string): number {
  let latin = 0;
  let other = 0;
  for (const char of text) {
    if (char.charCodeAt(0) < 128) latin += 1;
    else other += 1;
  }
  return Math.ceil(latin / 4 + other);
}

export function slugify(text: string): string {
  return (
    normalize(text)
      .replace(/[^a-z0-9ಀ-೿]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'section'
  );
}

/**
 * Does `alias` occur in `text`? English aliases must match whole words;
 * Kannada aliases only need to start a word, because Kannada adds suffixes to
 * names (ನಾಗಭೂಷಣ → ನಾಗಭೂಷಣರ).
 */
export function containsAlias(text: string, alias: string): boolean {
  const haystack = ` ${words(text).join(' ')} `;
  const needle = words(alias).join(' ');
  if (!needle) return false;
  return KANNADA.test(needle) ? haystack.includes(` ${needle}`) : haystack.includes(` ${needle} `);
}

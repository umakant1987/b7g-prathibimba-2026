import type { KannadaWord, LocalizedText, ReactionType } from '../types';

export const MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000];

export const REACTION_CONFIG: Record<ReactionType, { emoji: string; label: LocalizedText }> = {
  love: { emoji: '❤️', label: { en: 'Love Kannada', kn: 'ಕನ್ನಡ ಪ್ರೀತಿ' } },
  proud: { emoji: '👍', label: { en: 'Proud', kn: 'ಹೆಮ್ಮೆ' } },
  support: { emoji: '🔥', label: { en: 'Super Celebration', kn: 'ಸೂಪರ್ ಸಂಭ್ರಮ' } },
  respect: { emoji: '🙏', label: { en: 'Respect', kn: 'ಗೌರವ' } },
  celebrate: { emoji: '🎉', label: { en: 'Celebrate', kn: 'ಆಚರಣೆ' } },
};

/**
 * "Learn a Kannada word with every tap" — each reaction reveals the next word.
 * Everyday words first, so newcomers can use them at the celebration.
 */
export const KANNADA_WORDS: KannadaWord[] = [
  { kn: 'ನಮಸ್ಕಾರ', roman: 'Namaskara', meaning: 'Hello / Greetings' },
  { kn: 'ಧನ್ಯವಾದಗಳು', roman: 'Dhanyavadagalu', meaning: 'Thank you' },
  { kn: 'ಹೇಗಿದ್ದೀರಾ?', roman: 'Hegiddira?', meaning: 'How are you?' },
  { kn: 'ಚೆನ್ನಾಗಿದೆ', roman: 'Chennagide', meaning: "It's nice / It's good" },
  { kn: 'ಬನ್ನಿ', roman: 'Banni', meaning: 'Please come / Welcome' },
  { kn: 'ಪ್ರೀತಿ', roman: 'Preethi', meaning: 'Love' },
  { kn: 'ಹೆಮ್ಮೆ', roman: 'Hemme', meaning: 'Pride' },
  { kn: 'ಗೌರವ', roman: 'Gaurava', meaning: 'Respect' },
  { kn: 'ಸಂಭ್ರಮ', roman: 'Sambhrama', meaning: 'Celebration / Joy' },
  { kn: 'ಹಬ್ಬ', roman: 'Habba', meaning: 'Festival' },
  { kn: 'ಸ್ನೇಹಿತ', roman: 'Snehita', meaning: 'Friend' },
  { kn: 'ಕುಟುಂಬ', roman: 'Kutumba', meaning: 'Family' },
  { kn: 'ಮಕ್ಕಳು', roman: 'Makkalu', meaning: 'Children' },
  { kn: 'ಮನೆ', roman: 'Mane', meaning: 'Home' },
  { kn: 'ಊಟ', roman: 'Oota', meaning: 'Meal' },
  { kn: 'ನೀರು', roman: 'Neeru', meaning: 'Water' },
  { kn: 'ನಾಡು', roman: 'Naadu', meaning: 'Land / Homeland' },
  { kn: 'ನುಡಿ', roman: 'Nudi', meaning: 'Language / Speech' },
  { kn: 'ಸಂಸ್ಕೃತಿ', roman: 'Samskruthi', meaning: 'Culture' },
  { kn: 'ಪರಂಪರೆ', roman: 'Parampare', meaning: 'Heritage / Tradition' },
  { kn: 'ಇತಿಹಾಸ', roman: 'Itihasa', meaning: 'History' },
  { kn: 'ನಮ್ಮ ಕರ್ನಾಟಕ', roman: 'Namma Karnataka', meaning: 'Our Karnataka' },
  { kn: 'ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ', roman: 'Sirigannadam Gelge', meaning: 'Victory to glorious Kannada!' },
];

import type { FAQ, Venue } from '../types';
import { SHOW_CONTRIBUTE } from '../config/env';

// Kannada-language entries for the AI assistant. The English knowledge base
// lives in /knowledge/*.md; these cover questions asked in Kannada, so keep the
// two in sync when facts change.

// No venues have been announced yet; add them here (and to /knowledge) when they are.
export const venues: Venue[] = [];

export const faqs: FAQ[] = [
  {
    id: 'faq-001',
    question: { en: 'When does the event start?', kn: 'ಕಾರ್ಯಕ್ರಮ ಯಾವಾಗ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ?' },
    answer: {
      en: 'The celebration is on Sunday, 15 November 2026 at Brigade 7 Gardens. Morning: guest talk from 10 to 11 AM, then the inauguration of B7G Santhe (open until the evening). Evening: from 5:30 PM, cultural programmes, followed by sand art by Mr. Raghavendra Hegde and a jamming session.',
      kn: 'ಕಾರ್ಯಕ್ರಮ ನವೆಂಬರ್ 15, 2026 ಭಾನುವಾರದಂದು ಬ್ರಿಗೇಡ್ 7 ಗಾರ್ಡನ್ಸ್‌ನಲ್ಲಿ. ಬೆಳಿಗ್ಗೆ 10ರಿಂದ 11ರವರೆಗೆ ಅತಿಥಿಗಳ ಮಾತು, ನಂತರ B7G ಸಂತೆ ಉದ್ಘಾಟನೆ (ಸಂಜೆಯವರೆಗೂ ತೆರೆದಿರುತ್ತದೆ). ಸಂಜೆ 5:30ರಿಂದ ಸಾಂಸ್ಕೃತಿಕ ಕಾರ್ಯಕ್ರಮಗಳು, ನಂತರ ಶ್ರೀ ರಾಘವೇಂದ್ರ ಹೆಗಡೆ ಅವರಿಂದ ಮರಳು ಕಲೆ ಮತ್ತು ಜಾಮಿಂಗ್ ಸೆಷನ್.',
    },
  },
  {
    id: 'faq-002',
    question: { en: 'Is the event free to attend?', kn: 'ಕಾರ್ಯಕ್ರಮಕ್ಕೆ ಪ್ರವೇಶ ಉಚಿತವೇ?' },
    answer: {
      en: 'Yes, entry is free and open to all members of the B7G community and their families.',
      kn: 'ಹೌದು, ಪ್ರವೇಶ ಉಚಿತ ಮತ್ತು B7G ಸಮುದಾಯದ ಎಲ್ಲಾ ಸದಸ್ಯರಿಗೆ ಮತ್ತು ಅವರ ಕುಟುಂಬಗಳಿಗೆ ಮುಕ್ತವಾಗಿದೆ.',
    },
  },
  {
    id: 'faq-003',
    question: { en: 'Can I contribute or donate?', kn: 'ನಾನು ದಾನ ಮಾಡಬಹುದೇ?' },
    answer: {
      en: SHOW_CONTRIBUTE
        ? 'Yes — contributions support the celebration. Pay by UPI to ananth.pallaki@okicici (Anant) or umakanth.friend-1@okhdfcbank (Umakant); the Contribute section has Pay buttons and a copy option.'
        : 'Thank you for wanting to support the celebration! Details on how to contribute will be shared on this website soon.',
      kn: SHOW_CONTRIBUTE
        ? 'ಹೌದು — ನಿಮ್ಮ ಕೊಡುಗೆ ಆಚರಣೆಗೆ ಬೆಂಬಲ. UPI ಮೂಲಕ ಪಾವತಿಸಿ: ananth.pallaki@okicici (ಅನಂತ್) ಅಥವಾ umakanth.friend-1@okhdfcbank (ಉಮಾಕಾಂತ್). ಕೊಡುಗೆ ವಿಭಾಗದಲ್ಲಿ ಪಾವತಿ ಬಟನ್‌ಗಳಿವೆ.'
        : 'ಆಚರಣೆಗೆ ಬೆಂಬಲ ನೀಡಲು ಬಯಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು! ಕೊಡುಗೆ ನೀಡುವ ವಿವರಗಳನ್ನು ಶೀಘ್ರದಲ್ಲೇ ಈ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಲಾಗುವುದು.',
    },
  },
  {
    id: 'faq-004',
    question: { en: 'Who are the Chief Guests?', kn: 'ಮುಖ್ಯ ಅತಿಥಿಗಳು ಯಾರು?' },
    answer: {
      en: 'The Chief Guest for B7G Kannada Rajyotsava 2026 (15 November) is Shri Dharmendra Kumar Arenahalli, and the Special Guest is Kannada actor Nagabhushana NS.',
      kn: 'ನವೆಂಬರ್ 15ರಂದು ನಡೆಯುವ B7G ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ 2026ರ ಮುಖ್ಯ ಅತಿಥಿ ಶ್ರೀ ಧರ್ಮೇಂದ್ರ ಕುಮಾರ್ ಅರೆನಹಳ್ಳಿ, ವಿಶೇಷ ಅತಿಥಿ ಕನ್ನಡ ನಟ ನಾಗಭೂಷಣ ಎನ್.ಎಸ್.',
    },
  },
  {
    id: 'faq-007',
    question: { en: 'Who is Nagabhushana?', kn: 'ನಾಗಭೂಷಣ ಯಾರು?' },
    answer: {
      en: 'Nagabhushana NS is a Kannada actor known for playing Vasu in the 2021 comedy film Ikkat. He is the Special Guest on 15 November 2026.',
      kn: 'ನಾಗಭೂಷಣ ಎನ್.ಎಸ್. ಅವರು ತಮ್ಮ ಸಹಜ ಹಾಸ್ಯ ಮತ್ತು ಆಪ್ತ ಅಭಿನಯಕ್ಕೆ ಹೆಸರಾದ ಕನ್ನಡ ನಟ. 2021ರ ಕನ್ನಡ ಹಾಸ್ಯ ಚಿತ್ರ "ಇಕ್ಕಟ್"ನಲ್ಲಿ ಭೂಮಿ ಶೆಟ್ಟಿ ಅವರ ಜೊತೆ ವಾಸು ಪಾತ್ರದಲ್ಲಿ ನಟಿಸಿದ್ದಾರೆ. ಅವರು ನವೆಂಬರ್ 15, 2026ರ ವಿಶೇಷ ಅತಿಥಿ.',
    },
  },
  {
    id: 'faq-005',
    question: { en: 'What is Mysoorina Kathegalu?', kn: 'ಮೈಸೂರಿನ ಕಥೆಗಳು ಎಂದರೇನು?' },
    answer: {
      en: 'Mysoorina Kathegalu, meaning "Stories of Mysuru", is the historical storytelling initiative associated with Dharmendra Kumar Arenahalli.',
      kn: '"ಮೈಸೂರಿನ ಕಥೆಗಳು" Dharmendra Kumar Arenahalli ಅವರ ಐತಿಹಾಸಿಕ ಕಥನ ಉಪಕ್ರಮ. ಕನ್ನಡ ಡಿಜಿಟಲ್ ಕಥನದ ಮೂಲಕ ಅವರು ಮೈಸೂರು ಮತ್ತು ಕರ್ನಾಟಕದ ಇತಿಹಾಸ, ಪರಂಪರೆ, ಸ್ಥಳಗಳು, ವ್ಯಕ್ತಿಗಳು, ವಾಸ್ತುಶಿಲ್ಪ ಮತ್ತು ಸಂಸ್ಕೃತಿಯ ಕಥೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳುತ್ತಾರೆ.',
    },
  },
  {
    id: 'faq-006',
    question: { en: 'What is Kannada Rajyotsava?', kn: 'ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ಎಂದರೇನು?' },
    answer: {
      en: 'Kannada Rajyotsava is celebrated every year on November 1 to commemorate the unification of the Kannada-speaking regions into one state in 1956.',
      kn: 'ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವವನ್ನು ಪ್ರತಿ ವರ್ಷ ನವೆಂಬರ್ 1ರಂದು ಆಚರಿಸಲಾಗುತ್ತದೆ. 1956ರಲ್ಲಿ ಕನ್ನಡ ಮಾತನಾಡುವ ಪ್ರದೇಶಗಳು ಒಂದೇ ರಾಜ್ಯವಾಗಿ ಏಕೀಕರಣಗೊಂಡ ದಿನದ ನೆನಪಿಗಾಗಿ ಈ ಆಚರಣೆ. ಇದು ಕನ್ನಡ ಭಾಷೆ, ಕರ್ನಾಟಕದ ಸಂಸ್ಕೃತಿ, ಇತಿಹಾಸ, ಸಾಹಿತ್ಯ, ಸಂಗೀತ, ನೃತ್ಯ ಮತ್ತು ರಂಗಭೂಮಿಯ ಹಬ್ಬ.',
    },
  },
];

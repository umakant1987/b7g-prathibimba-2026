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
      en: 'The 31 October evening programme runs from 5 PM to 10 PM, and the 1 November programme begins at 9 AM — both at Brigade 7 Gardens.',
      kn: 'ಅಕ್ಟೋಬರ್ 31ರ ಸಂಜೆಯ ಕಾರ್ಯಕ್ರಮ ಸಂಜೆ 5ರಿಂದ ರಾತ್ರಿ 10ರವರೆಗೆ, ನವೆಂಬರ್ 1ರ ಕಾರ್ಯಕ್ರಮ ಬೆಳಿಗ್ಗೆ 9ಕ್ಕೆ ಆರಂಭ — ಎರಡೂ ಬ್ರಿಗೇಡ್ 7 ಗಾರ್ಡನ್ಸ್‌ನಲ್ಲಿ.',
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
        ? 'Yes — contributions support the community programmes. Use the Contribute button at the top of the website: the Contribute section has QR codes to scan and a phone number for contribution queries.'
        : 'Thank you for wanting to support the celebration! Details on how to contribute will be shared on this website soon.',
      kn: SHOW_CONTRIBUTE
        ? 'ಹೌದು — ದೇಣಿಗೆಗಳು ಸಮುದಾಯ ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ಬೆಂಬಲಿಸುತ್ತವೆ. ವೆಬ್‌ಸೈಟ್‌ನ ಮೇಲ್ಭಾಗದಲ್ಲಿರುವ "ಕೊಡುಗೆ ನೀಡಿ" ಬಟನ್ ಒತ್ತಿ: ಅಲ್ಲಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಲು QR ಕೋಡ್‌ಗಳು ಮತ್ತು ಮಾಹಿತಿಗಾಗಿ ದೂರವಾಣಿ ಸಂಖ್ಯೆ ಇದೆ.'
        : 'ಆಚರಣೆಗೆ ಬೆಂಬಲ ನೀಡಲು ಬಯಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು! ಕೊಡುಗೆ ನೀಡುವ ವಿವರಗಳನ್ನು ಶೀಘ್ರದಲ್ಲೇ ಈ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಲಾಗುವುದು.',
    },
  },
  {
    id: 'faq-004',
    question: { en: 'Who are the Chief Guests?', kn: 'ಮುಖ್ಯ ಅತಿಥಿಗಳು ಯಾರು?' },
    answer: {
      en: 'The Chief Guests for B7G Kannada Rajyotsava 2026 on November 1 are Shri Prakash Belawadi and Shri Dharmendra Kumar Arenahalli.',
      kn: 'ನವೆಂಬರ್ 1ರಂದು ನಡೆಯುವ B7G ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ 2026ರ ಮುಖ್ಯ ಅತಿಥಿಗಳು ಶ್ರೀ ಪ್ರಕಾಶ್ ಬೆಳವಾಡಿ ಮತ್ತು ಶ್ರೀ Dharmendra Kumar Arenahalli. ಪ್ರಕಾಶ್ ಬೆಳವಾಡಿ ಅವರು ನಟ, ಚಲನಚಿತ್ರ ನಿರ್ದೇಶಕ, ರಂಗಭೂಮಿ ವ್ಯಕ್ತಿತ್ವ, ಪತ್ರಕರ್ತ ಮತ್ತು ಶಿಕ್ಷಕರು. Dharmendra Kumar Arenahalli ಅವರು ಇತಿಹಾಸಕಾರ, ಲೇಖಕ ಮತ್ತು ಡಿಜಿಟಲ್ ಕಥೆಗಾರರು — "ಮೈಸೂರಿನ ಕಥೆಗಳು" ಮೂಲಕ ಕರ್ನಾಟಕದ ಇತಿಹಾಸ ಮತ್ತು ಪರಂಪರೆಯನ್ನು ಕನ್ನಡದಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳುತ್ತಾರೆ. ಅಕ್ಟೋಬರ್ 31ರಂದು ಕನ್ನಡ ನಟ ನಾಗಭೂಷಣ ಎನ್.ಎಸ್. ವಿಶೇಷ ಅತಿಥಿಯಾಗಿ ಭಾಗವಹಿಸಲಿದ್ದಾರೆ.',
    },
  },
  {
    id: 'faq-007',
    question: { en: 'Who is Nagabhushana?', kn: 'ನಾಗಭೂಷಣ ಯಾರು?' },
    answer: {
      en: 'Nagabhushana NS is a Kannada actor known for playing Vasu in the 2021 comedy film Ikkat. He is the special guest on 31 October 2026.',
      kn: 'ನಾಗಭೂಷಣ ಎನ್.ಎಸ್. ಅವರು ತಮ್ಮ ಸಹಜ ಹಾಸ್ಯ ಮತ್ತು ಆಪ್ತ ಅಭಿನಯಕ್ಕೆ ಹೆಸರಾದ ಕನ್ನಡ ನಟ. 2021ರ ಕನ್ನಡ ಹಾಸ್ಯ ಚಿತ್ರ "ಇಕ್ಕಟ್"ನಲ್ಲಿ ಭೂಮಿ ಶೆಟ್ಟಿ ಅವರ ಜೊತೆ ವಾಸು ಪಾತ್ರದಲ್ಲಿ ನಟಿಸಿದ್ದಾರೆ. ಅವರು ಅಕ್ಟೋಬರ್ 31, 2026ರಂದು B7G ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವದ ವಿಶೇಷ ಅತಿಥಿ.',
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

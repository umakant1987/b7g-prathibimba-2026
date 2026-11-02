import type { LocalizedText } from '../types';

/**
 * The celebration day and its schedule, shown in the Programmes section.
 * Edit here when the schedule changes; add `time` to an item once timings are confirmed.
 * Keep knowledge/programme-highlights.json in sync (then npm run rag:ingest).
 */
export const EVENT_DAY = { date: '2026-11-15', dayOfMonth: '15' };

export type ScheduleIcon = 'santhe' | 'culture' | 'sand-art' | 'jamming';

export interface ScheduleItem {
  id: string;
  icon: ScheduleIcon;
  title: LocalizedText;
  description: LocalizedText;
  /** e.g. { en: '10 AM – 1 PM', kn: 'ಬೆಳಿಗ್ಗೆ 10 – ಮಧ್ಯಾಹ್ನ 1' }; leave out until confirmed. */
  time?: LocalizedText;
}

export interface ScheduleSession {
  id: 'morning' | 'evening';
  title: LocalizedText;
  items: ScheduleItem[];
}

export const daySchedule: ScheduleSession[] = [
  {
    id: 'morning',
    title: { en: 'Morning', kn: 'ಬೆಳಿಗ್ಗೆ' },
    items: [
      {
        id: 'b7g-santhe',
        icon: 'santhe',
        title: { en: 'B7G Santhe', kn: 'B7G ಸಂತೆ' },
        description: {
          en: 'Our community market — food stalls, handmade and creative products, games and more, run by B7G residents.',
          kn: 'ನಮ್ಮ ಸಮುದಾಯದ ಸಂತೆ — B7G ನಿವಾಸಿಗಳ ಊಟ-ತಿಂಡಿ ಮಳಿಗೆಗಳು, ಕರಕುಶಲ ವಸ್ತುಗಳು, ಆಟಗಳು ಮತ್ತು ಇನ್ನೂ ಹಲವು.',
        },
      },
    ],
  },
  {
    id: 'evening',
    title: { en: 'Evening', kn: 'ಸಂಜೆ' },
    items: [
      {
        id: 'cultural-programmes',
        icon: 'culture',
        title: { en: 'Cultural Programmes', kn: 'ಸಾಂಸ್ಕೃತಿಕ ಕಾರ್ಯಕ್ರಮಗಳು' },
        description: {
          en: 'Performances celebrating Kannada language and culture.',
          kn: 'ಕನ್ನಡ ಭಾಷೆ ಮತ್ತು ಸಂಸ್ಕೃತಿಯನ್ನು ಸಂಭ್ರಮಿಸುವ ಪ್ರದರ್ಶನಗಳು.',
        },
      },
      {
        id: 'sand-art',
        icon: 'sand-art',
        title: { en: 'Sand Art Performance', kn: 'ಮರಳು ಕಲೆ ಪ್ರದರ್ಶನ' },
        description: {
          en: 'Stories brought to life in sand, live on stage.',
          kn: 'ವೇದಿಕೆಯ ಮೇಲೆ ನೇರವಾಗಿ ಮರಳಿನಲ್ಲಿ ಮೂಡುವ ಕಥೆಗಳು.',
        },
      },
      {
        id: 'jamming',
        icon: 'jamming',
        title: { en: 'Jamming Session', kn: 'ಜಾಮಿಂಗ್ ಸೆಷನ್' },
        description: {
          en: 'Music and singing together to close the evening.',
          kn: 'ಸಂಜೆಯನ್ನು ಒಟ್ಟಾಗಿ ಹಾಡು-ಸಂಗೀತದೊಂದಿಗೆ ಮುಗಿಸೋಣ.',
        },
      },
    ],
  },
];

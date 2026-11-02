import type { LocalizedText } from '../types';

/**
 * The celebration day and its schedule, shown in the Programmes section.
 * Edit here when the schedule changes. `time` is the line shown under each title (time or order).
 * Keep knowledge/programme-highlights.json in sync (then npm run rag:ingest).
 */
export const EVENT_DAY = { date: '2026-11-15', dayOfMonth: '15' };

export type ScheduleIcon = 'talk' | 'santhe' | 'culture' | 'sand-art' | 'jamming';

export interface ScheduleItem {
  id: string;
  icon: ScheduleIcon;
  title: LocalizedText;
  description: LocalizedText;
  /** Time or order, e.g. { en: 'From 5:30 PM', kn: 'ಸಂಜೆ 5:30ರಿಂದ' }; leave out when unknown. */
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
        id: 'guest-talk',
        icon: 'talk',
        title: { en: 'Guest Talk', kn: 'ಅತಿಥಿಗಳ ಮಾತು' },
        time: { en: '10:00 – 11:00 AM', kn: 'ಬೆಳಿಗ್ಗೆ 10:00 – 11:00' },
        description: {
          en: 'The day opens with our guests.',
          kn: 'ನಮ್ಮ ಅತಿಥಿಗಳೊಂದಿಗೆ ದಿನದ ಆರಂಭ.',
        },
      },
      {
        id: 'b7g-santhe',
        icon: 'santhe',
        title: { en: 'B7G Santhe Inauguration', kn: 'B7G ಸಂತೆ ಉದ್ಘಾಟನೆ' },
        time: { en: 'After the guest talk · open till evening', kn: 'ಅತಿಥಿಗಳ ಮಾತಿನ ನಂತರ · ಸಂಜೆಯವರೆಗೂ' },
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
        time: { en: 'From 5:30 PM', kn: 'ಸಂಜೆ 5:30ರಿಂದ' },
        description: {
          en: 'Performances celebrating Kannada language and culture.',
          kn: 'ಕನ್ನಡ ಭಾಷೆ ಮತ್ತು ಸಂಸ್ಕೃತಿಯನ್ನು ಸಂಭ್ರಮಿಸುವ ಪ್ರದರ್ಶನಗಳು.',
        },
      },
      {
        id: 'sand-art',
        icon: 'sand-art',
        title: { en: 'Sand Art Performance', kn: 'ಮರಳು ಕಲೆ ಪ್ರದರ್ಶನ' },
        time: { en: 'By Mr. Raghavendra Hegde', kn: 'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಹೆಗಡೆ ಅವರಿಂದ' },
        description: {
          en: 'Stories brought to life in sand, live on stage, by a renowned sand artist.',
          kn: 'ಖ್ಯಾತ ಮರಳು ಕಲಾವಿದರಿಂದ ವೇದಿಕೆಯ ಮೇಲೆ ನೇರವಾಗಿ ಮರಳಿನಲ್ಲಿ ಮೂಡುವ ಕಥೆಗಳು.',
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

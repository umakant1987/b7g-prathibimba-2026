import type { LocalizedText } from '../types';

/** Rated aspects on the /feedback page; ids must match FEEDBACK_ASPECTS in backend/http/feedback.ts. */
export type FeedbackAspectId =
  | 'morningGuestSpeech'
  | 'santhe'
  | 'eveningCultural'
  | 'sandArt'
  | 'jamming'
  | 'lightStage'
  | 'soundSystem'
  | 'ledWall'
  | 'overall';

export type FeedbackIcon = 'mic' | 'store' | 'drama' | 'hourglass' | 'guitar' | 'lightbulb' | 'speaker' | 'monitor' | 'heart';

export interface FeedbackAspect {
  id: FeedbackAspectId;
  icon: FeedbackIcon;
  label: LocalizedText;
  hint: LocalizedText;
}

export const feedbackGroups: { title: LocalizedText; aspects: FeedbackAspect[] }[] = [
  {
    title: { en: 'The programme', kn: 'ಕಾರ್ಯಕ್ರಮಗಳು' },
    aspects: [
      { id: 'morningGuestSpeech', icon: 'mic', label: { en: 'Morning Guest Speech', kn: 'ಬೆಳಗಿನ ಅತಿಥಿಗಳ ಮಾತು' }, hint: { en: 'Samvada with the Chief Guests', kn: 'ಮುಖ್ಯ ಅತಿಥಿಗಳೊಂದಿಗೆ ಸಂವಾದ' } },
      { id: 'santhe', icon: 'store', label: { en: 'B7G Santhe', kn: 'B7G ಸಂತೆ' }, hint: { en: 'Stalls, food and shopping', kn: 'ಮಳಿಗೆಗಳು, ಊಟ-ತಿಂಡಿ, ಖರೀದಿ' } },
      { id: 'eveningCultural', icon: 'drama', label: { en: 'Evening Cultural Events', kn: 'ಸಂಜೆಯ ಸಾಂಸ್ಕೃತಿಕ ಕಾರ್ಯಕ್ರಮಗಳು' }, hint: { en: 'Songs, dances and dramas', kn: 'ಹಾಡು, ನೃತ್ಯ ಮತ್ತು ನಾಟಕಗಳು' } },
      { id: 'sandArt', icon: 'hourglass', label: { en: 'Sand Art', kn: 'ಮರಳು ಕಲೆ' }, hint: { en: 'Live sand art on stage', kn: 'ವೇದಿಕೆಯ ಮೇಲೆ ನೇರ ಮರಳು ಕಲೆ' } },
      { id: 'jamming', icon: 'guitar', label: { en: 'Jamming', kn: 'ಜಾಮಿಂಗ್' }, hint: { en: 'Music to close the night', kn: 'ರಾತ್ರಿಯ ಸಂಗೀತ' } },
    ],
  },
  {
    title: { en: 'Production', kn: 'ವ್ಯವಸ್ಥೆ' },
    aspects: [
      { id: 'lightStage', icon: 'lightbulb', label: { en: 'Light & Stage', kn: 'ಬೆಳಕು ಮತ್ತು ವೇದಿಕೆ' }, hint: { en: 'Stage set-up and lighting', kn: 'ವೇದಿಕೆ ಮತ್ತು ಬೆಳಕಿನ ವ್ಯವಸ್ಥೆ' } },
      { id: 'soundSystem', icon: 'speaker', label: { en: 'Sound System', kn: 'ಧ್ವನಿ ವ್ಯವಸ್ಥೆ' }, hint: { en: 'Clarity and volume', kn: 'ಸ್ಪಷ್ಟತೆ ಮತ್ತು ಧ್ವನಿಮಟ್ಟ' } },
      { id: 'ledWall', icon: 'monitor', label: { en: 'LED Wall Creative Content', kn: 'ಎಲ್‌ಇಡಿ ಪರದೆಯ ಸೃಜನಶೀಲ ವಿಷಯ' }, hint: { en: 'Visuals on the LED wall', kn: 'ಎಲ್‌ಇಡಿ ಪರದೆಯ ದೃಶ್ಯಗಳು' } },
    ],
  },
];

export const overallAspect: FeedbackAspect = {
  id: 'overall',
  icon: 'heart',
  label: { en: 'Overall Experience', kn: 'ಒಟ್ಟಾರೆ ಅನುಭವ' },
  hint: { en: 'How was Prathibimba 2026 for you?', kn: 'ಪ್ರತಿಬಿಂಬ 2026 ನಿಮಗೆ ಹೇಗಿತ್ತು?' },
};

export const ratingWords: LocalizedText[] = [
  { en: 'Needs work', kn: 'ಸುಧಾರಣೆ ಬೇಕು' },
  { en: 'Fair', kn: 'ಸಾಧಾರಣ' },
  { en: 'Good', kn: 'ಚೆನ್ನಾಗಿತ್ತು' },
  { en: 'Very good', kn: 'ತುಂಬಾ ಚೆನ್ನಾಗಿತ್ತು' },
  { en: 'Excellent!', kn: 'ಅದ್ಭುತ!' },
];

export const feedbackText = {
  eyebrow: { en: 'Prathibimba 2026 · Feedback', kn: 'ಪ್ರತಿಬಿಂಬ 2026 · ಅಭಿಪ್ರಾಯ' },
  thanksTitle: { en: 'Thank You, B7G Family!', kn: 'ಧನ್ಯವಾದಗಳು, B7G ಕುಟುಂಬವೇ!' },
  thanksBody: {
    en: 'Your presence, participation and generous support made B7G Kannada Rajyotsava 2026 a celebration to remember. To every resident, performer, volunteer, sponsor and contributor — thank you from the bottom of our hearts.',
    kn: 'ನಿಮ್ಮ ಉಪಸ್ಥಿತಿ, ಭಾಗವಹಿಸುವಿಕೆ ಮತ್ತು ಉದಾರ ಬೆಂಬಲದಿಂದ B7G ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ 2026 ನೆನಪಿನಲ್ಲಿ ಉಳಿಯುವ ಸಂಭ್ರಮವಾಯಿತು. ಪ್ರತಿಯೊಬ್ಬ ನಿವಾಸಿ, ಕಲಾವಿದ, ಸ್ವಯಂಸೇವಕ, ಪ್ರೋತ್ಸಾಹಕ ಮತ್ತು ದಾನಿಗಳಿಗೆ ಹೃತ್ಪೂರ್ವಕ ಧನ್ಯವಾದಗಳು.',
  },
  thanksAsk: {
    en: 'Tell us how we did — your feedback helps us make next year even better. It takes less than a minute.',
    kn: 'ನಾವು ಹೇಗೆ ಮಾಡಿದೆವು ಎಂದು ತಿಳಿಸಿ — ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ಮುಂದಿನ ವರ್ಷವನ್ನು ಇನ್ನೂ ಉತ್ತಮಗೊಳಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಒಂದು ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ ಸಮಯ ಸಾಕು.',
  },
  rateHint: { en: 'Tap the stars to rate. Skip anything you missed.', kn: 'ರೇಟ್ ಮಾಡಲು ನಕ್ಷತ್ರಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ. ನೋಡದಿದ್ದನ್ನು ಬಿಟ್ಟುಬಿಡಿ.' },
  improveLabel: { en: 'Improvement Areas', kn: 'ಸುಧಾರಣೆಯ ಅಂಶಗಳು' },
  improvePlaceholder: {
    en: 'What could we do better next year? Ideas, suggestions, anything we missed…',
    kn: 'ಮುಂದಿನ ವರ್ಷ ಏನನ್ನು ಉತ್ತಮಪಡಿಸಬಹುದು? ಆಲೋಚನೆಗಳು, ಸಲಹೆಗಳು…',
  },
  nameLabel: { en: 'Your name (optional)', kn: 'ನಿಮ್ಮ ಹೆಸರು (ಐಚ್ಛಿಕ)' },
  submit: { en: 'Submit Feedback', kn: 'ಅಭಿಪ್ರಾಯ ಸಲ್ಲಿಸಿ' },
  sending: { en: 'Sending…', kn: 'ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…' },
  needOne: { en: 'Please rate at least one part of the day, or share a suggestion.', kn: 'ದಯವಿಟ್ಟು ಕನಿಷ್ಠ ಒಂದು ಅಂಶಕ್ಕೆ ರೇಟಿಂಗ್ ನೀಡಿ ಅಥವಾ ಸಲಹೆ ಬರೆಯಿರಿ.' },
  failed: { en: 'Sorry, we could not send your feedback. Please try again.', kn: 'ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ಕಳುಹಿಸಲಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' },
  doneTitle: { en: 'Thank you for your feedback!', kn: 'ನಿಮ್ಮ ಅಭಿಪ್ರಾಯಕ್ಕೆ ಧನ್ಯವಾದಗಳು!' },
  doneBody: {
    en: 'We read every response. See you at next year’s Rajyotsava!',
    kn: 'ಪ್ರತಿಯೊಂದು ಅಭಿಪ್ರಾಯವನ್ನೂ ನಾವು ಓದುತ್ತೇವೆ. ಮುಂದಿನ ವರ್ಷದ ರಾಜ್ಯೋತ್ಸವದಲ್ಲಿ ಭೇಟಿಯಾಗೋಣ!',
  },
  backHome: { en: 'Back to the website', kn: 'ವೆಬ್‌ಸೈಟ್‌ಗೆ ಹಿಂತಿರುಗಿ' },
  tagline: { en: 'ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ!', kn: 'ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ!' },
};

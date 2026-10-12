import type { LocalizedText } from '../types';

export type ContributionIcon =
  | 'flag'
  | 'book-open'
  | 'cpu'
  | 'landmark'
  | 'zap'
  | 'coffee'
  | 'hard-hat'
  | 'gem'
  | 'crown'
  | 'users'
  | 'graduation-cap';

export interface Contribution {
  id: string;
  icon: ContributionIcon;
  title: LocalizedText;
  description: LocalizedText;
}

export const contributions: Contribution[] = [
  {
    id: 'national-flag',
    icon: 'flag',
    title: { en: 'Home of the National Flag', kn: 'ರಾಷ್ಟ್ರಧ್ವಜದ ತವರು' },
    description: {
      en: 'Every official Indian national flag is manufactured in one place: Garag village near Hubballi, Dharwad district — the only unit in the country licensed by the Bureau of Indian Standards to produce it.',
      kn: 'ಪ್ರತಿಯೊಂದು ಅಧಿಕೃತ ಭಾರತೀಯ ರಾಷ್ಟ್ರಧ್ವಜವನ್ನು ತಯಾರಿಸುವುದು ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ: ಧಾರವಾಡ ಜಿಲ್ಲೆಯ ಹುಬ್ಬಳ್ಳಿ ಬಳಿಯ ಗರಗ ಗ್ರಾಮದಲ್ಲಿ — ಇದನ್ನು ತಯಾರಿಸಲು ಭಾರತೀಯ ಗುಣಮಟ್ಟ ಬ್ಯೂರೋ ಪರವಾನಗಿ ಹೊಂದಿರುವ ದೇಶದ ಏಕೈಕ ಘಟಕ.',
    },
  },
  {
    id: 'anubhava-mantapa',
    icon: 'users',
    title: { en: 'Anubhava Mantapa: Democracy\'s Early Roots', kn: 'ಅನುಭವ ಮಂಟಪ: ಪ್ರಜಾಪ್ರಭುತ್ವದ ಬೇರು' },
    description: {
      en: 'In the 12th century at Basavakalyana, Basavanna\'s Anubhava Mantapa brought men and women of every caste together to debate social and spiritual questions as equals — often called the world\'s first parliament. India\'s Parliament honours this ideal: a statue of Basavanna stands in the Parliament House complex.',
      kn: '12ನೇ ಶತಮಾನದಲ್ಲಿ ಬಸವಕಲ್ಯಾಣದಲ್ಲಿ ಬಸವಣ್ಣನವರ ಅನುಭವ ಮಂಟಪದಲ್ಲಿ ಎಲ್ಲ ಜಾತಿಯ ಸ್ತ್ರೀ–ಪುರುಷರು ಸಮಾನರಾಗಿ ಸಾಮಾಜಿಕ ಮತ್ತು ಆಧ್ಯಾತ್ಮಿಕ ವಿಷಯಗಳನ್ನು ಚರ್ಚಿಸುತ್ತಿದ್ದರು — ಇದನ್ನು ಜಗತ್ತಿನ ಮೊದಲ ಸಂಸತ್ತು ಎಂದೇ ಕರೆಯಲಾಗುತ್ತದೆ. ಭಾರತದ ಸಂಸತ್ತು ಈ ಆದರ್ಶವನ್ನು ಗೌರವಿಸುತ್ತದೆ: ಸಂಸತ್ ಭವನದ ಆವರಣದಲ್ಲಿ ಬಸವಣ್ಣನವರ ಪ್ರತಿಮೆ ಇದೆ.',
    },
  },
  {
    id: 'jnanpith',
    icon: 'book-open',
    title: { en: 'A Literary Powerhouse', kn: 'ಸಾಹಿತ್ಯ ಶಕ್ತಿಕೇಂದ್ರ' },
    description: {
      en: 'Kannada has been honoured with 8 Jnanpith Awards — India\'s highest literary award — more than any other Indian language.',
      kn: 'ಕನ್ನಡಕ್ಕೆ 8 ಜ್ಞಾನಪೀಠ ಪ್ರಶಸ್ತಿಗಳು ಸಂದಿವೆ — ಭಾರತದ ಅತ್ಯುನ್ನತ ಸಾಹಿತ್ಯ ಪ್ರಶಸ್ತಿ — ಇದು ಯಾವುದೇ ಇತರ ಭಾರತೀಯ ಭಾಷೆಗಿಂತ ಹೆಚ್ಚು.',
    },
  },
  {
    id: 'silicon-valley',
    icon: 'cpu',
    title: { en: 'India\'s Silicon Valley', kn: 'ಭಾರತದ ಸಿಲಿಕಾನ್ ವ್ಯಾಲಿ' },
    description: {
      en: 'Bengaluru drives India\'s technology economy and hosts ISRO\'s headquarters, anchoring the nation\'s software and space ambitions alike.',
      kn: 'ಬೆಂಗಳೂರು ಭಾರತದ ತಂತ್ರಜ್ಞಾನ ಆರ್ಥಿಕತೆಯನ್ನು ಮುನ್ನಡೆಸುತ್ತದೆ ಮತ್ತು ಇಸ್ರೋದ ಪ್ರಧಾನ ಕಚೇರಿಯನ್ನು ಹೊಂದಿದೆ, ದೇಶದ ಸಾಫ್ಟ್‌ವೇರ್ ಮತ್ತು ಬಾಹ್ಯಾಕಾಶ ಕನಸುಗಳೆರಡಕ್ಕೂ ಆಧಾರವಾಗಿದೆ.',
    },
  },
  {
    id: 'visvesvaraya',
    icon: 'hard-hat',
    title: { en: 'The Engineer Nation Honours', kn: 'ರಾಷ್ಟ್ರ ಗೌರವಿಸುವ ಎಂಜಿನಿಯರ್' },
    description: {
      en: 'Sir M. Visvesvaraya — Bharat Ratna recipient and chief architect of the KRS Dam — is remembered every September 15, observed across India as Engineer\'s Day in his honour.',
      kn: 'ಸರ್ ಎಂ. ವಿಶ್ವೇಶ್ವರಯ್ಯ — ಭಾರತ ರತ್ನ ಪುರಸ್ಕೃತರು ಮತ್ತು ಕೆ.ಆರ್.ಎಸ್ ಅಣೆಕಟ್ಟಿನ ಪ್ರಮುಖ ವಿನ್ಯಾಸಕಾರರು — ಅವರ ಗೌರವಾರ್ಥ ಪ್ರತಿ ವರ್ಷ ಸೆಪ್ಟೆಂಬರ್ 15 ರಂದು ಭಾರತದಾದ್ಯಂತ ಎಂಜಿನಿಯರ್‌ಗಳ ದಿನವನ್ನಾಗಿ ಆಚರಿಸಲಾಗುತ್ತದೆ.',
    },
  },
  {
    id: 'hampi',
    icon: 'landmark',
    title: { en: 'Capital of a Golden Empire', kn: 'ಸುವರ್ಣ ಸಾಮ್ರಾಜ್ಯದ ರಾಜಧಾನಿ' },
    description: {
      en: 'Hampi, a UNESCO World Heritage Site, was the capital of the Vijayanagara Empire — once among the richest and largest cities in the world.',
      kn: 'ಯುನೆಸ್ಕೋ ವಿಶ್ವ ಪರಂಪರೆಯ ತಾಣವಾದ ಹಂಪಿ, ವಿಜಯನಗರ ಸಾಮ್ರಾಜ್ಯದ ರಾಜಧಾನಿಯಾಗಿತ್ತು — ಒಂದು ಕಾಲದಲ್ಲಿ ಜಗತ್ತಿನ ಅತ್ಯಂತ ಶ್ರೀಮಂತ ಮತ್ತು ದೊಡ್ಡ ನಗರಗಳಲ್ಲಿ ಒಂದಾಗಿತ್ತು.',
    },
  },
  {
    id: 'hoysala',
    icon: 'gem',
    title: { en: 'Stone Carved Into Lace', kn: 'ಕಲ್ಲಿನಲ್ಲಿ ಅರಳಿದ ಕುಸುರಿ' },
    description: {
      en: 'The Hoysala dynasty\'s temples at Belur, Halebidu and Somanathapura are carved with such intricate detail that UNESCO inscribed them as a World Heritage Site in 2023.',
      kn: 'ಬೇಲೂರು, ಹಳೇಬೀಡು ಮತ್ತು ಸೋಮನಾಥಪುರದಲ್ಲಿರುವ ಹೊಯ್ಸಳ ದೇವಾಲಯಗಳು ಎಷ್ಟು ಸೂಕ್ಷ್ಮವಾಗಿ ಕೆತ್ತಲ್ಪಟ್ಟಿವೆ ಎಂದರೆ, ಯುನೆಸ್ಕೋ 2023ರಲ್ಲಿ ಅವುಗಳನ್ನು ವಿಶ್ವ ಪರಂಪರೆಯ ತಾಣವೆಂದು ಘೋಷಿಸಿತು.',
    },
  },
  {
    id: 'mysore-palace',
    icon: 'crown',
    title: { en: 'A Palace That Outshines Diwali', kn: 'ದೀಪಾವಳಿಯನ್ನೂ ಮೀರಿಸುವ ಅರಮನೆ' },
    description: {
      en: 'The Mysore Palace, seat of the Wadiyar dynasty, is lit by nearly 100,000 bulbs every Dasara and draws more visitors each year than the Taj Mahal.',
      kn: 'ಒಡೆಯರ್ ವಂಶದ ರಾಜಧಾನಿಯಾಗಿದ್ದ ಮೈಸೂರು ಅರಮನೆ ಪ್ರತಿ ದಸರಾದಲ್ಲಿ ಸುಮಾರು 1 ಲಕ್ಷ ಬಲ್ಬ್‌ಗಳಿಂದ ಬೆಳಗುತ್ತದೆ ಮತ್ತು ಪ್ರತಿ ವರ್ಷ ತಾಜ್ ಮಹಲ್‌ಗಿಂತ ಹೆಚ್ಚು ಪ್ರವಾಸಿಗರನ್ನು ಸೆಳೆಯುತ್ತದೆ.',
    },
  },
  {
    id: 'mysuru-model-state',
    icon: 'graduation-cap',
    title: { en: 'Mysuru: India\'s Model State', kn: 'ಮೈಸೂರು: ಮಾದರಿ ರಾಜ್ಯ' },
    description: {
      en: 'Under the Wadiyars — especially Krishnaraja Wadiyar IV, whom Mahatma Gandhi called "Rajarshi" — Mysuru became a model state: it founded the University of Mysore (1916), built the KRS dam, and pioneered reservation in government jobs for backward communities after the Miller Committee (1918), long before Independence.',
      kn: 'ಒಡೆಯರ್ ಆಳ್ವಿಕೆಯಲ್ಲಿ — ವಿಶೇಷವಾಗಿ ಮಹಾತ್ಮ ಗಾಂಧೀಜಿ "ರಾಜರ್ಷಿ" ಎಂದು ಕರೆದ ನಾಲ್ವಡಿ ಕೃಷ್ಣರಾಜ ಒಡೆಯರ್ ಕಾಲದಲ್ಲಿ — ಮೈಸೂರು ಮಾದರಿ ರಾಜ್ಯವಾಯಿತು: ಮೈಸೂರು ವಿಶ್ವವಿದ್ಯಾನಿಲಯ (1916), ಕೆ.ಆರ್.ಎಸ್ ಅಣೆಕಟ್ಟು, ಹಾಗೂ ಮಿಲ್ಲರ್ ಸಮಿತಿಯ (1918) ನಂತರ ಹಿಂದುಳಿದ ವರ್ಗಗಳಿಗೆ ಸರ್ಕಾರಿ ಉದ್ಯೋಗಗಳಲ್ಲಿ ಮೀಸಲಾತಿ — ಸ್ವಾತಂತ್ರ್ಯಕ್ಕೂ ಬಹಳ ಮೊದಲೇ.',
    },
  },
  {
    id: 'hydro',
    icon: 'zap',
    title: { en: 'Asia\'s First Hydroelectric Power', kn: 'ಏಷ್ಯಾದ ಮೊದಲ ಜಲವಿದ್ಯುತ್' },
    description: {
      en: 'The Shivanasamudra plant (1902) was one of Asia\'s first hydroelectric power stations, lighting up Bengaluru and the Kolar Gold Fields decades ahead of most of the world.',
      kn: 'ಶಿವನಸಮುದ್ರ ವಿದ್ಯುತ್ ಕೇಂದ್ರ (1902) ಏಷ್ಯಾದ ಮೊದಲ ಜಲವಿದ್ಯುತ್ ಕೇಂದ್ರಗಳಲ್ಲಿ ಒಂದಾಗಿತ್ತು, ಇದು ಬೆಂಗಳೂರು ಮತ್ತು ಕೋಲಾರ ಚಿನ್ನದ ಗಣಿಗಳನ್ನು ಜಗತ್ತಿನ ಬಹುಪಾಲು ಭಾಗಕ್ಕಿಂತ ದಶಕಗಳ ಮೊದಲೇ ಬೆಳಗಿಸಿತು.',
    },
  },
  {
    id: 'coffee',
    icon: 'coffee',
    title: { en: 'India\'s Coffee Country', kn: 'ಭಾರತದ ಕಾಫಿ ನಾಡು' },
    description: {
      en: 'The hills of Kodagu and Chikmagalur grow the majority of all coffee produced in India.',
      kn: 'ಕೊಡಗು ಮತ್ತು ಚಿಕ್ಕಮಗಳೂರಿನ ಬೆಟ್ಟಗಳು ಭಾರತದಲ್ಲಿ ಉತ್ಪಾದನೆಯಾಗುವ ಬಹುಪಾಲು ಕಾಫಿಯನ್ನು ಬೆಳೆಯುತ್ತವೆ.',
    },
  },
];

/** "Other Significant Achievements" card — keep in sync with knowledge/achievers/. */
export interface Achiever {
  id: string;
  name: LocalizedText;
  honour: LocalizedText;
  description: LocalizedText;
  /** Further honours, shown as small badges under the description. */
  awards?: LocalizedText[];
}

export const achievers: Achiever[] = [
  {
    id: 'cv-raman',
    name: { en: 'Sir C. V. Raman', kn: 'ಸರ್ ಸಿ.ವಿ. ರಾಮನ್' },
    honour: { en: 'Nobel Prize in Physics, 1930', kn: 'ಭೌತಶಾಸ್ತ್ರ ನೊಬೆಲ್ ಪ್ರಶಸ್ತಿ, 1930' },
    description: {
      en: 'Discovered the Raman Effect: light scattered by a substance changes colour slightly, revealing what it is made of. Asia’s first Nobel Prize in science; he later led IISc and founded the Raman Research Institute in Bengaluru.',
      kn: 'ವಸ್ತುವಿನ ಮೂಲಕ ಚದುರುವ ಬೆಳಕಿನ ಬಣ್ಣ ಸ್ವಲ್ಪ ಬದಲಾಗಿ ಆ ವಸ್ತುವಿನ ರಚನೆಯನ್ನು ತಿಳಿಸುತ್ತದೆ ಎಂಬ "ರಾಮನ್ ಪರಿಣಾಮ"ವನ್ನು ಕಂಡುಹಿಡಿದರು. ವಿಜ್ಞಾನದಲ್ಲಿ ಏಷ್ಯಾಕ್ಕೆ ಮೊದಲ ನೊಬೆಲ್; ನಂತರ ಬೆಂಗಳೂರಿನ ಭಾರತೀಯ ವಿಜ್ಞಾನ ಸಂಸ್ಥೆಯನ್ನು ಮುನ್ನಡೆಸಿ, ರಾಮನ್ ಸಂಶೋಧನಾ ಸಂಸ್ಥೆಯನ್ನು ಸ್ಥಾಪಿಸಿದರು.',
    },
  },
  {
    id: 'cnr-rao',
    name: { en: 'Dr. C. N. R. Rao', kn: 'ಡಾ. ಸಿ.ಎನ್.ಆರ್. ರಾವ್' },
    honour: { en: 'Bharat Ratna, 2014', kn: 'ಭಾರತ ರತ್ನ, 2014' },
    description: {
      en: 'Bengaluru-born pioneer of solid-state and materials chemistry, exploring how the arrangement of atoms gives materials powers like superconductivity, work that feeds into nanoscience. He founded JNCASR in Bengaluru and inspired generations of scientists.',
      kn: 'ಬೆಂಗಳೂರಿನಲ್ಲಿ ಜನಿಸಿದ ಘನಸ್ಥಿತಿ ಮತ್ತು ವಸ್ತು ರಸಾಯನಶಾಸ್ತ್ರದ ಪ್ರವರ್ತಕರು. ಪರಮಾಣುಗಳ ಜೋಡಣೆ ವಸ್ತುಗಳಿಗೆ ಅತಿವಾಹಕತೆಯಂತಹ ವಿಶೇಷ ಗುಣಗಳನ್ನು ಹೇಗೆ ನೀಡುತ್ತದೆ ಎಂದು ಸಂಶೋಧಿಸಿದರು; ಇದು ನ್ಯಾನೋವಿಜ್ಞಾನಕ್ಕೆ ಬುನಾದಿ. ಬೆಂಗಳೂರಿನಲ್ಲಿ JNCASR ಸ್ಥಾಪಿಸಿ ವಿಜ್ಞಾನಿಗಳ ತಲೆಮಾರುಗಳಿಗೆ ಸ್ಫೂರ್ತಿಯಾದರು.',
    },
  },
  {
    id: 'raja-ramanna',
    name: { en: 'Dr. Raja Ramanna', kn: 'ಡಾ. ರಾಜಾ ರಾಮಣ್ಣ' },
    honour: { en: 'Padma Vibhushan, 1975', kn: 'ಪದ್ಮವಿಭೂಷಣ, 1975' },
    description: {
      en: 'Tumakuru-born nuclear physicist who led the scientific team behind India’s first nuclear test, Pokhran-I (1974). As head of BARC and the Atomic Energy Commission, he strengthened India’s nuclear research and energy programme.',
      kn: 'ತುಮಕೂರಿನಲ್ಲಿ ಜನಿಸಿದ ಅಣು ಭೌತವಿಜ್ಞಾನಿ. ಭಾರತದ ಮೊದಲ ಅಣು ಪರೀಕ್ಷೆ ಪೋಖ್ರಾನ್–1ರ (1974) ವೈಜ್ಞಾನಿಕ ತಂಡವನ್ನು ಮುನ್ನಡೆಸಿದರು. BARC ಮತ್ತು ಅಣುಶಕ್ತಿ ಆಯೋಗದ ಮುಖ್ಯಸ್ಥರಾಗಿ ಭಾರತದ ಅಣು ಸಂಶೋಧನೆ ಮತ್ತು ಇಂಧನ ಕಾರ್ಯಕ್ರಮವನ್ನು ಬಲಪಡಿಸಿದರು.',
    },
  },
  {
    id: 'dr-rajkumar',
    name: { en: 'Dr. Rajkumar', kn: 'ಡಾ. ರಾಜ್‌ಕುಮಾರ್' },
    honour: { en: 'Dadasaheb Phalke Award, 1995', kn: 'ದಾದಾಸಾಹೇಬ್ ಫಾಲ್ಕೆ ಪ್ರಶಸ್ತಿ, 1995' },
    description: {
      en: 'Nata Saarvabhouma of Kannada cinema: a theatre-trained actor and beloved singer whose 200+ films carried Kannada language, literature and values into every home. He lent his voice to the Gokak movement and remains an icon of Kannada pride.',
      kn: 'ಕನ್ನಡ ಚಿತ್ರರಂಗದ ನಟಸಾರ್ವಭೌಮ. ರಂಗಭೂಮಿಯಿಂದ ಬಂದ ನಟ ಮತ್ತು ಜನಪ್ರಿಯ ಗಾಯಕ; 200ಕ್ಕೂ ಹೆಚ್ಚು ಚಿತ್ರಗಳ ಮೂಲಕ ಕನ್ನಡ ಭಾಷೆ, ಸಾಹಿತ್ಯ ಮತ್ತು ಮೌಲ್ಯಗಳನ್ನು ಮನೆಮನೆಗೆ ತಲುಪಿಸಿದರು. ಗೋಕಾಕ್ ಚಳವಳಿಗೆ ಧ್ವನಿಯಾದ ಅವರು ಕನ್ನಡ ಅಭಿಮಾನದ ಶಾಶ್ವತ ಪ್ರತೀಕ.',
    },
    awards: [
      { en: 'Padma Bhushan (1983)', kn: 'ಪದ್ಮಭೂಷಣ ಪ್ರಶಸ್ತಿ (1983)' },
      { en: 'Karnataka Ratna (1992)', kn: 'ಕರ್ನಾಟಕ ರತ್ನ ಪ್ರಶಸ್ತಿ (1992)' },
      { en: 'National Award for Best Male Playback Singer (1993)', kn: 'ಶ್ರೇಷ್ಠ ಗಾಯಕ ರಾಷ್ಟ್ರಪ್ರಶಸ್ತಿ (1993)' },
    ],
  },
  {
    id: 'adi-shankaracharya',
    name: { en: 'Adi Shankaracharya', kn: 'ಆದಿ ಶಂಕರಾಚಾರ್ಯರು' },
    honour: { en: 'Exponent of Advaita Vedanta', kn: 'ಅದ್ವೈತ ವೇದಾಂತದ ಪ್ರತಿಪಾದಕರು' },
    description: {
      en: 'Taught Advaita: the inner Self (Atman) and the ultimate reality (Brahman) are not two but one. His commentaries on the Upanishads, Bhagavad Gita and Brahma Sutras shaped Indian thought; tradition holds he founded the Sringeri Sharada Peetham on the Tunga.',
      kn: 'ಆತ್ಮ ಮತ್ತು ಪರಮ ಸತ್ಯವಾದ ಬ್ರಹ್ಮ ಎರಡಲ್ಲ, ಒಂದೇ ಎಂಬ ಅದ್ವೈತ ತತ್ವವನ್ನು ಬೋಧಿಸಿದರು. ಉಪನಿಷತ್ತುಗಳು, ಭಗವದ್ಗೀತೆ ಮತ್ತು ಬ್ರಹ್ಮಸೂತ್ರಗಳ ಮೇಲಿನ ಅವರ ಭಾಷ್ಯಗಳು ಭಾರತೀಯ ಚಿಂತನೆಯನ್ನು ರೂಪಿಸಿದವು. ತುಂಗಾ ತೀರದ ಶೃಂಗೇರಿ ಶಾರದಾ ಪೀಠವನ್ನು ಅವರು ಸ್ಥಾಪಿಸಿದರೆಂದು ಪರಂಪರೆ ಹೇಳುತ್ತದೆ.',
    },
  },
];

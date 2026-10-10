import type { LocalizedText } from '../types';

export interface ContributeQr {
  id: string;
  label: LocalizedText;
  /** Image path under public/, e.g. '/contribute/qr-1.png'. Empty shows a "coming soon" placeholder. */
  image: string;
  /** Optional UPI ID shown under the QR with a copy button, e.g. 'b7g@upi'. */
  upiId: string;
}

/**
 * Contribute section settings — fill these in; no other code changes needed.
 *  1. Put the two QR images in public/contribute/ (PNG or JPG; square works best).
 *  2. Set each `image` path (and `upiId` if you want it shown), and the labels.
 *  3. Set `phone`. Rebuild the site.
 * Until then the section shows tidy "coming soon" placeholders.
 */
export const contributeConfig: { qrCodes: ContributeQr[]; phone: string; phoneLabel: LocalizedText } = {
  qrCodes: [
    {
      id: 'qr-1',
      label: { en: 'Scan to contribute', kn: 'ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಕೊಡುಗೆ ನೀಡಿ' },
      image: '',
      upiId: '',
    },
    {
      id: 'qr-2',
      label: { en: 'Scan to contribute', kn: 'ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಕೊಡುಗೆ ನೀಡಿ' },
      image: '',
      upiId: '',
    },
  ],
  /** e.g. '+91 98xxx xxxxx'. Empty shows "coming soon". */
  phone: '',
  phoneLabel: { en: 'For contribution queries, call', kn: 'ಕೊಡುಗೆ ಕುರಿತ ಮಾಹಿತಿಗೆ ಕರೆ ಮಾಡಿ' },
};

import type { LocalizedText } from '../types';

export interface ContributeContact {
  id: string;
  name: LocalizedText;
  /** UPI ID (VPA) to pay to, e.g. 'name@okicici'. */
  upiId: string;
  /** Mobile number with country code, for questions about contributions. */
  phone: string;
}

/**
 * Contribute section: pay by UPI to these IDs (no QR codes, bank details or amounts).
 * Shown while VITE_SHOW_CONTRIBUTE=true. Keep knowledge/contribute.md in sync.
 */
export const contributeConfig: { contacts: ContributeContact[]; upiNote: string } = {
  contacts: [
    { id: 'anant', name: { en: 'Anant', kn: 'ಅನಂತ್' }, upiId: 'ananth.pallaki@okicici', phone: '+919538241456' },
    { id: 'umakant', name: { en: 'Umakant', kn: 'ಉಮಾಕಾಂತ್' }, upiId: 'umakanth.friend-1@okhdfcbank', phone: '+919844874394' },
  ],
  /** Payment note pre-filled in the UPI app. */
  upiNote: 'B7G Kannada Rajyotsava 2026',
};

/** "+919538241456" -> "95382 41456" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : phone;
}

export type MobilePlatform = 'android' | 'ios' | 'other';

export function detectPlatform(userAgent: string): MobilePlatform {
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  return 'other';
}

const ANDROID_PACKAGES = { gpay: 'com.google.android.apps.nbu.paisa.user', phonepe: 'com.phonepe.app' };

/**
 * UPI payment links (the amount is left for the payer to enter):
 *  - any:     upi://pay — Android shows its chooser of installed UPI apps.
 *  - gpay / phonepe: open that app directly (Android intent with the app's package; iOS app schemes).
 */
export function upiLinks(contact: ContributeContact, note: string, platform: MobilePlatform) {
  const query = new URLSearchParams({ pa: contact.upiId, pn: contact.name.en, cu: 'INR', tn: note }).toString();
  const android = (pkg: string) => `intent://pay?${query}#Intent;scheme=upi;package=${pkg};end`;
  return {
    any: `upi://pay?${query}`,
    gpay: platform === 'android' ? android(ANDROID_PACKAGES.gpay) : `gpay://upi/pay?${query}`,
    phonepe: platform === 'android' ? android(ANDROID_PACKAGES.phonepe) : `phonepe://pay?${query}`,
  };
}

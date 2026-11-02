import type { LocalizedText } from '../types';

export interface ContributeContact {
  id: string;
  name: LocalizedText;
  /** Mobile number as dialled, with country code, e.g. '+919538241456'. */
  phone: string;
  /**
   * UPI ID (VPA) such as 'name@okaxis'. Leave empty until it is confirmed — a mobile
   * number is not necessarily a UPI ID. When set, a "Pay via UPI" button appears that
   * opens the phone's UPI apps (Google Pay, PhonePe, …) through a upi://pay link.
   */
  upiId: string;
}

/**
 * Contribute section: contact names and numbers only (no QR codes, bank details or amounts).
 * Shown while VITE_SHOW_CONTRIBUTE=true. Keep knowledge/contribute.md in sync.
 */
export const contributeConfig: { contacts: ContributeContact[]; upiNote: string } = {
  contacts: [
    { id: 'anant', name: { en: 'Anant', kn: 'ಅನಂತ್' }, phone: '+919538241456', upiId: '' },
    { id: 'umakant', name: { en: 'Umakant', kn: 'ಉಮಾಕಾಂತ್' }, phone: '+919844874394', upiId: '' },
  ],
  /** Payment note pre-filled in the UPI app. */
  upiNote: 'B7G Kannada Rajyotsava 2026',
};

/** "+919538241456" -> "95382 41456" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : phone;
}

/** UPI payment intent; on Android the system lets the visitor choose their UPI app. */
export function upiPayLink(contact: ContributeContact, note: string): string {
  const params = new URLSearchParams({ pa: contact.upiId, pn: contact.name.en, cu: 'INR', tn: note });
  return `upi://pay?${params.toString()}`;
}

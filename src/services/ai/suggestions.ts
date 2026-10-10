import { SHOW_PROGRAMME_DETAILS } from '../../config/env';

/** Suggested questions to offer: schedule questions only once the detailed programme is released. */
export function isSuggestionVisible(question: string): boolean {
  return SHOW_PROGRAMME_DETAILS || !/schedule|running order|programs? (are|for)/i.test(question);
}

/**
 * Lets any component open the AI chat (e.g. the "B7G Siri" button in the header)
 * without sharing state with AIChatAssistant.
 */
const OPEN_CHAT_EVENT = 'b7g:open-chat';

export function openChat(): void {
  window.dispatchEvent(new Event(OPEN_CHAT_EVENT));
}

export function onOpenChat(handler: () => void): () => void {
  window.addEventListener(OPEN_CHAT_EVENT, handler);
  return () => window.removeEventListener(OPEN_CHAT_EVENT, handler);
}

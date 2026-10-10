import { useCallback, useEffect, useRef, useState } from 'react';
import { answerQuestion } from '../services/ai/ragService';
import type { ChatMessage, Language } from '../types';

function createMessage(role: ChatMessage['role'], content: string, extra?: Partial<ChatMessage>): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

interface UseAIChatResult {
  messages: ChatMessage[];
  isTyping: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
}

export function useAIChat(language: Language): UseAIChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Last guest discussed, so "What movies has he acted in?" knows who "he" is.
  const lastGuestIdRef = useRef<string | undefined>(undefined);
  // One id per chat session, so the backend can follow the conversation.
  const [conversationId] = useState(() => `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setMessages((prev) => [...prev, createMessage('user', trimmed)]);
      setIsTyping(true);
      setError(null);

      try {
        const history = messagesRef.current.slice(-6).map(({ role, content }) => ({ role, content }));
        const result = await answerQuestion(trimmed, language, {
          lastGuestId: lastGuestIdRef.current,
          conversationId,
          history,
        });
        if (result.guestId) lastGuestIdRef.current = result.guestId;
        setMessages((prev) => [
          ...prev,
          createMessage('assistant', result.answer, {
            cards: result.cards,
            sources: result.sources,
            suggestedFollowUps: result.suggestedFollowUps,
          }),
        ]);
      } catch {
        setError("The assistant is temporarily unavailable. Please try again.");
      } finally {
        setIsTyping(false);
      }
    },
    [language, conversationId],
  );

  return { messages, isTyping, error, sendMessage };
}

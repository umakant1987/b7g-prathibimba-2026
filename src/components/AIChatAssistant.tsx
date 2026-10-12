import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import { useAIChat } from '../hooks/useAIChat';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../data/translations';
import { isSuggestionVisible } from '../services/ai/suggestions';
import { onOpenChat } from '../services/chatLauncher';
import { onLaunchDone } from '../services/launch';
import { GuestCardView, RichText } from './ChatMessageContent';

/**
 * The chat opens by itself once per page load (unless the visitor already opened it),
 * after the launch loader has finished and the visitor has scrolled this far themselves.
 */
const AUTO_OPEN_SCROLL_SCREENS = 2;

/** Page scroll position; read from every candidate so it also works where the body scrolls (some mobile browsers). */
const scrollTop = () => Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);

export function AIChatAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { language, t } = useLanguage();
  const { messages, isTyping, error, sendMessage } = useAIChat(language);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Set once the chat has been open in this page load, so the auto-open never interrupts twice.
  const shownRef = useRef(false);
  const openPanel = () => {
    shownRef.current = true;
    setOpen(true);
  };

  // Header "B7G Siri" button (and anything else that calls openChat()).
  useEffect(() => onOpenChat(openPanel), []);

  // Help visitors discover the assistant: once the website is showing, open it after the
  // visitor's own scrolling adds up to ~2 screens (2–3 swipes on a phone). Only downward
  // movement from that point counts, so a restored scroll position can't trigger it.
  useEffect(() => {
    let last = 0;
    let scrolled = 0;
    const onScroll = () => {
      const y = scrollTop();
      if (y > last) scrolled += y - last;
      last = y;
      if (scrolled >= window.innerHeight * AUTO_OPEN_SCROLL_SCREENS) {
        if (!shownRef.current) openPanel();
        stop();
      }
    };
    // Capture phase on document catches scrolling of the window and of the body alike.
    const stop = () => document.removeEventListener('scroll', onScroll, true);
    const unsubscribe = onLaunchDone(() => {
      last = scrollTop();
      document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    });
    return () => {
      unsubscribe();
      stop();
    };
  }, []);

  // Your question and the typing indicator scroll to the bottom, but a new
  // answer scrolls to its own start so long answers are read from the top.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && !isTyping) {
      const answer = container.querySelector<HTMLElement>(`[data-message-id="${last.id}"]`);
      if (answer) {
        container.scrollTo({ top: Math.max(0, answer.offsetTop - 12), behavior: 'smooth' });
        return;
      }
    }
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    sendMessage(text);
    setInput('');
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={openPanel}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: open ? 0 : 1, scale: open ? 0.8 : 1 }}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-gold to-saffron text-ink font-semibold shadow-lg hover:brightness-110 transition"
        aria-label={t(translations.chat.launcher)}
      >
        <Bot size={20} />
        <span className="hidden sm:inline">{t(translations.chat.launcher)}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[400px] sm:h-[600px] sm:rounded-2xl z-50 bg-ink border border-cream/10 flex flex-col overflow-hidden shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={t(translations.chat.title)}
          >
            <header className="flex items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-maroon to-ink border-b border-cream/10">
              <div className="flex items-center gap-3">
                <span className="glass rounded-full p-2">
                  <Sparkles size={18} className="text-gold" />
                </span>
                <div>
                  <p className="font-semibold text-cream leading-snug">{t(translations.chat.title)}</p>
                  <p className="text-xs text-cream/60">{t(translations.chat.subtitle)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="text-cream/70 hover:text-cream"
              >
                <X size={22} />
              </button>
            </header>

            <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="glass rounded-2xl px-4 py-3 text-sm leading-relaxed text-cream">
                    {t(translations.chat.welcome)}
                  </div>
                  <p className="text-sm text-cream/60 text-center mt-4">
                    {language === 'kn' ? 'ಪ್ರಾರಂಭಿಸಲು ಒಂದು ಪ್ರಶ್ನೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Try one of these to get started'}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {translations.chat.suggestions.filter((s) => isSuggestionVisible(s.en)).map((s) => (
                      <button
                        key={s.en}
                        type="button"
                        onClick={() => handleSend(t(s))}
                        className="text-xs sm:text-sm glass rounded-full px-3 py-1.5 text-cream/80 hover:bg-cream/10"
                      >
                        {t(s)}
                      </button>
                    ))}
                  </div>

                  {/* B7G Santhe: same chips, same handleSend → same RAG flow as a typed question */}
                  <div className="mt-5 rounded-2xl border border-gold/30 bg-gold/5 px-3 py-3">
                    <p className="text-sm font-semibold text-gold text-center">🛍️ {t(translations.chat.santheTitle)}</p>
                    <div className="mt-2 flex flex-wrap gap-2 justify-center">
                      {translations.chat.santheSuggestions.map((s) => (
                        <button
                          key={s.en}
                          type="button"
                          onClick={() => handleSend(t(s))}
                          className="text-xs sm:text-sm glass rounded-full px-3 py-1.5 text-cream/90 hover:bg-cream/10"
                        >
                          {t(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  data-message-id={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      message.role === 'user' ? 'bg-gold text-ink' : 'glass text-cream'
                    }`}
                  >
                    {message.cards && message.cards.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {message.cards.map((card) => (
                          <GuestCardView key={`${message.id}-${card.id}`} card={card} />
                        ))}
                      </div>
                    )}
                    {message.role === 'assistant' ? <RichText text={message.content} /> : <p>{message.content}</p>}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-cream/50">{language === 'kn' ? 'ಮೂಲಗಳು:' : 'Sources:'}</span>
                        {message.sources.map((source, i) => (
                          <span
                            key={`${message.id}-source-${i}`}
                            className="text-[11px] text-cream/60 border border-cream/20 rounded-full px-2 py-0.5"
                          >
                            {source.type === 'schedule' ? '📅' : '📖'} {source.label}
                          </span>
                        ))}
                      </div>
                    )}
                    {message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <p className="w-full text-[11px] text-cream/50">
                          {language === 'kn' ? 'ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು:' : 'You can ask me:'}
                        </p>
                        {message.suggestedFollowUps.filter(isSuggestionVisible).map((follow) => (
                          <button
                            key={follow}
                            type="button"
                            onClick={() => handleSend(follow)}
                            className="text-[11px] bg-cream/10 hover:bg-cream/20 rounded-full px-2.5 py-1 text-cream/80"
                          >
                            {follow}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="glass rounded-2xl px-4 py-3 flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-cream/60"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-crimson-light text-center">{error}</p>}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex items-center gap-2 px-4 py-3 border-t border-cream/10"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t(translations.chat.placeholder)}
                aria-label={t(translations.chat.placeholder)}
                className="flex-1 bg-transparent text-cream placeholder:text-cream/40 text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="bg-gold text-ink rounded-full p-2 disabled:opacity-40 hover:brightness-110"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

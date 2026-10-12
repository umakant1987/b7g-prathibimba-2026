import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HandHeart, Menu, Sparkles, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../data/translations';
import { SHOW_CONTRIBUTE } from '../config/env';
import { openChat } from '../services/chatLauncher';

const NAV_LINKS: { key: keyof typeof translations.nav; href: string }[] = [
  { key: 'why', href: '#why' },
  { key: 'schedule', href: '#schedule' },
  { key: 'gallery', href: '#gallery' },
  { key: 'sponsors', href: '#sponsors' },
];

export function Navbar() {
  const { t, language, toggleLanguage } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-colors duration-300 ${
        scrolled ? 'bg-ink/90 backdrop-blur-md border-b border-cream/10' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <img src="/logo.jpg" alt="B7G Kannada Rajyotsava" className="h-11 w-11 sm:h-16 sm:w-16 rounded-full object-cover shrink-0" />
          {/* On very narrow phones only the logo shows, leaving room for Contribute + menu */}
          <span className="hidden min-[420px]:inline font-kannada text-base sm:text-xl font-bold text-gradient-gold">
            B7G ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="text-sm font-medium text-cream/80 hover:text-gold transition-colors"
            >
              {t(translations.nav[link.key])}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label="Switch language"
            className="text-sm font-semibold text-cream/80 hover:text-gold transition-colors px-3 py-1.5 rounded-full border border-cream/20"
          >
            {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
          </button>
          {SHOW_CONTRIBUTE && (
            <a
              href="#contribute"
              className="inline-flex items-center gap-2 text-base font-bold px-5 py-2.5 rounded-full bg-gradient-to-r from-gold to-saffron text-ink hover:brightness-110 transition"
            >
              <HandHeart size={19} />
              {t(translations.nav.contribute)}
            </a>
          )}
        </div>

        {/* Phones: the main action stays visible in the bar, not hidden in the menu */}
        <div className="md:hidden flex items-center gap-3">
          {/* Phones: a named button, because the floating chat icon alone isn't recognised as the assistant */}
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              openChat();
            }}
            className="inline-flex items-center gap-1.5 text-sm font-bold px-3.5 py-2 rounded-full bg-gradient-to-r from-gold to-saffron text-ink shadow-[0_0_16px_rgba(246,215,132,0.45)]"
          >
            <Sparkles size={15} />
            <span className="font-kannada">{t(translations.nav.siri)}</span>
          </button>
          {SHOW_CONTRIBUTE && (
            <a
              href="#contribute"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-1.5 text-sm font-bold px-3.5 py-2 rounded-full bg-gradient-to-r from-gold to-saffron text-ink"
            >
              <HandHeart size={16} />
              {t(translations.nav.contribute)}
            </a>
          )}
          <button
            type="button"
            className="text-cream"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-ink/95 backdrop-blur-md border-b border-cream/10 px-5 pb-6 pt-2 flex flex-col gap-4"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-cream/90 text-base font-medium"
            >
              {t(translations.nav[link.key])}
            </a>
          ))}
          <div className="pt-2">
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label="Switch language"
              className="text-sm font-semibold text-cream/80 px-3 py-1.5 rounded-full border border-cream/20"
            >
              {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
            </button>
          </div>
        </motion.div>
      )}
    </header>
  );
}

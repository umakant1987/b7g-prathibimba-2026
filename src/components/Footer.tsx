import { Camera, Globe, Mail, Video } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../data/translations';

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink-light border-t border-cream/10 px-5 sm:px-8 py-12 mandala-bg mandala-alt">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <img src="/logo.jpg" alt="B7G Kannada Rajyotsava" className="h-20 w-20 rounded-full object-cover shrink-0" />
          <div>
            <p className="font-kannada text-xl font-bold text-gradient-gold">B7G ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ</p>
            <p className="text-cream/60 text-sm mt-1 max-w-sm">{t(translations.footer.tagline)}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <a href="#" aria-label="Instagram" className="glass rounded-full p-2.5 hover:bg-cream/10">
            <Camera size={18} />
          </a>
          <a href="#" aria-label="Facebook" className="glass rounded-full p-2.5 hover:bg-cream/10">
            <Globe size={18} />
          </a>
          <a href="#" aria-label="YouTube" className="glass rounded-full p-2.5 hover:bg-cream/10">
            <Video size={18} />
          </a>
          <a href="mailto:hello@b7g.community" aria-label="Email" className="glass rounded-full p-2.5 hover:bg-cream/10">
            <Mail size={18} />
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-cream/10 text-center text-xs text-cream/40">
        © {year} B7G Community. {t(translations.footer.rights)}
      </div>
    </footer>
  );
}

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { GalleryItem } from '../types';

interface GalleryLightboxProps {
  item: GalleryItem;
  onClose: () => void;
}

export function GalleryLightbox({ item, onClose }: GalleryLightboxProps) {
  const { t } = useLanguage();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-maroon/95 flex items-center justify-center p-5"
        role="dialog"
        aria-modal="true"
        aria-label={t(item.title)}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-3xl w-full"
        >
          {item.type === 'video' && item.youtubeId ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1`}
                title={t(item.title)}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <img src={item.url} alt={t(item.title)} className="w-full rounded-xl" />
          )}
          <p className="text-cream mt-4 text-center font-medium">{t(item.title)}</p>
        </motion.div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 text-cream glass rounded-full p-2 hover:bg-cream/10"
        >
          <X size={22} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

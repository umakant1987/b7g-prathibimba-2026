import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { galleryItems } from '../data/gallery';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../data/translations';
import { SectionHeader } from './SectionHeader';
import { GalleryLightbox } from './GalleryLightbox';

export function Gallery() {
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeItem = galleryItems.find((item) => item.id === activeId) ?? null;

  return (
    <section id="gallery" className="relative py-24 sm:py-32 px-5 sm:px-8 bg-ink mandala-bg">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title={translations.gallery.title}
          subtitle={translations.gallery.subtitle}
          eyebrow="Memories"
        />

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {galleryItems.map((item, index) => (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: (index % 6) * 0.05 }}
              className={`group relative rounded-xl overflow-hidden ${index % 5 === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}
            >
              <img
                src={item.thumbnail}
                alt={t(item.title)}
                loading="lazy"
                className="w-full h-40 sm:h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
              {item.type === 'video' && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-cream/90 rounded-full p-3 group-hover:scale-110 transition-transform">
                    <Play size={20} className="text-ink" fill="currentColor" />
                  </span>
                </span>
              )}
              <span className="absolute bottom-2 left-3 right-3 text-xs sm:text-sm text-cream font-medium text-left line-clamp-2">
                {t(item.title)}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {activeItem && <GalleryLightbox item={activeItem} onClose={() => setActiveId(null)} />}
    </section>
  );
}

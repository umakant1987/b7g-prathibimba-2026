import { sponsors, sponsorCategoryOrder } from '../data/sponsors';
import { translations } from '../data/translations';
import { SectionHeader } from './SectionHeader';
import { SponsorLogo } from './SponsorLogo';

export function Sponsors() {
  return (
    <section id="sponsors" className="relative py-24 sm:py-32 px-5 sm:px-8 bg-ink-light mandala-bg mandala-alt">
      <div className="max-w-5xl mx-auto">
        <SectionHeader title={translations.sponsors.title} subtitle={translations.sponsors.subtitle} eyebrow="Thank You" />

        <div className="mt-14 space-y-10">
          {sponsorCategoryOrder.map((category) => {
            const items = sponsors.filter((s) => s.category === category);
            if (items.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="text-center text-sm font-semibold tracking-wider uppercase text-cream/50 mb-5">
                  {category}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {items.map((sponsor, index) => (
                    <SponsorLogo key={sponsor.id} sponsor={sponsor} index={index} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

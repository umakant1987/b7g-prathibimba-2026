import { AIChatAssistant } from '../components/AIChatAssistant';
import { CommunityLove } from '../components/CommunityLove';
import { Footer } from '../components/Footer';
import { Gallery } from '../components/Gallery';
import { Hero } from '../components/Hero';
import { ImpactCounters } from '../components/ImpactCounters';
import { KarnatakaContributions } from '../components/KarnatakaContributions';
import { Navbar } from '../components/Navbar';
import { ProgramSchedule } from '../components/ProgramSchedule';
import { Sponsors } from '../components/Sponsors';
import { Contribute } from '../components/Contribute';
import { WhyKannada } from '../components/WhyKannada';

export function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <WhyKannada />
        <KarnatakaContributions />
        <CommunityLove />
        <ImpactCounters />
        <ProgramSchedule />
        <Gallery />
        <Sponsors />
        <Contribute />
      </main>
      <Footer />
      <AIChatAssistant />
    </>
  );
}

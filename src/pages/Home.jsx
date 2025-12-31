import Hero from "../components/Hero";
import ContinueWatchingSection from "../components/ContinueWatchingSection";
import TrendingSection from "../components/TrendingSection";
import MoviesForYouSection from "../components/MoviesForYouSection";
import TVSection from "../components/TVSection";
import NowPlayingIndiaSection from "../components/NowPlayingIndiaSection";
import HiddenGemSection from "../components/HiddenGemSection";
import Footer from "../components/Footer";

function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <Hero />

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">

        {/* Personal utility */}
        <ContinueWatchingSection />

        {/* Primary discovery */}
        <TrendingSection />

        {/* Personalized */}
        <MoviesForYouSection />

        {/* TV only */}
        <TVSection />

        {/* Contextual */}
        <NowPlayingIndiaSection />

        {/* Editorial */}
        <HiddenGemSection />

      </div>

      
    </main>
  );
}

export default Home;

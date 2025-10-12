import TrendingSection from "../components/TrendingSection";
import Footer from "../components/Footer";
import TVSection from "../components/TVSection";
import HollywoodSection from "../components/HollywoodSection";
import BollywoodSection from "../components/BollywoodSection";
import Hero from "../components/Hero";

function Home() {
  return (
    <main className="min-h-screen">
      <Hero />

      <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="space-y-12 sm:space-y-16">
          <TrendingSection />
          <TVSection />          
          <HollywoodSection />
          <BollywoodSection />
        </div>
      </div>

    </main>
  );
}

export default Home;

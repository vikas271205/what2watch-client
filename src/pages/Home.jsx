import TrendingSection from "../components/TrendingSection";
import GenresSection from "../components/GenresSection";
import TodayPick from "../components/TodaysPick";
import NewsletterSection from "../components/NewsLetterSection";
import Footer from "../components/Footer";
import TVSection from "../components/TVSection";
import RecommendedSection from "../components/RecommendedSection";
import HollywoodSection from "../components/HollywoodSection";
import BollywoodSection from "../components/BollywoodSection";
import HeroSection from "../components/HeroSection";
import Hero from "../components/Hero";

function Home() {
  return (
   <main className="min-h-screen">

      <Hero />
      <section className="px-2 sm:px-4 md:px-6 lg:px-10 py-4 sm:py-6">
        <TrendingSection />
      </section>

      <section className="px-2 sm:px-4 md:px-6 lg:px-10 py-4 sm:py-6">
        <TVSection />
      </section>
      <section className="px-2 sm:px-4 md:px-6 lg:px-10 py-4 sm:py-6">
        <HollywoodSection />
      </section>

      <section className="px-2 sm:px-4 md:px-6 lg:px-10 py-4 sm:py-6">
        <BollywoodSection />
      </section>
      
      <section className="px-2 sm:px-4 md:px-6 lg:px-10 py-4 sm:py-6">
        <RecommendedSection />
      </section>

      <section className="px-2 sm:px-4 md:px-6 lg:px-10 py-4 sm:py-6">
        <NewsletterSection />
      </section>

      <Footer />
    </main>
  );
}

export default Home;
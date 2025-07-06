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
    <main className="bg-white text-black dark:bg-zinc-900 dark:text-white">
      

  {/* Your existing sections: Trending, TV Shows, etc. */}

<Hero/>
      {/* <section className="px-4 sm:px-6 md:px-10 py-6">
        <TodayPick />
      </section> */}

      <section className="px-4 sm:px-6 md:px-10 py-6">
        <TrendingSection />
      </section>

      <section className="px-4 sm:px-6 md:px-10 py-6">
        <TVSection />
      </section>
      <section className="px-4 sm:px-6 md:px-10 py-6">
        <HollywoodSection />
      </section>

      <section className="px-4 sm:px-6 md:px-10 py-6">
        <BollywoodSection />
      </section>
      
      <section className="px-4 sm:px-6 md:px-10 py-6">
        <RecommendedSection />
      </section>

      {/* <section className="px-4 sm:px-6 md:px-10 py-6">
        <GenresSection />
      </section> */}

      <section className="px-4 sm:px-6 md:px-10 py-6">
        <NewsletterSection />
      </section>

      <Footer />
    </main>
  );
}

export default Home;

function TodaysPick() {
  const featuredMovie = {
    title: "Oppenheimer",
    description:
      "The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II.",
    imageUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0W6Sg6KCEAXb2Q2xC.jpg",
    rating: "8.7",
    genre: "Biography, Drama, History",
    
  };

  return (
    <section className="px-6 py-12 bg-gray-950 text-white">
      <h2 className="text-2xl font-bold mb-8">🌟 Today’s Pick</h2>
      <div className="flex flex-col lg:flex-row items-center gap-10">
        <img
          src={featuredMovie.imageUrl}
          alt={featuredMovie.title}
          className="w-full max-w-xs rounded-lg shadow-lg"
        />
        <div className="max-w-xl">
          <h3 className="text-3xl font-bold mb-3">{featuredMovie.title}</h3>
          <p className="text-sm text-gray-300 mb-4">{featuredMovie.genre}</p>
          <p className="mb-4">{featuredMovie.description}</p>
          <p className="font-semibold mb-4">⭐ Rating: {featuredMovie.rating}</p>
          <button className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition">
            Watch Now
          </button>
        </div>
      </div>
    </section>
  );
}

export default TodaysPick;

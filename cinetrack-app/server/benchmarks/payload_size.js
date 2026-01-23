const { ObjectId } = require("mongodb");

function generateFullItem(id) {
  return {
    _id: new ObjectId(),
    id: id,
    media_type: Math.random() > 0.5 ? "movie" : "tv",
    userId: "user_123456789",
    watchlistStatus: "watchlist",
    createdAt: new Date().toISOString(),
    // Standard TMDB fields (simulated)
    adult: false,
    backdrop_path: "/tuZhZ6biFMr5n9YSJDk8n03aW6.jpg",
    genre_ids: [28, 53, 80],
    original_language: "en",
    original_title: "The Simulated Movie Title That Is Quite Long " + id,
    overview:
      "This is a simulated overview of the movie. It contains a decent amount of text to represent the typical payload size of a movie description in the database. Often these can be quite long paragraphs explaining the plot.",
    popularity: 1234.56,
    poster_path: "/1E5baAaEse26fej7uHcjOgEE2t2.jpg",
    release_date: "2024-01-01",
    title: "The Simulated Movie " + id,
    video: false,
    vote_average: 7.5,
    vote_count: 1000,
    // Extra fields often stored
    addedBy: "app_v1",
    notes: "Some user notes might be here",
    tags: ["action", "must-watch", "weekend"],
    // TV specific potentially
    origin_country: ["US"],
    original_name: "The Simulated TV Show " + id,
    first_air_date: "2023-01-01",
    name: "The Simulated TV Show " + id,
  };
}

function runBenchmark() {
  const itemCount = 1000;
  const fullItems = [];

  console.log(`Generating ${itemCount} mock watchlist items...`);
  for (let i = 0; i < itemCount; i++) {
    fullItems.push(generateFullItem(i));
  }

  // Measure Full Payload
  const fullJson = JSON.stringify(fullItems);
  const fullSize = Buffer.byteLength(fullJson, "utf8");

  console.log(`Full Payload Size: ${(fullSize / 1024).toFixed(2)} KB`);

  // Measure Optimized Payload (Projected)
  // Simulating: projection: { id: 1, media_type: 1 }
  // MongoDB returns _id by default unless excluded.
  const optimizedItems = fullItems.map((item) => ({
    _id: item._id,
    id: item.id,
    media_type: item.media_type,
  }));

  const optimizedJson = JSON.stringify(optimizedItems);
  const optimizedSize = Buffer.byteLength(optimizedJson, "utf8");

  console.log(`Optimized Payload Size: ${(optimizedSize / 1024).toFixed(2)} KB`);

  const reduction = fullSize - optimizedSize;
  const reductionPercent = (reduction / fullSize) * 100;

  console.log(`Reduction: ${(reduction / 1024).toFixed(2)} KB (${reductionPercent.toFixed(2)}%)`);
}

runBenchmark();

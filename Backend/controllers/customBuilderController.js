import Package from '../models/Package.js';
import Monastery from '../models/Monastery.js';
import { SIKKIM_KNOWLEDGE, findRegionByKeyword } from '../utils/sikkimKnowledgeBase.js';

export const buildCustomPackage = async (req, res) => {
  try {
    const { budget, duration, interests, region } = req.body;

    if (!budget || !duration || !interests || !region) {
      return res.status(400).json({ message: "All filter choices (budget, duration, interests, region) are required." });
    }

    // 1. QUERY EXISTING PACKAGES TO FIND BEST MATCHES
    const allPackages = await Package.find({ isActive: true, isCustom: { $ne: true } });
    
    const matchingPackages = allPackages.filter(pkg => {
      // Budget matching
      let budgetMatch = false;
      if (budget === "low") budgetMatch = pkg.price <= 15000;
      else if (budget === "medium") budgetMatch = pkg.price > 15000 && pkg.price <= 30000;
      else if (budget === "high") budgetMatch = pkg.price > 30000;

      // Duration matching
      // Parse days from strings like "5 Days / 4 Nights"
      const days = parseInt(pkg.duration.match(/\d+/)?.[0] || 0);
      let durationMatch = false;
      if (duration === "short") durationMatch = days <= 5;
      else if (duration === "medium") durationMatch = days > 5 && days <= 8;
      else if (duration === "long") durationMatch = days > 8;

      // Region matching
      let regionMatch = true;
      if (region !== "All") {
        const keyword = region.replace(" Sikkim", "");
        regionMatch = pkg.name.toLowerCase().includes(keyword.toLowerCase()) || 
                      pkg.description.toLowerCase().includes(keyword.toLowerCase());
      }

      // Interest matching (simple keyword check)
      let interestMatch = true;
      if (interests !== "all") {
        const mapKeywords = {
          spiritual: ["spiritual", "peace", "monastery", "monasteries", "temple", "buddhist", "meditate"],
          adventure: ["adventure", "trek", "hike", "lake", "climb", "high", "alpine", "valley"],
          cultural: ["culture", "festival", "heritage", "local", "traditional", "history"],
          scenic: ["scenic", "nature", "photography", "beauty", "waterfall", "falls", "mountain"]
        };
        const words = mapKeywords[interests] || [];
        interestMatch = words.some(w => 
          pkg.name.toLowerCase().includes(w) || 
          pkg.description.toLowerCase().includes(w)
        );
      }

      return budgetMatch && durationMatch && regionMatch && interestMatch;
    });

    // 2. SYNTHESIZE A PERSONALIZED ITINERARY IF NO MATCHES, OR AS AN ALTERNATIVE AI OPTION
    const selectedRegion = region === "All" ? "East Sikkim" : region;
    const knowledge = SIKKIM_KNOWLEDGE[selectedRegion] || SIKKIM_KNOWLEDGE["East Sikkim"];

    // Find actual monasteries in database for the region
    const searchKeyword = selectedRegion.replace(" Sikkim", "");
    const dbMonasteries = await Monastery.find({
      location: { $regex: searchKeyword, $options: "i" }
    }).limit(3);

    const monasteriesList = dbMonasteries.length > 0 
      ? dbMonasteries.map(m => m.name) 
      : knowledge.monasteries;

    // Build synthesized day-by-day itinerary
    let totalDays = 4; // default
    if (duration === "short") totalDays = 4;
    else if (duration === "medium") totalDays = 7;
    else if (duration === "long") totalDays = 10;

    const itinerary = [];
    itinerary.push({
      day: 1,
      title: `Arrival in Sikkim & regional transit to ${selectedRegion}`,
      description: `Welcome to Sikkim! You will be picked up from the transit hub and driven to your hotel. Evening brief on your upcoming ${interests}-focused spiritual tour.`
    });

    for (let dayNum = 2; dayNum < totalDays; dayNum++) {
      const monName = monasteriesList[(dayNum - 2) % monasteriesList.length];
      const attractionName = knowledge.attractions[(dayNum - 2) % knowledge.attractions.length];

      if (interests === "spiritual") {
        itinerary.push({
          day: dayNum,
          title: `Meditation & Dharma session at ${monName}`,
          description: `Morning prayers at ${monName}. Learn about the local Mahayana Buddhist heritage and enjoy quiet reflection. Later visit the serene surroundings of ${attractionName}.`
        });
      } else if (interests === "adventure") {
        itinerary.push({
          day: dayNum,
          title: `Trek to ${attractionName} and Monastery Visit`,
          description: `An active day hiking around the scenic valley. Visit ${monName} in the afternoon to admire traditional woodcarvings and scroll paintings (Thangkas).`
        });
      } else if (interests === "cultural") {
        itinerary.push({
          day: dayNum,
          title: `Cultural Exploration of ${selectedRegion}`,
          description: `Discover local folklore and taste Sikkimese delicacies. Explore the ancient heritage of ${monName} and visit the landmark spot of ${attractionName}.`
        });
      } else { // scenic
        itinerary.push({
          day: dayNum,
          title: `Photography Tour of ${attractionName}`,
          description: `Sunrise photoshoot of the snowy Himalayan range from ${attractionName}. Followed by visiting the beautiful cliffside ${monName}.`
        });
      }
    }

    itinerary.push({
      day: totalDays,
      title: "Departure & Return Journey",
      description: "Perform morning circumambulation (Kora). Complete check-out, load memories, and proceed with transfer back to Bagdogra Airport or NJP station."
    });

    // Estimate price
    let estimatedCost = 14500;
    if (budget === "low") estimatedCost = totalDays * 2800;
    else if (budget === "medium") estimatedCost = totalDays * 4500;
    else estimatedCost = totalDays * 7500;

    const synthesizedPackage = {
      name: `AI Custom: ${selectedRegion} ${interests.charAt(0).toUpperCase() + interests.slice(1)} Explorer`,
      duration: `${totalDays} Days / ${totalDays - 1} Nights`,
      price: estimatedCost,
      description: `A customized package hand-tailored for a ${interests} experience in the pristine landscapes of ${selectedRegion}. Fit for your target budget class.`,
      region: selectedRegion,
      itinerary,
      attractions: knowledge.attractions,
      season: knowledge.bestSeason,
      permitRequired: knowledge.permitRequired,
      tips: knowledge.tips,
      recommendationReason: `We suggested this custom itinerary because it matches your preferred ${duration}-duration timeframe, aligns with your ${budget}-range budget, and centers on your interests in ${interests}.`
    };

    return res.status(200).json({
      success: true,
      matchingPackages: matchingPackages.slice(0, 3), // Return existing matches if any
      customRecommendation: synthesizedPackage
    });

  } catch (error) {
    console.error("CUSTOM TOUR BUILDER ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

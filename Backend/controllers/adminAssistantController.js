import Monastery from '../models/Monastery.js';
import { SIKKIM_KNOWLEDGE, findRegionByKeyword } from '../utils/sikkimKnowledgeBase.js';

export const suggestPackageDetails = async (req, res) => {
  try {
    const { name, region: queryRegion } = req.query;

    let region = queryRegion;
    if (!region && name) {
      region = findRegionByKeyword(name);
    }
    if (!region) {
      region = "East Sikkim"; // fallback default
    }

    // Lookup corresponding knowledge base features
    const knowledge = SIKKIM_KNOWLEDGE[region] || SIKKIM_KNOWLEDGE["East Sikkim"];

    // Find actual monasteries in MongoDB belonging to this region
    // The monastery location contains "Gangtok, East Sikkim", "Pelling, West Sikkim", etc.
    const regionSearchKeyword = region.replace(" Sikkim", ""); // e.g. "North"
    const dbMonasteries = await Monastery.find({
      location: { $regex: regionSearchKeyword, $options: "i" }
    }).select("name location");

    const monasteryNames = dbMonasteries.map(m => m.name);
    const combinedMonasteries = [...new Set([...monasteryNames, ...knowledge.monasteries])];

    return res.status(200).json({
      region,
      suggestedMonasteries: combinedMonasteries,
      suggestedAttractions: knowledge.attractions,
      suggestedDuration: knowledge.duration,
      suggestedPriceRange: knowledge.priceRange,
      bestSeason: knowledge.bestSeason,
      permitRequired: knowledge.permitRequired,
      tips: knowledge.tips,
      dbMonasteriesCount: dbMonasteries.length
    });
  } catch (error) {
    console.error("ADMIN AI ASSISTANT ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const SIKKIM_KNOWLEDGE = {
  "North Sikkim": {
    regionName: "North Sikkim",
    monasteries: ["Lachen Monastery", "Lachung Monastery", "Phodong Monastery", "Phensang Monastery"],
    attractions: ["Gurudongmar Lake", "Yumthang Valley", "Zero Point", "Chopta Valley", "Shingba Rhododendron Sanctuary"],
    duration: "4 to 6 days",
    priceRange: "₹18,000 - ₹32,000 (Premium/SUV shared travel)",
    bestSeason: "April to June & October to December (Heavy snow in Jan/Feb, Landslides in July/Aug)",
    permitRequired: true,
    tips: "Requires Protected Area Permit (PAP). High altitude - warm clothing and acclimitization is mandatory."
  },
  "South Sikkim": {
    regionName: "South Sikkim",
    monasteries: ["Ralang Monastery", "Bon Monastery", "Samdruptse Monastery", "Ngadak Monastery"],
    attractions: ["Buddha Park of Ravangla (Tathagata Tsal)", "Temi Tea Garden", "Maenam Hill", "Tendong Hill"],
    duration: "3 to 5 days",
    priceRange: "₹12,000 - ₹20,000",
    bestSeason: "March to May & September to November",
    permitRequired: false,
    tips: "Great for scenic garden walks, tea tasting, and giant sacred statue visits."
  },
  "East Sikkim": {
    regionName: "East Sikkim",
    monasteries: ["Rumtek Monastery", "Enchey Monastery", "Lingdum (Ranka) Monastery", "Ganjong Monastery"],
    attractions: ["Tsomgo Lake", "Baba Harbhajan Singh Mandir", "Nathu La Pass", "Gangtok Ropeway", "Ban Jhakri Falls"],
    duration: "3 to 5 days",
    priceRange: "₹10,000 - ₹18,000",
    bestSeason: "October to April (Nathu La Pass requires permits and depends on weather)",
    permitRequired: true,
    tips: "Nathu La Pass & Tsomgo Lake require permits. Highly accessible regional hub with diverse shopping options in Gangtok."
  },
  "West Sikkim": {
    regionName: "West Sikkim",
    monasteries: ["Pemayangtse Monastery", "Sangachoeling Monastery", "Dubdi Monastery", "Tashiding Monastery"],
    attractions: ["Khecheopalri Lake (Wish Fulfilling Lake)", "Rabdentse Ruins", "Kanchenjunga Falls", "Singshore Bridge", "Rimbi Orange Garden"],
    duration: "4 to 6 days",
    priceRange: "₹14,000 - ₹25,000",
    bestSeason: "March to June & September to November",
    permitRequired: false,
    tips: "Rich in historical ruins and hiking routes. Tashiding Monastery has sacred significance for cleansing sins."
  }
};

export const findRegionByKeyword = (text = "") => {
  const t = text.toLowerCase();
  if (t.includes("north") || t.includes("lachen") || t.includes("lachung") || t.includes("phodong")) return "North Sikkim";
  if (t.includes("south") || t.includes("ravangla") || t.includes("temi") || t.includes("ralang")) return "South Sikkim";
  if (t.includes("west") || t.includes("pelling") || t.includes("pemayangtse") || t.includes("tashiding")) return "West Sikkim";
  return "East Sikkim"; // Default to East Sikkim (Gangtok hub)
};

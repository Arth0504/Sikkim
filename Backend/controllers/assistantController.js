import Package from '../models/Package.js';
import Monastery from '../models/Monastery.js';
import Festival from '../models/Festival.js';
import { SIKKIM_KNOWLEDGE } from '../utils/sikkimKnowledgeBase.js';

export const handleChatQuery = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "Please provide a message." });
    }

    const input = message.toLowerCase().trim();

    // Helper functions
    const getRegionFromInput = (str) => {
      if (str.includes("north")) return "North Sikkim";
      if (str.includes("south")) return "South Sikkim";
      if (str.includes("east")) return "East Sikkim";
      if (str.includes("west")) return "West Sikkim";
      return null;
    };

    const getMonthFromInput = (str) => {
      const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
      return months.find(m => str.includes(m));
    };

    const priceMatch = input.match(/\b\d{4,6}\b/);
    const maxPrice = priceMatch ? parseInt(priceMatch[0], 10) : null;

    // 1. GREETINGS
    if (input.includes("hello") || input.includes("hi") || input.includes("hey") || input.includes("hola") || input.includes("tashi delek")) {
      return res.status(200).json({
        reply: `Tashi Delek! 🏔️ Welcome to Sikkim. I am your Monastery360 AI Assistant.

I can guide you with:
- **Best Monasteries**: Type "monastery" to discover holy places.
- **Tour Packages**: Type "packages" to see our travel itineraries.
- **Festivals**: Type "festivals" to learn about cultural events.
- **Travel Seasons**: Type "season" to know the best time to visit.
- **Booking Guide**: Type "booking" to get booking assistance.
- **Travel Tips & Permits**: Type "tips" for permit and altitude guidelines.
- **Custom Tour**: Type "create custom package" to design your own journey.

How can I help you customize your journey today?`
      });
    }

    // 2. CUSTOM PACKAGE QUERIES
    if (
      (input.includes("custom") || input.includes("create") || input.includes("design") || input.includes("make") || input.includes("personalize") || input.includes("tailor")) &&
      (input.includes("package") || input.includes("tour") || input.includes("itinerary") || input.includes("journey") || input.includes("plan"))
    ) {
      return res.status(200).json({
        reply: `You can design a personalized itinerary instantly using our **[Custom Tour Builder](/custom-builder)**! 
Here is how it works:
1. Select your preferred **Sikkim Region** (North, South, East, West, or All).
2. Choose your **Duration** (Short, Medium, or Long stay).
3. Set your target **Budget** (Budget-friendly, Standard, or Premium).
4. Specify your core **Travel Interests** (Spiritual, Adventure, Culture, Scenic).
5. The system will synthesize a day-by-day plan and submit a reservation request to our Admin panel.
6. Once approved, you can complete traveler forms and confirm your booking immediately!`
      });
    }

    // BOOKING & CANCELLATION HELP
    if (input.includes("book") || input.includes("booking") || input.includes("reserve") || input.includes("payment") || input.includes("pay") || input.includes("cancel") || input.includes("cancellation") || input.includes("refund") || input.includes("refunds")) {
      return res.status(200).json({
        reply: `Here is a quick booking and cancellation guide for Monastery360:
1. **Booking**: Go to **[Tour Packages](/packages)**, click details, choose travel date (minimum 7 days from today), input traveler names, upload passport photo, and pay online securely.
2. **Custom Tours**: Request custom itineraries via **[Custom Tour Builder](/custom-builder)**. Once Admin approves, confirm and pay under the requests section.
3. **Receipts & Itinerary**: Download PDFs from your **[My Bookings](/my-bookings)** page.
4. **Cancellations & Refunds**: Submit cancellation requests on the bookings page. Refunds are computed as follows:
   - 30+ Days prior: 90% Refund
   - 15-29 Days prior: 50% Refund
   - 7-14 Days prior: 25% Refund
   - Less than 7 Days: No Refund`
      });
    }

    // 3. PACKAGE QUERIES WITH PRICE / BUDGET CONSTRAINTS
    const isPackageQuery = input.includes("package") || input.includes("packages") || input.includes("tour") || input.includes("tours") || input.includes("trip") || input.includes("trips") || input.includes("itinerary") || input.includes("itineraries");
    
    if (isPackageQuery && (maxPrice || input.includes("under") || input.includes("below") || input.includes("cheap") || input.includes("budget") || input.includes("cost") || input.includes("price") || input.includes("fee"))) {
      let query = { isActive: true, isCustom: { $ne: true } };
      let filterDesc = "budget-friendly prices";

      if (maxPrice) {
        query.price = { $lte: maxPrice };
        filterDesc = `prices under ₹${maxPrice}`;
      } else if (input.includes("cheap") || input.includes("budget") || input.includes("low")) {
        query.price = { $lte: 15000 };
        filterDesc = "prices under ₹15,000";
      }

      const matchingPackages = await Package.find(query).limit(5);

      if (matchingPackages.length > 0) {
        const list = matchingPackages.map(p => `- **[${p.name}](/packages/${p._id})** (${p.duration}) - **₹${p.price}**`).join("\n");
        return res.status(200).json({
          reply: `Here are the active packages matching your request for ${filterDesc}:\n\n${list}\n\n👉 Need something custom? Adjust your budget directly using our **[Custom Tour Builder](/custom-builder)**!`
        });
      } else {
        // Fallback to general active packages
        const generalPackages = await Package.find({ isActive: true, isCustom: { $ne: true } }).limit(3);
        const list = generalPackages.map(p => `- **[${p.name}](/packages/${p._id})** (${p.duration}) - **₹${p.price}**`).join("\n");
        return res.status(200).json({
          reply: `We couldn't find any specific preset packages under your specified budget. However, here are some of our popular packages:\n\n${list}\n\n👉 You can design a bespoke trip within your budget using our **[Custom Tour Builder](/custom-builder)**!`
        });
      }
    }

    // 4. GENERAL PACKAGE QUERIES
    if (isPackageQuery) {
      const region = getRegionFromInput(input);
      let query = { isActive: true, isCustom: { $ne: true } };
      if (region) {
        query.region = { $regex: new RegExp(region, "i") };
      }

      const packages = await Package.find(query).limit(5);
      if (packages.length > 0) {
        const regionText = region ? ` in ${region}` : "";
        const list = packages.map(p => `- **[${p.name}](/packages/${p._id})** (${p.duration}) - **₹${p.price}**`).join("\n");
        return res.status(200).json({
          reply: `Here are our top packages${regionText}:\n\n${list}\n\n👉 Feel free to click on any package to view details, or design your own plan using our **[Custom Tour Builder](/custom-builder)**!`
        });
      } else {
        return res.status(200).json({
          reply: `We currently don't have preset packages matching your criteria. You can design your own itinerary in the **[Custom Tour Builder](/custom-builder)**.`
        });
      }
    }

    // 5. MONASTERY QUERIES WITH REGION / LOCATION
    const isMonasteryQuery = input.includes("monastery") || input.includes("monasteries") || input.includes("gompa") || input.includes("gompas") || input.includes("temple") || input.includes("temples") || input.includes("shrine") || input.includes("shrines");
    
    if (isMonasteryQuery) {
      const region = getRegionFromInput(input);
      let query = {};
      
      if (region) {
        query.location = { $regex: new RegExp(region.split(" ")[0], "i") };
      }

      const monasteries = await Monastery.find(query).limit(5);

      if (monasteries.length > 0) {
        const regionText = region ? ` in ${region}` : "";
        const list = monasteries.map(m => `- **[${m.name}](/monasteries/${m._id})** (${m.location})`).join("\n");
        return res.status(200).json({
          reply: `Here are the top monasteries${regionText} registered in our database:\n\n${list}\n\nEach features unique wall paintings, prayer wheels, and historic relics. You can click on the links to explore photos and spiritual significance details!`
        });
      } else {
        return res.status(200).json({
          reply: `We couldn't find specific monasteries for your region, but here are some of the most famous ones in Sikkim:
- **[Rumtek Monastery](/monasteries)** (East Sikkim)
- **[Pemayangtse Monastery](/monasteries)** (West Sikkim)
- **[Tashiding Monastery](/monasteries)** (South-West Sikkim)`
        });
      }
    }

    // 6. FESTIVAL QUERIES BY MONTH / SEASON
    const isFestivalQuery = input.includes("festival") || input.includes("festivals") || input.includes("event") || input.includes("events") || input.includes("celebration") || input.includes("celebrations") || input.includes("dance") || input.includes("dances");
    
    if (isFestivalQuery) {
      const month = getMonthFromInput(input);
      let query = {};
      
      if (month) {
        query.month = { $regex: new RegExp(month.substring(0, 3), "i") };
      }

      const festivals = await Festival.find(query).limit(5);

      if (festivals.length > 0) {
        const monthText = month ? ` celebrated in ${month.charAt(0).toUpperCase() + month.slice(1)}` : "";
        const list = festivals.map(f => `- **[${f.name}](/festivals/${f._id})** - Celebrated in **${f.month}** (${f.location})`).join("\n");
        return res.status(200).json({
          reply: `Here are the Buddhist festivals${monthText} in Sikkim:\n\n${list}\n\nThese events feature masked Cham dances, traditional rituals, and holy prayers. You can subscribe to automated email reminders directly on the details page!`
        });
      } else {
        return res.status(200).json({
          reply: `We don't have festivals registered in our database for that specific month. However, some famous Sikkim festivals are:
- **[Losar Festival](/festivals)** (Tibetan New Year - Feb/March)
- **[Saga Dawa](/festivals)** (June)
- **[Pang Lhabsol](/festivals)** (September)
Visit our **[Festivals Calendar](/festivals)** to see details!`
        });
      }
    }

    // 7. TRAVEL SEASONS
    if (input.includes("season") || input.includes("weather") || input.includes("when to visit") || input.includes("time to visit") || input.includes("month") || input.includes("months") || input.includes("climate") || input.includes("temp") || input.includes("temperature")) {
      const region = getRegionFromInput(input);
      
      if (region && SIKKIM_KNOWLEDGE[region]) {
        const info = SIKKIM_KNOWLEDGE[region];
        return res.status(200).json({
          reply: `For **${region}**, the best travel season is: **${info.bestSeason}**.
            
Attractions like ${info.attractions.slice(0, 2).join(" and ")} are best visited during these months.
Note: ${info.permitRequired ? "This region requires a Protected Area Permit (PAP) for tourists." : "No special permits are required for Indian tourists."}`
        });
      }

      return res.status(200).json({
        reply: `Sikkim has beautiful seasons throughout the year:
- 🌸 **Spring (March to May)**: Moderate climate, blossoming flowers. Best for West and East Sikkim.
- 🍂 **Autumn (October to December)**: Clear skies and perfect Himalayan views. Ideal for high-altitude spots in North Sikkim.
- ❄️ **Winter (January to February)**: Snowfall in Lachen/Lachung. Best if you enjoy snowy landscapes.
- 🌧️ **Monsoon (July to September)**: Landslides can occur; travel is slower.

Which specific region (North, South, East, West) are you planning to visit? Let me know for targeted advice!`
      });
    }

    // 9. GENERAL TRAVEL TIPS & PERMITS
    if (input.includes("tip") || input.includes("tips") || input.includes("permit") || input.includes("permits") || input.includes("guideline") || input.includes("guidelines") || input.includes("clothing") || input.includes("altitude") || input.includes("card") || input.includes("cash")) {
      return res.status(200).json({
        reply: `Here are our top travel tips for a smooth Sikkim experience:
1. **Permits**: North Sikkim and East border passes require a Protected Area Permit (PAP). Bring 4 passport photos and photocopy of Aadhaar/Voter ID.
2. **Altitude**: Gurudongmar Lake is at 17,800 ft. Spend a night in Lachen to acclimatize, carry drinking water, and consult a doctor if needed.
3. **Clothing**: North Sikkim is cold year-round. Carry layered heavy woolens and windproof jackets.
4. **Connectivity & Cash**: Rural valleys have poor network coverage. Bring sufficient cash, as cards/UPI/ATMs are limited.`
      });
    }

    // 10. REGION CHECK FALLBACK
    const detectedRegion = getRegionFromInput(input);
    if (detectedRegion && SIKKIM_KNOWLEDGE[detectedRegion]) {
      const info = SIKKIM_KNOWLEDGE[detectedRegion];
      return res.status(200).json({
        reply: `Here is the travel guide for **${detectedRegion}**:
- **Famous Attractions**: ${info.attractions.join(", ")}
- **Top Monasteries**: ${info.monasteries.join(", ")}
- **Recommended Duration**: ${info.duration}
- **Best Season**: ${info.bestSeason}
- **Permit Rules**: ${info.permitRequired ? "Protected Area Permit (PAP) required." : "No special permits required for Indian Nationals."}

👉 Try generating a custom package for ${detectedRegion} in our **[Custom Tour Builder](/custom-builder)**!`
      });
    }

    // 11. DEFAULT FALLBACK
    return res.status(200).json({
      reply: `I want to make sure I guide you correctly! I can help you with:
- Finding popular **monasteries** and **packages**
- Learning about upcoming **festivals**
- Knowing the best **seasons** and permit **tips**
- Guiding you through the **booking** & refund process
- Designing your own custom plan in the **[Custom Tour Builder](/custom-builder)**.

Could you please rephrase your question or specify what you are looking for?`
    });

  } catch (error) {
    console.error("AI TRAVEL ASSISTANT ERROR:", error);
    return res.status(500).json({ reply: "I encountered an error analyzing your request. Please try again." });
  }
};

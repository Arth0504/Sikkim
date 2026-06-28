import Booking from '../models/Booking.js';
import generateItinerary from '../utils/generateItinerary.js';

const parsePolicies = (policiesStr) => {
  if (!policiesStr) return [];
  return policiesStr
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[•\-\*\d+\.\s]+/, ""));
};

export const downloadItinerary = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("package")
      .populate("user")
      .populate("driver");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Authorization check: only booking owner or admin can download
    if (booking.user && String(booking.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to access this itinerary" });
    }

    const pkg = booking.package || {};
    let itineraryList = pkg.itinerary || [];

    // Fallback if itinerary list is empty
    if (itineraryList.length === 0) {
      const numDays = parseInt(pkg.duration) || 3;
      for (let i = 1; i <= numDays; i++) {
        let title = "Exploration & Activities";
        let desc = "Enjoy the planned activities and local culture.";
        if (i === 1) { title = "Arrival"; desc = "Welcome! Check-in to your hotel and relax."; }
        else if (i === 2) { title = "Local Sightseeing"; desc = "Explore the beautiful local attractions and monasteries."; }
        else if (i === numDays) { title = "Departure"; desc = "Checkout and safe travels back home."; }
        itineraryList.push({ day: i, title, description: desc });
      }
    }

    const formattedStartDate = booking.travelStartDate
      ? new Date(booking.travelStartDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
      : "-";

    const itineraryData = {
      bookingId: booking._id,
      firstName: booking.firstName,
      lastName: booking.lastName,
      mobile: booking.mobile,
      age: booking.age,
      address: booking.address,
      idProofType: booking.idProofType,
      idProofNumber: booking.idProofNumber,
      travellers: booking.travellers || [],
      packageName: pkg.name || "Sikkim Journey",
      travelStartDate: booking.travelStartDate,
      travelStartDateString: formattedStartDate,
      persons: booking.persons,
      duration: pkg.duration || "N/A",
      driver: booking.driver || null,
      itinerary: itineraryList,
      policies: pkg.policies ? parsePolicies(pkg.policies) : null,
    };

    await generateItinerary(res, itineraryData);
  } catch (error) {
    console.error("Download Itinerary Error:", error);
    res.status(500).json({ message: error.message });
  }
};

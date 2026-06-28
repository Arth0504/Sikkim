import Booking from '../models/Booking.js';

// ✅ UPDATE Booking (Admin)
export const updateBookingAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { travelStartDate, persons, specialRequest } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.isBlocked) {
      return res.status(400).json({ message: "Booking is blocked. Unblock first." });
    }

    if (travelStartDate) booking.travelStartDate = new Date(travelStartDate);

    if (persons) {
      const p = Number(persons);
      if (p < 1 || p > 10) return res.status(400).json({ message: "Persons must be 1-10" });
      booking.persons = p;
    }

    if (specialRequest !== undefined) booking.specialRequest = specialRequest;

    await booking.save();

    return res.status(200).json({
      message: "Booking updated ✅",
      booking,
    });
  } catch (error) {
    console.error("UPDATE BOOKING ADMIN ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE Booking (Admin)
export const deleteBookingAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    await Booking.findByIdAndDelete(bookingId);

    return res.status(200).json({ message: "Booking deleted ✅" });
  } catch (error) {
    console.error("DELETE BOOKING ADMIN ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ BLOCK Booking (Admin)
export const blockBookingAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.isBlocked = true;
    booking.blockedReason = reason || "Blocked by admin";
    await booking.save();

    return res.status(200).json({
      message: "Booking blocked ✅",
      booking,
    });
  } catch (error) {
    console.error("BLOCK BOOKING ADMIN ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ UNBLOCK Booking (Admin)
export const unblockBookingAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.isBlocked = false;
    booking.blockedReason = "";
    await booking.save();

    return res.status(200).json({
      message: "Booking unblocked ✅",
      booking,
    });
  } catch (error) {
    console.error("UNBLOCK BOOKING ADMIN ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};

import Booking from '../models/Booking.js';

// GET ALL BOOKINGS
export const getAllBookings = async (req, res) => {
  const bookings = await Booking.find()
    .populate("user", "name email")
    .populate("package", "name price")
    .sort({ createdAt: -1 });

  res.json(bookings);
};

// ✅ CONFIRM BOOKING
export const confirmBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  booking.bookingStatus = "confirmed";
  await booking.save();

  res.json({
    message: "Booking confirmed successfully",
    booking,
  });
};

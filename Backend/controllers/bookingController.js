import Booking from '../models/Booking.js';
import Package from '../models/Package.js';
import CustomReservation from '../models/CustomReservation.js';
import { validateSingleFace } from '../utils/faceDetection.js';
import { createTransactionRecord } from "../utils/transactionLogger.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createAdminNotification } from '../utils/adminNotificationHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CREATE BOOKING (with full user details + travellers + photo)
export const createBooking = async (req, res) => {
  try {
    const {
      packageId,
      travelStartDate,
      persons,
      specialRequest,

      // ✅ user details
      firstName,
      lastName,
      mobile,
      age,
      address,
      idProofType,
      idProofNumber,

      // ✅ travellers list (JSON string)
      travellers,

      // ✅ payment
      paymentMethod,
      paymentId,
      orderId,
    } = req.body;

    // ✅ Required validation
    if (!packageId) {
      console.warn("[Booking Validation] Rejected: packageId is missing");
      return res.status(400).json({ message: "Package ID is required." });
    }
    if (!travelStartDate) {
      console.warn("[Booking Validation] Rejected: travelStartDate is missing");
      return res.status(400).json({ message: "Travel start date is required." });
    }
    if (!persons) {
      console.warn("[Booking Validation] Rejected: persons count is missing");
      return res.status(400).json({ message: "Number of persons is required." });
    }

    if (!firstName || !lastName) {
      console.warn("[Booking Validation] Rejected: firstName or lastName is missing");
      return res.status(400).json({ message: "Both first and last names are required." });
    }

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      console.warn(`[Booking Validation] Rejected: mobile number must be 10 digits. Input: "${mobile}"`);
      return res.status(400).json({ message: "Mobile number must be exactly 10 digits." });
    }

    const userAge = Number(age);
    if (!userAge || userAge < 13 || userAge > 80) {
      console.warn(`[Booking Validation] Rejected: age must be between 13 and 80. Input: ${age}`);
      return res.status(400).json({ message: "Age of primary traveler must be between 13 and 80." });
    }

    if (!address || address.trim().length < 10) {
      console.warn(`[Booking Validation] Rejected: address must be at least 10 chars. Input: "${address}"`);
      return res.status(400).json({ message: "Address must be at least 10 characters." });
    }

    if (!idProofType) {
      console.warn("[Booking Validation] Rejected: idProofType is missing");
      return res.status(400).json({ message: "Identity proof type is required." });
    }

    const validIdProofs = ["Aadhaar", "PAN", "Passport", "VoterID", "DrivingLicense"];
    if (!validIdProofs.includes(idProofType)) {
      console.warn(`[Booking Validation] Rejected: invalid idProofType: "${idProofType}"`);
      return res.status(400).json({ message: `Invalid idProofType. Must be one of: ${validIdProofs.join(", ")}` });
    }

    if (!idProofNumber || String(idProofNumber).trim().length < 6) {
      console.warn(`[Booking Validation] Rejected: idProofNumber too short. Input: "${idProofNumber}"`);
      return res.status(400).json({ message: "Valid idProofNumber (minimum 6 characters) is required." });
    }

    // ✅ travel date validation: must be >= 7 days from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minAllowed = new Date(today);
    minAllowed.setDate(minAllowed.getDate() + 7);

    const chosenDate = new Date(travelStartDate);
    chosenDate.setHours(0, 0, 0, 0);

    if (isNaN(chosenDate.getTime())) {
      console.warn(`[Booking Validation] Rejected: invalid travelStartDate format: "${travelStartDate}"`);
      return res.status(400).json({ message: "Travel start date has an invalid format." });
    }

    if (chosenDate < minAllowed) {
      console.warn(`[Booking Validation] Rejected: travel date must be >= 7 days from today. Chosen: ${chosenDate.toISOString()}, Min: ${minAllowed.toISOString()}`);
      return res.status(400).json({
        message: "Travel date must be at least 7 days from today",
      });
    }

    // ✅ persons limit 1-10
    const personsNum = Number(persons);
    if (isNaN(personsNum) || personsNum < 1 || personsNum > 10) {
      console.warn(`[Booking Validation] Rejected: persons count must be between 1 and 10. Input: ${persons}`);
      return res.status(400).json({
        message: "Persons count must be between 1 and 10",
      });
    }

    // ✅ Package check
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      console.warn(`[Booking Validation] Rejected: Package not found in DB with ID: ${packageId}`);
      return res.status(404).json({ message: "Selected package was not found." });
    }

    // ✅ Passport photo file required
    if (!req.file) {
      console.warn("[Booking Validation] Rejected: passportPhoto file upload is missing");
      return res.status(400).json({ message: "Passport photo is required." });
    }

    // ✅ Face Detection Validation
    try {
      const faceCount = await validateSingleFace(req.file.path);
      console.log(`[Booking Validation] Face API validation completed. Detected ${faceCount} face(s)`);
      
      if (faceCount === 0) {
        fs.unlinkSync(req.file.path); // Delete file
        console.warn("[Booking Validation] Rejected: Face API found 0 faces");
        return res.status(400).json({ message: "Only single person photo allowed (0 faces detected)." });
      }
      
      if (faceCount > 1) {
        fs.unlinkSync(req.file.path); // Delete file
        console.warn(`[Booking Validation] Rejected: Face API found multiple faces (${faceCount})`);
        return res.status(400).json({ message: "Only single person photo allowed (multiple faces detected)." });
      }
    } catch (faceError) {
      console.error("[Booking Validation] Face detection process error:", faceError);
    }

    // ✅ Parse travellers JSON
    let travellersArr = [];
    try {
      travellersArr = travellers ? JSON.parse(travellers) : [];
    } catch (err) {
      console.warn("[Booking Validation] Rejected: unable to parse travellers JSON:", err.message);
      return res.status(400).json({ message: "Invalid travellers list format." });
    }

    if (!Array.isArray(travellersArr) || travellersArr.length !== personsNum) {
      console.warn(`[Booking Validation] Rejected: travellers array size (${travellersArr.length}) mismatch with persons count (${personsNum})`);
      return res.status(400).json({
        message: "Travellers list count must exactly match the number of persons",
      });
    }

    // ✅ Validate travellers
    for (let i = 0; i < travellersArr.length; i++) {
      const t = travellersArr[i];

      if (!t.name || String(t.name).trim() === "") {
        console.warn(`[Booking Validation] Rejected: traveler ${i + 1} is missing a name`);
        return res.status(400).json({
          message: `Traveller ${i + 1} name required`,
        });
      }

      const tAge = Number(t.age);
      if (isNaN(tAge) || tAge < 1 || tAge > 120) {
        console.warn(`[Booking Validation] Rejected: traveler ${i + 1} has an invalid age: ${t.age}`);
        return res.status(400).json({
          message: `Traveller ${i + 1} age must be a valid number between 1 and 120`,
        });
      }
    }

    // ✅ total amount logic
    const basePrice = Number(pkg.price || pkg.amount || 0);

    if (!basePrice) {
      console.warn(`[Booking Validation] Rejected: Package price is not set for ID: ${pkg._id}`);
      return res.status(400).json({ message: "Package price not set" });
    }

    const totalAmount = basePrice * personsNum;

    // ✅ Clean string values from FormData
    const cleanStr = (val) => {
      if (!val || val === "undefined" || val === "null") return "";
      return String(val).trim();
    };

    console.log(`[Booking Creation] Creating booking database entry for user: ${req.user._id}, package: ${packageId}, totalAmount: ${totalAmount}`);

    // ✅ Save booking
    const booking = await Booking.create({
      user: req.user._id,
      package: packageId,

      firstName: cleanStr(firstName),
      lastName: cleanStr(lastName),
      mobile: cleanStr(mobile),
      age: userAge,
      address: cleanStr(address),
      idProofType,
      idProofNumber: cleanStr(idProofNumber),

      passportPhoto: req.file ? `/uploads/${req.file.filename}` : "",

      travellers: travellersArr.map((t) => ({
        name: String(t.name).trim(),
        age: Number(t.age),
      })),

      travelStartDate: chosenDate,
      persons: personsNum,
      totalAmount,
      specialRequest: cleanStr(specialRequest),

      bookingStatus: "pending",
      cancelStatus: "none",
      paymentMethod: (paymentMethod && paymentMethod.toLowerCase() === "online") ? "online" : "cash",
      paymentStatus: "pending", // Always pending initially
      paymentId: cleanStr(paymentId) || null,
      orderId: cleanStr(orderId) || null,
    });

    console.log(`[Booking Creation] Booking ${booking._id} created successfully for user ${req.user._id}`);

    // Auto-create Admin Notification
    await createAdminNotification({
      title: "New Booking Created 🎒",
      message: `New booking created for package "${pkg.name}" by traveler ${cleanStr(firstName)} ${cleanStr(lastName)}, total amount: ₹${totalAmount}.`,
      type: "NEW_BOOKING",
      referenceId: booking._id.toString(),
      actionUrl: "/admin/bookings",
    });

    if (pkg.isCustom) {
      await CustomReservation.findOneAndUpdate(
        { customPackage: pkg._id },
        { booking: booking._id }
      );
    }

    return res.status(201).json({
      message: paymentMethod === "cash" ? "Booking created successfully ✅" : "Booking created ✅ Proceed to payment",
      booking,
    });
  } catch (error) {
    console.error("[Booking Creation Error] =>", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    return res.status(500).json({ message: error.message || "Internal server error." });
  }
};

// ✅ GET MY BOOKINGS (User)
export const getMyBookings = async (req, res) => {
  try {
    console.log(`[Booking Fetch API] User ${req.user._id} requested booking history`);
    const bookings = await Booking.find({ user: req.user._id })
      .populate("package", "name duration image itinerary driverInfo policies")
      .populate("driver")
      .sort({ createdAt: -1 });

    console.log(`[Booking Fetch API] Found ${bookings.length} booking(s) for user ${req.user._id}`);
    return res.status(200).json(bookings);
  } catch (error) {
    console.error("GET MY BOOKINGS ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ CANCEL BOOKING (User)
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    booking.bookingStatus = "cancelled";
    booking.cancelledAt = new Date();
    await booking.save();

    // Log booking cancelled
    await createTransactionRecord({
      bookingId: booking._id,
      userId: booking.user,
      amount: booking.totalAmount,
      paymentId: booking.paymentId || booking.razorpay_payment_id,
      transactionStatus: "BOOKING_CANCELLED"
    });

    return res.status(200).json({
      message: "Booking cancelled successfully ✅",
      booking,
    });
  } catch (error) {
    console.error("CANCEL BOOKING ERROR =>", error);
    return res.status(500).json({ message: error.message });
  }
};

import Driver from '../models/Driver.js';
import Booking from '../models/Booking.js';

// ✅ ADMIN: Get all drivers
export const getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    return res.status(200).json(drivers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN: Add driver
export const addDriver = async (req, res) => {
  try {
    const { name, phone, vehicleNumber, vehicleType, status } = req.body;
    if (!name || !phone || !vehicleNumber || !vehicleType) {
      return res.status(400).json({ message: "All driver details are required" });
    }
    const driver = await Driver.create({
      name,
      phone,
      vehicleNumber,
      vehicleType,
      status: status || "available",
    });
    return res.status(201).json({ message: "Driver added successfully", driver });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN: Update driver
export const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, vehicleNumber, vehicleType, status } = req.body;
    
    const driver = await Driver.findById(id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    if (name) driver.name = name;
    if (phone) driver.phone = phone;
    if (vehicleNumber) driver.vehicleNumber = vehicleNumber;
    if (vehicleType) driver.vehicleType = vehicleType;
    if (status) driver.status = status;

    await driver.save();
    return res.status(200).json({ message: "Driver updated successfully", driver });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN: Delete driver
export const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findByIdAndDelete(id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    
    // If deleted driver was assigned to bookings, set them to null
    await Booking.updateMany({ driver: id }, { $set: { driver: null } });

    return res.status(200).json({ message: "Driver deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN: Assign driver to booking
export const assignDriver = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { driverId } = req.body; // Can be null to deallocate

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Store old driver ID
    const oldDriverId = booking.driver;

    if (driverId) {
      const newDriver = await Driver.findById(driverId);
      if (!newDriver) return res.status(404).json({ message: "Selected driver not found" });

      booking.driver = driverId;
      newDriver.status = "busy";
      await newDriver.save();
    } else {
      booking.driver = null;
    }

    await booking.save();

    // Mark old driver as available if they were changed/deallocated
    if (oldDriverId && String(oldDriverId) !== String(driverId)) {
      const oldDriver = await Driver.findById(oldDriverId);
      if (oldDriver) {
        oldDriver.status = "available";
        await oldDriver.save();
      }
    }

    // Populate driver to return complete booking object
    const updatedBooking = await Booking.findById(bookingId).populate("driver").populate("package");

    return res.status(200).json({
      message: driverId ? "Driver assigned successfully ✅" : "Driver deallocated successfully ✅",
      booking: updatedBooking
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

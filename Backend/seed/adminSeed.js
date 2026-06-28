import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const createAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("Admin already exists");
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    await User.create({
      name: "Super Admin",
      email: "admin@sikkim.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("Default admin created successfully");
    console.log("Email: admin@sikkim.com");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Admin seed error:", error.message);
  }
};

export default createAdmin;;

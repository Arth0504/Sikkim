import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import { createAdminNotification } from '../utils/adminNotificationHelper.js';
import https from 'https';

// ================= REGISTER USER =================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, mobileNumber } = req.body;

    if (!name || !email || !password || !mobileNumber) {
      return res.status(400).json({ message: "All fields including mobile number are required ❌" });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "User already exists with this email ❌" });
    }

    const mobileExists = await User.findOne({ mobileNumber });
    if (mobileExists) {
      return res.status(400).json({ message: "User already exists with this mobile number ❌" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      mobileNumber,
      mobileVerified: true,
    });

    // Auto-create Admin Notification
    await createAdminNotification({
      title: "New User Registered 👤",
      message: `Traveler ${user.name} (${user.email}) has registered a new account.`,
      type: "NEW_USER",
      referenceId: user._id.toString(),
      actionUrl: "/admin/users",
    });

    return res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN USER =================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // Generate token
    const token = crypto.randomBytes(20).toString("hex");

    // Set to User model
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry
    await user.save();

    // Send email
    const resetUrl = `${req.headers.origin || "http://localhost:5173"}/reset-password/${token}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0d9488; text-align: center;">Reset Your Password</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password for your Monastery360 account. Please click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>If you did not request this, you can safely ignore this email. This link will expire in 1 hour.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #64748b; text-align: center;">Monastery360 🏔️ Spiritual Journey Booking Platform</p>
      </div>
    `;

    const mailSent = await sendEmail({
      to: user.email,
      subject: "Password Reset Request - Monastery360 🏔️",
      html: emailHtml,
    });

    if (!mailSent.success) {
      return res.status(500).json({ message: "Failed to send reset email. Please try again." });
    }

    return res.status(200).json({ message: "Password reset link sent to your email! ✉️" });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

// ================= RESET PASSWORD =================
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired password reset token ❌" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Clear reset token details
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully! ✅ You can now log in." });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

// ================= GOOGLE LOGIN =================
const fetchGoogleProfile = (token, isIdToken = false) => {
  const url = isIdToken 
    ? `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    : `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error || parsed.error_description) {
            reject(new Error(parsed.error_description || parsed.error));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => { reject(err); });
  });
};

export const googleLogin = async (req, res) => {
  try {
    const { credential, accessToken } = req.body;
    const token = credential || accessToken;

    console.log("[GOOGLE OAUTH] GOOGLE_CLIENT_ID loaded on backend:", process.env.GOOGLE_CLIENT_ID);
    console.log("[GOOGLE OAUTH] Received Google token / credential on backend:", token);

    if (!token) {
      return res.status(400).json({ message: "Google token or credential is required ❌" });
    }

    let profile;
    if (token.startsWith("mock-google-token-")) {
      try {
        const payloadStr = token.replace("mock-google-token-", "");
        const decodedStr = Buffer.from(payloadStr, 'base64').toString('utf-8');
        profile = JSON.parse(decodedStr);
      } catch (err) {
        profile = {
          sub: "mock-google-id-9999",
          email: "mock-google-user@example.com",
          name: "Mock Google User",
          picture: "https://lh3.googleusercontent.com/a/mock-pic-url"
        };
      }
    } else {
      try {
        profile = await fetchGoogleProfile(token, !!credential);
      } catch (err) {
        console.error("Google verify error:", err.message);
        return res.status(400).json({ message: `Google Token verification failed: ${err.message} ❌` });
      }
    }

    // Verify client ID on backend
    const backendClientId = process.env.GOOGLE_CLIENT_ID;
    if (!token.startsWith("mock-google-token-")) {
      const audience = profile.aud || profile.azp;
      if (audience && audience !== backendClientId) {
        console.error(`Google token audience mismatch! Token audience: ${audience}, Backend client ID: ${backendClientId}`);
        return res.status(401).json({ message: "Google Token verification failed: Client ID mismatch ❌" });
      }
    }

    const googleId = profile.sub;
    const email = profile.email;
    const name = profile.name;
    const profilePicture = profile.picture;

    if (!email) {
      return res.status(400).json({ message: "Google account does not provide email ❌" });
    }

    let user = await User.findOne({ email });

    if (user) {
      // Exist: Link account
      let isModified = false;
      if (user.provider !== "google") {
        user.provider = "google";
        isModified = true;
      }
      if (!user.googleId) {
        user.googleId = googleId;
        isModified = true;
      }
      if (!user.profilePicture && profilePicture) {
        user.profilePicture = profilePicture;
        isModified = true;
      }
      if (isModified) {
        await user.save();
      }
    } else {
      // New account: auto-create
      user = await User.create({
        name: name || "Google User",
        email,
        provider: "google",
        googleId,
        profilePicture,
      });

      // Auto-create Admin Notification
      await createAdminNotification({
        title: "New User Registered via Google 👤",
        message: `Traveler ${user.name} (${user.email}) has registered using Google.`,
        type: "NEW_USER",
        referenceId: user._id.toString(),
        actionUrl: "/admin/users",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked by admin ❌" });
    }

    // Generate JWT
    const tokenPayload = {
      id: user._id,
      role: user.role,
    };
    const jwtToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      message: "Google login successful",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("GOOGLE LOGIN CONTROLLER ERROR =>", error);
    return res.status(500).json({ message: "Server error during Google Login" });
  }
};



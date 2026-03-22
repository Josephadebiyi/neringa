import User from '../models/userScheme.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import cloudinary from 'cloudinary';
import { Resend } from 'resend';
import PromoCode from '../models/promoCodeScheme.js';
import Wallet from '../models/walletScheme.js';
import Request from '../models/RequestScheme.js';
import { isAfricanCountry, getPaymentGateway, getCurrencyByCountry } from '../constants/countries.js';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { sendWelcomeEmail, sendAccountBannedEmail, sendAccountUnblockedEmail } from '../services/emailNotifications.js';

dotenv.config();
// Initialize Resend (optional)
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('⚠️ RESEND_API_KEY not set - Email features disabled');
}


// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// helper to skip cloudinary and use base64
const uploadToCloudinary = async (dataUri) => {
  // We simply return the dataUri string to be stored directly in the database
  return dataUri;
};

/**
 * @desc User uploads an image (with receive flag)
 * @route POST /api/user/add-image
 * @access Private
 */
export const uploadOrUpdateImage = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let imageUrl = null;

    // ✅ Handle both multipart or base64 uploads
    if (req.files && req.files.image) {
      const fileObj = req.files.image;
      const mime = fileObj.mimetype || 'image/jpeg';
      const base64 = fileObj.data.toString('base64');
      const dataUri = `data:${mime};base64,${base64}`;
      imageUrl = await uploadToCloudinary(dataUri);
    } else if (req.body.image) {
      const imageInput = req.body.image;
      if (/^https?:\/\//i.test(imageInput)) {
        imageUrl = imageInput;
      } else if (/^data:([a-zA-Z0-9\/+.-]+);base64,/.test(imageInput)) {
        imageUrl = await uploadToCloudinary(imageInput);
      } else {
        const dataUri = `data:image/jpeg;base64,${imageInput}`;
        imageUrl = await uploadToCloudinary(dataUri);
      }
    }

    // Validate image input
    if (!imageUrl && !user.image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // ✅ If updating, delete the old image from Cloudinary (optional)
    if (user.image && imageUrl && user.image.includes('cloudinary')) {
      try {
        const publicId = user.image.split('/').pop().split('.')[0];
        await cloudinary.v2.uploader.destroy(`user_images/${publicId}`);
      } catch (err) {
        console.warn('Failed to delete old Cloudinary image:', err.message);
      }
    }

    // ✅ Update user record
    if (imageUrl) {
      user.image = imageUrl;
      user.selectedAvatar = null; // Clear avatar when using custom image
    }

    // Handle selectedAvatar from request
    if (req.body.selectedAvatar !== undefined) {
      if (req.body.selectedAvatar === null || req.body.selectedAvatar === 'null') {
        user.selectedAvatar = null;
      } else {
        user.selectedAvatar = parseInt(req.body.selectedAvatar);
        if (user.selectedAvatar) {
          user.image = null; // Clear custom image when using avatar
        }
      }
    }

    if (req.body.receive !== undefined) {
      user.receive = req.body.receive === 'true' || req.body.receive === true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: user.image ? 'Image updated successfully' : 'Avatar updated successfully',
      image: user.image,
      selectedAvatar: user.selectedAvatar,
      receive: user.receive,
    });
  } catch (error) {
    console.error('Image Upload/Update Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Request Email Change (Sends OTP to new email)
export const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const user = await User.findById(req.user._id);

    if (!newEmail) return res.status(400).json({ message: 'New email is required' });
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return res.status(400).json({ message: 'New email must be different from current email' });
    }

    // Check if new email is already taken
    const existing = await User.findOne({ email: newEmail.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.pendingEmail = newEmail.toLowerCase();
    user.emailChangeOtp = {
      code: otp,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
    };
    await user.save();

    // Send OTP to the NEW email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #5845D8;">Confirm Your New Email</h2>
        <p>You requested to change your Bago account email to ${newEmail}.</p>
        <p>Please use the following code to verify this change:</p>
        <div style="font-size: 32px; font-bold: bold; letter-spacing: 5px; color: #111827; background: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px;">
          ${otp}
        </div>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

    if (resend) {
      await resend.emails.send({
        from: "Baggo <no-reply@sendwithbago.com>",
        to: newEmail,
        subject: "Bago - Your Email Verification Code",
        html,
      });
    }

    res.status(200).json({ success: true, message: "Verification code sent to your new email." });
  } catch (error) {
    console.error("❌ Request email change error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Verify Email Change
export const verifyEmailChange = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.pendingEmail || !user.emailChangeOtp) {
      return res.status(400).json({ message: "No email change request found" });
    }

    if (user.emailChangeOtp.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Verification code expired" });
    }

    if (user.emailChangeOtp.code !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Update email
    const oldEmail = user.email;
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.emailChangeOtp = undefined;
    await user.save();

    console.log(`✅ Email changed from ${oldEmail} to ${user.email} for user ${user._id}`);

    res.status(200).json({ success: true, message: "Email updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Update user avatar selection
 * @route POST /api/baggo/user/avatar
 * @access Private
 */
export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    const { selectedAvatar } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Validate avatar ID (1-6)
    if (selectedAvatar < 1 || selectedAvatar > 6) {
      return res.status(400).json({ success: false, message: 'Invalid avatar selection' });
    }

    user.selectedAvatar = selectedAvatar;
    user.image = null; // Clear custom image when selecting preset avatar

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      selectedAvatar: user.selectedAvatar,
    });
  } catch (error) {
    console.error('Avatar Update Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};






export const signUp = async (req, res) => {
  try {
    let { firstName, lastName, fullName, email, phone, password, confirmPassword, referralCode, promoCode, dateOfBirth, country } = req.body;

    // Handle fullName if firstName/lastName are missing
    if (!firstName && fullName) {
      const parts = fullName.trim().split(/\s+/);
      firstName = parts[0];
      lastName = parts.length > 1 ? parts.slice(1).join(" ") : "User";
    }

    // Use placeholder values for fields filled in later by KYC
    if (!firstName) firstName = 'Bago';
    if (!lastName) lastName = 'User';
    if (!dateOfBirth) dateOfBirth = '2000-01-01';

    // Only require truly essential signup fields
    if (!email || !phone || !password || !confirmPassword || !country) {
      return res.status(400).json({ message: "Please fill in all required fields: email, phone, country, and password" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Referral system
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) referredBy = referralCode;
    }

    // Promo code check
    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase(), isActive: true });
      if (promo) {
        if (promo.expiryDate && promo.expiryDate < new Date()) {
          // Expired, but we might just ignore it or show error. Let's show error to be helpful.
          return res.status(400).json({ message: "Promo code has expired" });
        }
        if (promo.maxUses && promo.usedCount >= promo.maxUses) {
          return res.status(400).json({ message: "Promo code limit reached" });
        }
      } else {
        return res.status(400).json({ message: "Invalid promo code" });
      }
    }

    // Generate 6-digit OTP for activation
    const activationOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store user data + OTP in a temporary JWT (valid for 1 hour)
    const signupToken = jwt.sign(
      { firstName, lastName, email: email.toLowerCase(), phone, password, referredBy, promoCode: promoCode ? promoCode.toUpperCase() : null, dateOfBirth, country, otp: activationOtp },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Styled HTML for OTP email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
           <img src="https://res.cloudinary.com/dmito8es3/image/upload/v1761919738/Bago_New_2_gh1gmn.png" alt="Bago" width="120"/>
        </div>
        <h2 style="color: #5845D8; text-align: center;">Verify Your Account</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for joining Bago! To complete your registration, please use the 6-digit verification code below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #111827; background: #f3f4f6; padding: 15px 30px; border-radius: 8px;">${activationOtp}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">This code will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">If you did not request this, please ignore this email.</p>
      </div>
    `;

    if (resend) {
      await resend.emails.send({
        from: "Baggo <no-reply@sendwithbago.com>",
        to: email,
        subject: `${activationOtp} is your Bago verification code`,
        html,
      });
      console.log("✅ Signup OTP sent via Resend to:", email);
    } else {
      console.log("⚠️ RESEND not configured. OTP:", activationOtp);
    }

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
      signupToken // Send this back for the client to include in verification request
    });
  } catch (error) {
    console.error("🔥 Signup error:", error);
    res.status(400).json({ message: error.message });
  }
};




export const verifySignupOtp = async (req, res) => {
  try {
    const { signupToken, otp } = req.body;

    if (!signupToken || !otp) {
      return res.status(400).json({ message: "Token and OTP are required" });
    }

    // Decode and verify the signup token
    const decoded = jwt.verify(signupToken, process.env.JWT_SECRET);

    // Check if OTP matches
    if (decoded.otp !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Check if email is already registered (last minute check)
    const existingUser = await User.findOne({ email: decoded.email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Determine payment gateway based on country
    const paymentGateway = getPaymentGateway(decoded.country);
    const preferredCurrency = getCurrencyByCountry(decoded.country);

    // Create the user
    const newUser = new User({
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      phone: decoded.phone,
      password: decoded.password, // Pre-save hook hashes it
      referredBy: decoded.referredBy || null,
      dateOfBirth: decoded.dateOfBirth || null,
      country: decoded.country || null,
      paymentGateway: paymentGateway,
      preferredCurrency: preferredCurrency,
      emailVerified: true,
    });

    await newUser.save();

    // Send Welcome Email
    const welcomeHtml = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #f0f0f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #5845D8; padding: 40px 20px; text-align: center;">
          <img src="https://res.cloudinary.com/dmito8es3/image/upload/v1761919738/Bago_New_2_gh1gmn.png" alt="Bago" width="140" style="margin-bottom: 20px;"/>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Welcome to the Community!</h1>
        </div>
        
        <div style="padding: 40px 30px;">
          <div style="border-radius: 16px; overflow: hidden; margin-bottom: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <img src="https://neringa.onrender.com/hero_v3.png" alt="Bago Hero" style="width: 100%; height: auto; display: block;" />
          </div>

          <h2 style="color: #054752; font-size: 22px; font-weight: 700; margin-top: 0;">Hi ${decoded.firstName},</h2>
          <p style="color: #708c91; font-size: 16px; line-height: 1.6; font-weight: 500;">
            We're thrilled to have you on board! Your account has been successfully verified, and you're now part of a global community transforming how the world moves packages.
          </p>
          
          <div style="margin: 35px 0; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'https://sendwithbago.com'}/login" 
               style="display: inline-block; padding: 18px 45px; background-color: #5845D8; color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 20px rgba(88, 69, 216, 0.2);">
               Get Started Now
            </a>
          </div>

          <div style="background-color: #f8f9fa; border-radius: 16px; padding: 25px; margin-top: 30px;">
            <h4 style="color: #054752; margin: 0 0 10px 0; font-size: 16px;">What's next?</h4>
            <ul style="color: #708c91; font-size: 14px; padding-left: 20px; margin: 0; line-height: 1.8;">
              <li>Complete your ID verification to start posting trips.</li>
              <li>Browse available travelers to send your first package.</li>
              <li>Set up your Bago wallet for instant payouts.</li>
            </ul>
          </div>
        </div>

        <div style="background-color: #f3f4f6; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © 2026 Bago Logistics. All rights reserved.<br/>
            You received this email because you signed up for Bago.
          </p>
        </div>
      </div>
    `;

    if (resend) {
      await resend.emails.send({
        from: "Bago Team <no-reply@sendwithbago.com>",
        to: decoded.email,
        subject: `Welcome to Bago, ${decoded.firstName}! 🚀`,
        html: welcomeHtml,
      });
    }

    // Apply Promo Code Signup Bonus if applicable
    if (decoded.promoCode) {
      const promo = await PromoCode.findOne({ code: decoded.promoCode, isActive: true });
      if (promo && promo.isSignupBonus && promo.signupBonusAmount > 0) {
        let wallet = await Wallet.findOne({ userId: newUser._id });
        if (!wallet) {
          wallet = new Wallet({ userId: newUser._id, balance: 0 });
        }
        wallet.balance += promo.signupBonusAmount;
        // Note: walletScheme expects tripId for transactions, but for signup bonus we might need a generic one or none
        // For now let's just add to balance. In a real app, track the transaction.
        await wallet.save();

        // Update promo usage
        promo.usedCount += 1;
        await promo.save();

        console.log(`🎁 Applied signup bonus of ${promo.signupBonusAmount} to user ${newUser._id}`);
      }
    }

    // Create token so user can proceed to dashboard immediately
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: "Account verified successfully!",
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        country: newUser.country,
        image: newUser.image,
        preferredCurrency: newUser.preferredCurrency,
      }
    });
  } catch (error) {
    console.error("❌ verification error:", error);
    const message = error.name === 'TokenExpiredError' ? "Verification session expired. Please sign up again." : error.message;
    res.status(400).json({ message });
  }
};


export const createDelivery = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let finalAmount = amount;

    // ✅ Apply 3% discount only once if referred
    if (user.referredBy && !user.hasUsedReferralDiscount) {
      const discount = 0.03 * amount;
      finalAmount = amount - discount;
      user.hasUsedReferralDiscount = true; // mark discount as used
      await user.save();
    }

    // Continue your delivery or payment logic here (e.g., create delivery record)
    return res.status(200).json({
      message: "Delivery created successfully",
      originalAmount: amount,
      finalAmount,
      discountApplied: user.referredBy ? "3%" : "None",
    });

  } catch (error) {
    console.error("Delivery error:", error);
    return res.status(500).json({ message: "Error processing delivery" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to user document
    user.otp = {
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    };
    await user.save();

    // Build verification URL (optional CTA in email)
    const frontendUrl = process.env.FRONTEND_URL || 'https://sendwithbago.com';
    const verifyUrl = `${frontendUrl}/verify-otp?email=${encodeURIComponent(email)}`;


    // Styled HTML for the email (UI only)
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Bago — Password Reset OTP</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f3f4f6;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%; background-color:#f3f4f6; padding:32px 0;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.06); overflow:hidden;">
                <!-- Header -->
                <tr>
                  <td style="padding:24px 28px; text-align:center; background:linear-gradient(90deg,#5240E8 0%, #6B5CFF 100%);">
                    <a href="https://sendwithbago.com/" target="_blank" style="text-decoration:none; display:inline-block;">
                      <img src="https://res.cloudinary.com/dmito8es3/image/upload/v1761919738/Bago_New_2_gh1gmn.png" alt="Bago" width="140" style="display:block; border:0;"/>
                    </a>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:32px;">
                    <h1 style="margin:0 0 12px; font-family:Arial, sans-serif; font-size:20px; color:#111827;">Reset your Bago password</h1>
                    <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#6b7280; line-height:1.5;">
                      We received a request to reset the password for <strong style="color:#111827;">${email}</strong>.
                      Use the code below to verify your identity. This code will expire in <strong>5 minutes</strong>.
                    </p>

                    <!-- OTP block -->
                    <div style="margin:22px 0; text-align:center;">
                      <div style="display:inline-block; padding:18px 28px; border-radius:10px; background:#f8fafc; border:1px solid #e6e9ef;">
                        <div style="font-family: 'Courier New', Courier, monospace; font-size:32px; letter-spacing:6px; color:#111827; font-weight:700;">
                          ${otp}
                        </div>
                        <div style="margin-top:8px; font-size:12px; color:#6b7280;">One-time passcode (OTP)</div>
                      </div>
                    </div>



                    <p style="margin:22px 0 0; font-family:Arial, sans-serif; font-size:13px; color:#6b7280; line-height:1.5;">
                      If you didn't request this, you can safely ignore this email — no changes were made to your account.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:18px 24px; background:#fbfbfe; text-align:center; font-family:Arial, sans-serif; font-size:12px; color:#9ca3af;">
                    <div style="max-width:520px; margin:0 auto;">
                      <div style="margin-bottom:6px;">Need help? Visit our <a href="https://sendwithbago.com/" style="color:#5240E8; text-decoration:none;">Help Center</a>.</div>
                      <div style="margin-top:8px;">© ${new Date().getFullYear()} Bago. All rights reserved.</div>
                      <div style="margin-top:8px;"><a href="#" style="color:#9ca3af; text-decoration:underline;">Unsubscribe</a></div>
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send OTP via Resend (functionality unchanged)
    if (resend) {
      const { error } = await resend.emails.send({
        from: 'Baggo <no-reply@sendwithbago.com>',
        to: email,
        subject: 'Password Reset OTP',
        html,
      });

      if (error) {
        console.error('❌ Resend error:', error);
        return res.status(500).json({ message: 'Failed to send OTP email' });
      }
    } else {
      console.log("⚠️ RESEND not configured. OTP NOT sent to:", email);
      console.log("🔢 Reset OTP:", otp);
    }

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('🔥 Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};




export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await User.findOne({ email });
    if (!user || !user.otp || !user.otp.code)
      return res.status(400).json({ message: 'No OTP found for this user' });

    if (user.otp.expiresAt < Date.now())
      return res.status(400).json({ message: 'OTP has expired' });

    if (user.otp.code !== otp)
      return res.status(400).json({ message: 'Invalid OTP' });

    // ✅ Create short-lived JWT for password reset
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '10m' });

    res.status(200).json({ message: 'OTP verified', token });
  } catch (err) {
    console.error('🔥 Verify OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};




export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate a fresh 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save/upate OTP on user document (valid for 5 minutes)
    user.otp = {
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
    await user.save();

    // Build verification URL (optional)
    const frontendUrl = process.env.FRONTEND_URL || 'https://sendwithbago.com';
    const verifyUrl = `${frontendUrl}/verify-otp?email=${encodeURIComponent(normalizedEmail)}`;


    // Styled HTML template (UI only) — shows the new OTP
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Bago — Your OTP</title>
      </head>
      <body style="margin:0; padding:0; background:#f3f4f6;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%; padding:32px 0;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px; width:100%; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.06);">
                <tr>
                  <td style="padding:20px; text-align:center; background:linear-gradient(90deg,#5240E8 0%, #6B5CFF 100%);">
                    <a href="https://sendwithbago.com/" target="_blank" style="text-decoration:none;">
                      <img src="https://res.cloudinary.com/dmito8es3/image/upload/v1761919738/Bago_New_2_gh1gmn.png" alt="Bago" width="140" style="display:block; border:0;" />
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="padding:28px;">
                    <h1 style="margin:0 0 12px; font-family:Arial, sans-serif; font-size:20px; color:#111827;">Your Bago OTP</h1>
                    <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#6b7280;">
                      We received a request to send a new one-time passcode for <strong style="color:#111827;">${normalizedEmail}</strong>.
                      Use the code below to complete verification. It will expire in <strong>5 minutes</strong>.
                    </p>

                    <div style="margin:22px 0; text-align:center;">
                      <div style="display:inline-block; padding:18px 28px; border-radius:10px; background:#f8fafc; border:1px solid #e6e9ef;">
                        <div style="font-family:'Courier New',Courier,monospace; font-size:32px; letter-spacing:6px; color:#111827; font-weight:700;">
                          ${otp}
                        </div>
                        <div style="margin-top:8px; font-size:12px; color:#6b7280;">One-time passcode (OTP)</div>
                      </div>
                    </div>

                    <div style="text-align:center; margin-top:18px;">
                      <a href="${verifyUrl}" target="_blank" style="display:inline-block; padding:12px 22px; background:#5240E8; color:#fff; border-radius:8px; text-decoration:none; font-weight:700;">
                        Verify OTP
                      </a>
                    </div>

                    <p style="margin:22px 0 0; font-family:Arial, sans-serif; font-size:13px; color:#6b7280;">
                      If you didn't request this, you can ignore this email and no changes will be made.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:16px; background:#fbfbfe; text-align:center; font-family:Arial, sans-serif; font-size:12px; color:#9ca3af;">
                    <div>Need help? Visit <a href="https://sendwithbago.com/" style="color:#5240E8; text-decoration:none;">Help Center</a>.</div>
                    <div style="margin-top:6px;">© ${new Date().getFullYear()} Bago</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send via Resend (same pattern you used)
    if (resend) {
      const { error } = await resend.emails.send({
        from: "Baggo <no-reply@sendwithbago.com>",
        to: normalizedEmail,
        subject: "Your Bago OTP — Resent",
        html,
      });

      if (error) {
        console.error("❌ Resend error (resendOtp):", error);
        return res.status(500).json({ message: "Failed to resend OTP email" });
      }
    } else {
      console.log("⚠️ RESEND not configured. OTP NOT sent to:", normalizedEmail);
      console.log("🔢 Resent OTP:", otp);
    }

    return res.status(200).json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error("🔥 resendOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized, missing reset token' });
    }
    const token = authHeader.split(' ')[1];

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(401).json({ message: 'Unauthorized, token email mismatch' });
      }
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Assign raw password — pre('save') will hash it exactly once
    user.password = newPassword;
    user.otp = undefined; // clear OTP after reset
    await user.save();

    // Debug: log hashed password that was saved
    console.log('Password saved for', normalizedEmail, '-> stored hash:', user.password);

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('🔥 Reset password error:', err);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
};


export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if user is banned
    if (user.banned) {
      return res.status(403).json({ message: 'Account has been suspended' });
    }

    // Generate JWT token with user id and email
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Extended to 30 days for mobile app convenience
    );

    // Also set cookie for browser-based requests (backward compatibility)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
    });

    // Return token in response body for mobile app to store
    res.status(200).json({
      success: true,
      message: 'Sign-in successful',
      token, // JWT token for mobile app to store
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        country: user.country,
        kycStatus: user.kycStatus,
        isKycCompleted: user.kycStatus === 'approved',
        paymentGateway: user.paymentGateway,
        preferredCurrency: user.preferredCurrency,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(400).json({ message: error.message });
  }
};



export const getUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  }
  catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { idToken, accessToken } = req.body;
    console.log('--- Google Auth Request ---');
    console.log('idToken present:', !!idToken);
    console.log('accessToken present:', !!accessToken);

    let email, given_name, family_name, picture;

    if (idToken) {
      try {
        const ticket = await client.verifyIdToken({
          idToken,
          audience: [
            process.env.GOOGLE_CLIENT_ID, // Web
            '207312508850-iebcq2acbvgv1emdv7lkfo2o53dk3qkd.apps.googleusercontent.com', // iOS
            '207312508850-1o8b8kli0tkdnbet7k116cjocqjd83od.apps.googleusercontent.com', // Android
          ],
        });
        const payload = ticket.getPayload();
        email = payload.email;
        given_name = payload.given_name;
        family_name = payload.family_name;
        picture = payload.picture;
      } catch (tokenErr) {
        console.error('Google ID Token verification failed:', tokenErr.message);
        return res.status(400).json({ success: false, message: "Invalid Google ID Token" });
      }
    } else if (accessToken) {
      try {
        // Fetch user info using access token
        const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
        email = response.data.email;
        given_name = response.data.given_name;
        family_name = response.data.family_name;
        picture = response.data.picture;
      } catch (accessErr) {
        console.error('Google Access Token verification failed:', accessErr.message);
        return res.status(400).json({ success: false, message: "Invalid Google Access Token" });
      }
    } else {
      return res.status(400).json({ success: false, message: "Google token is required" });
    }

    if (!email) {
      console.warn('Google Auth: retrieved email is empty');
      return res.status(400).json({ success: false, message: "Could not retrieve email from Google" });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('Google Auth: Creating new user for', email);
      // Create new user if not exists
      user = new User({
        firstName: given_name || "User",
        lastName: family_name || "Bago",
        email: email.toLowerCase(),
        image: picture,
        password: Math.random().toString(36).slice(-10),
        emailVerified: true,
        isVerified: false,
        status: 'pending',
        country: 'United States',
        phone: 'Not provided',
        signupMethod: 'google',
        paymentGateway: 'stripe',
        preferredCurrency: 'USD'
      });
      // Skip phone validation for google users
      user.phone = undefined;
      await user.save();

      // ✅ Send welcome email for new Google signups
      await sendWelcomeEmail(user.email, user.firstName || 'User', 'google');
      console.log('✅ Welcome email sent to new Google user:', user.email);
    } else {
      console.log('Google Auth: Found existing user', email);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        kycStatus: user.kycStatus,
        paymentGateway: user.paymentGateway,
        preferredCurrency: user.preferredCurrency,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Google Auth Controller Error:', error);
    res.status(500).json({ success: false, message: "Internal server error during Google login" });
  }
};

/**
 * @desc Get total user count and other public stats
 */
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Count completed bookings for this user as sender or traveler
    const completedBookings = await Request.countDocuments({
      $or: [{ sender: userId }, { traveler: userId }],
      status: 'completed'
    });

    // Count active packages (in-transit or delivering)
    const activePackages = await Request.countDocuments({
      $or: [{ sender: userId }, { traveler: userId }],
      status: { $in: ['accepted', 'intransit', 'delivering'] }
    });

    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      totalUsers: totalUsers + 1240,
      completedBookings,
      activePackages
    });
  } catch (error) {
    console.error('getUserStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};




export const edit = async (req, res, next) => {
  const userId = req.user._id;
  const updates = req.body;

  try {

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }


    const allowedUpdates = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'Address',
      'password',
      'status',
      'bankDetails',
      'preferredCurrency',
    ];

    const updateKeys = Object.keys(updates);
    const isValidOperation = updateKeys.every((key) => allowedUpdates.includes(key));
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid update fields' });
    }


    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle currency conversion if preferredCurrency is changing
    if (updates.preferredCurrency && updates.preferredCurrency !== user.preferredCurrency) {
      const { convertCurrency } = await import('../services/currencyConverter.js');
      try {
        const oldCurrency = user.preferredCurrency;
        const newCurrency = updates.preferredCurrency;

        // Convert main balance
        if (user.balance > 0) {
          const mainConv = await convertCurrency(user.balance, oldCurrency, newCurrency);
          user.balance = mainConv.convertedAmount;
        }

        // Convert escrow balance
        if (user.escrowBalance > 0) {
          const escrowConv = await convertCurrency(user.escrowBalance, oldCurrency, newCurrency);
          user.escrowBalance = escrowConv.convertedAmount;
        }

        // Also Update separate Wallet model if it exists
        const Wallet = (await import('../models/walletScheme.js')).default;
        const wallet = await Wallet.findOne({ userId: user._id });
        if (wallet && wallet.balance > 0) {
          const walletConv = await convertCurrency(wallet.balance, oldCurrency, newCurrency);
          wallet.balance = walletConv.convertedAmount;
          await wallet.save();
          console.log(`💱 Converted separate Wallet balance for user ${userId}`);
        }

        console.log(`💱 Converted balances for user ${userId} from ${oldCurrency} to ${newCurrency}`);
      } catch (err) {
        console.error('❌ Balance conversion failed during currency change:', err);
        // Continue with the update even if conversion fails (will use old numerical values)
      }
    }

    // Apply updates
    updateKeys.forEach((key) => {
      user[key] = updates[key];
    });

    // Save the updated user (triggers schema validations and password hashing)
    const updatedUser = await user.save();

    // Return the updated user without the password
    const { password, ...userWithoutPassword } = updatedUser.toObject();
    return res.status(200).json({
      status: 'success',
      data: userWithoutPassword,
    });
  } catch (error) {
    // Pass error to Express error-handling middleware
    next(error);
  }
};






/**
 * @desc Add funds to user's wallet
 */
export const addFunds = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid request: userId and positive amount required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update balance
    user.balance += amount;

    // Add history record
    user.balanceHistory.push({
      type: "add",
      amount,
      description: description || "Funds added",
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Funds added successfully",
      balance: user.balance,
      history: user.balanceHistory,
    });
  } catch (error) {
    console.error('Add Funds Error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Withdraw funds from user's wallet
 */
export const withdrawFunds = async (req, res) => {
  try {
    const { amount, method, bankDetails, stripeConnectAccountId, description } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid request: positive amount required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    // Validate based on method
    if (method === 'stripe') {
      const connectId = stripeConnectAccountId || user.stripeConnectAccountId;
      if (!connectId) {
        return res.status(400).json({ success: false, message: "Stripe Connect account not connected" });
      }
      // Future: stripe.payouts.create({ amount, currency: 'usd', destination: connectId })
    } else if (method === 'bank') {
      const details = bankDetails || user.bankDetails;
      if (!details || !details.accountNumber || !details.bankName) {
        return res.status(400).json({ success: false, message: "Bank details missing for NGN transfer" });
      }
      // Save bank details if provided
      if (bankDetails) {
        user.bankDetails = {
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber,
          accountHolderName: bankDetails.accountHolderName || `${user.firstName} ${user.lastName}`
        };
      }
    } else {
      return res.status(400).json({ success: false, message: "Please specify a payout method ('stripe' or 'bank')" });
    }

    // Deduct amount
    user.balance -= amount;

    // Add history record
    user.balanceHistory.push({
      type: "withdrawal",
      amount,
      status: 'pending',
      description: description || `Withdrawal via ${method === 'bank' ? 'Nigerian Bank Transfer' : 'Stripe Connect'}`,
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Withdrawal request received and is being processed",
      balance: user.balance,
    });
  } catch (error) {
    console.error("Withdraw Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Get user's wallet balance and history
 */
export const getWallet = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("balance balanceHistory firstName lastName email");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      success: true,
      balance: user.balance,
      history: user.balanceHistory.sort((a, b) => b.date - a.date), // newest first
    });
  } catch (error) {
    console.error("Get Wallet Error:", error);
    res.status(500).json({ message: error.message });
  }
};



/**
 * @desc Move funds from user's balance into escrow
 * @route POST /api/user/send-to-escrow
 */
export const sendToEscrow = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid request: userId and positive amount required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check sufficient balance
    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // Deduct from main balance
    user.balance -= amount;
    // Add to escrow
    user.escrowBalance += amount;

    // Record transaction
    user.balanceHistory.push({
      type: "withdrawal",
      amount,
      description: description || "Funds moved to escrow",
    });
    user.escrowHistory.push({
      type: "escrow_hold",
      amount,
      description: description || "Held in escrow",
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Funds successfully moved to escrow",
      balance: user.balance,
      escrowBalance: user.escrowBalance,
    });
  } catch (error) {
    console.error("Escrow Error:", error);
    res.status(500).json({ message: error.message });
  }
};





/**
 * @desc Release funds from escrow into user's main balance
 * @route POST /api/user/release-from-escrow
 */
export const releaseFromEscrow = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid request: userId and positive amount required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check sufficient escrow balance
    if (user.escrowBalance < amount) {
      return res.status(400).json({ message: "Insufficient escrow balance" });
    }

    // Deduct from escrow
    user.escrowBalance -= amount;
    // Add to main balance
    user.balance += amount;

    // Record transactions
    user.escrowHistory.push({
      type: "escrow_release",
      amount,
      description: description || "Funds released from escrow",
    });
    user.balanceHistory.push({
      type: "deposit",
      amount,
      description: description || "Funds added from escrow",
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Funds released from escrow successfully",
      balance: user.balance,
      escrowBalance: user.escrowBalance,
    });
  } catch (error) {
    console.error("Escrow Release Error:", error);
    res.status(500).json({ message: error.message });
  }
};










/**
 * @desc Add funds directly to escrow (no description)
 * @route POST /api/user/add-to-escrow
 * @access Private/Admin/System
 */
export const addToEscrow = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    console.log("🟢 Incoming Escrow Request:", req.body);

    if (!userId || !amount || amount <= 0) {
      console.log("⚠️ Invalid request data:", { userId, amount });
      return res
        .status(400)
        .json({ message: "Invalid request: userId and positive amount required" });
    }

    console.log("🔍 Finding user with ID:", userId);
    const user = await User.findById(userId);

    if (!user) {
      console.log("❌ User not found for ID:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("💰 Current escrowBalance before update:", user.escrowBalance);
    console.log("💰 Current balance before update:", user.balance);

    // ✅ Add funds to escrow
    user.escrowBalance += amount;

    console.log("✅ New escrowBalance after update:", user.escrowBalance);

    // ✅ Record transaction
    user.escrowHistory.push({
      type: "escrow_hold", // make sure this matches your schema enum
      amount,
      date: new Date(),
    });

    console.log("🧾 Updated escrowHistory:", user.escrowHistory[user.escrowHistory.length - 1]);

    await user.save();
    console.log("💾 User saved successfully to database");

    res.status(200).json({
      success: true,
      message: "Funds successfully added to escrow",
      escrowBalance: user.escrowBalance,
    });
  } catch (error) {
    console.error("🔥 Add to Escrow Error:", error.message);
    console.error("📜 Full Error Stack:", error);
    res.status(500).json({ message: error.message });
  }
};






export const handleCancelledRequestEscrow = async (req, res) => {
  try {
    const { requestId, description } = req.body;

    if (!requestId) {
      return res.status(400).json({ message: "requestId is required" });
    }

    // Find the request
    const request = await Request.findById(requestId).populate("sender");
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const user = request.sender;
    if (!user) return res.status(404).json({ message: "Sender not found" });

    // Only cancel if not already cancelled
    if (request.status === "cancelled") {
      return res.status(400).json({ message: "Request is already cancelled" });
    }

    // Update status to cancelled
    request.status = "cancelled";
    await request.save();

    // Deduct escrow if any
    const escrowAmount = request.amount || 0;
    if (escrowAmount > 0) {
      if (user.escrowBalance < escrowAmount) {
        return res.status(400).json({ message: "User escrow balance insufficient" });
      }

      user.escrowBalance -= escrowAmount;
      user.escrowHistory.push({
        type: "escrow_removed",
        amount: escrowAmount,
        description: description || `Removed escrow for cancelled request ${requestId}`,
      });

      await user.save();

      // Optional: mark escrow cleared on request
      request.escrowCleared = true;
      await request.save();
    }

    res.status(200).json({
      success: true,
      message: `Request cancelled and escrow of ${escrowAmount} removed`,
      escrowBalance: user.escrowBalance,
    });

  } catch (error) {
    console.error("Escrow removal error:", error);
    res.status(500).json({ message: error.message });
  }
};





export const useReferralDiscount = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already used
    if (user.hasUsedReferralDiscount) {
      return res.status(400).json({ message: "Referral discount already used" });
    }

    // Update flag
    user.hasUsedReferralDiscount = true;
    await user.save();

    res.status(200).json({ message: "Referral discount marked as used", hasUsedReferralDiscount: true });
  } catch (error) {
    console.error("❌ Error updating referral discount:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const savePushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required' });
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (!user.pushTokens) {
      user.pushTokens = [];
    }
    
    if (!user.pushTokens.includes(token)) {
      user.pushTokens.push(token);
      await user.save();
    }
    
    res.json({ success: true, message: 'Push token registered successfully' });
  } catch (error) {
    console.error('Error saving push token:', error);
    res.status(500).json({ success: false, message: 'Failed to save push token' });
  }
};

// ✅ Update preferred currency
export const editCurrency = async (req, res, next) => {
  const { currency } = req.body;
  if (!currency) return res.status(400).json({ message: "Currency is required" });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.preferredCurrency = currency.toUpperCase();
    
    // Auto-set payment gateway preference if not already set
    if (['NGN', 'GHS', 'KES'].includes(user.preferredCurrency)) {
      user.paymentGateway = 'paystack';
    } else {
      user.paymentGateway = 'stripe';
    }

    await user.save();

    res.status(200).json({
      message: "Currency updated successfully",
      success: true,
      user: {
        id: user._id,
        preferredCurrency: user.preferredCurrency,
        paymentGateway: user.paymentGateway
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete user account and all associated data
 * @route DELETE /api/user/delete
 * @access Private
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Delete associated Trips
    const Trip = mongoose.model('Trip');
    if (Trip) {
      await Trip.deleteMany({ coachId: userId }); // Assuming coachId/userId is the owner
    }

    // Delete associated Requests
    const Request = mongoose.model('Request');
    if (Request) {
      await Request.deleteMany({ $or: [{ sender: userId }, { traveler: userId }] });
    }

    // Delete associated Wallets
    const Wallet = mongoose.model('Wallet');
    if (Wallet) {
      await Wallet.deleteMany({ userId: userId });
    }

    // Finally delete the user
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log(`🗑️ Account deleted: ${deletedUser.email} (${userId})`);

    res.status(200).json({ 
      success: true, 
      message: "We are sad to let you go. Your account and all associated data have been permanently deleted." 
    });
  } catch (error) {
    console.error("❌ Delete account error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

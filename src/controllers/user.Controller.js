import dotenv from "dotenv";
dotenv.config();
import UserModel from "../models/user.model.js";
import Cryptr from 'cryptr';
const cryptr = new Cryptr(process.env.SECRET_KEY);
import { generateToken } from "../utils/helper.js";

import { sendBadRequest, sendConflict, sendCreated, sendNotFound, sendServerError, sendSuccess,
} from "../utils/response.js";
import sendOtpMail from "../utils/sendOtpMail.js";

// Return the authenticated user's profile and saved addresses.
export const getMe = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({
      message: "User data retrieved successfully",
      success: true,
      user
    })
  } catch (error) {
    sendServerError(res);
  }
};

// Create a new user account and send the registration OTP.
export const register = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;
    if (!name || !email || !password || password.length < 6) {
      return sendBadRequest(res, "Name, email, and a password of at least 6 characters are required");
    }
    const normalizedEmail = email.toLowerCase();
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser?.isVerified) return sendConflict(res, "Account already exists");

    const otp = Math.floor(Math.random() * 100000 + 800000);
    const otpExpire = Date.now() + 3 * 60 * 1000;
    await sendOtpMail(email, otp)
    const userData = {
      name,
      email: normalizedEmail,
      mobile: mobile || null,
      password: cryptr.encrypt(password),
      isVerified: false,
      otp,
      otpExpire
    };
    if (existingUser) {
      Object.assign(existingUser, userData);
      await existingUser.save();
    } else {
      await UserModel.create(userData);
    }

    return res.status(201).json({
      message: "User account created successfully",
      success: true,
      email: email
    })
  } catch (error) {
    sendServerError(res);
  }
};

// Verify the registration OTP and activate the user account.
export const otpVerify = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return sendBadRequest(res, "Email and OTP are required");

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) return sendConflict(res, "User Not Found");

    if (user.isVerified === true) 
       {
         return res.status(400).json({
            message: "User already verified",
            success: false
         })
       }
   
    if (Number(user.otp) != Number(otp)) return sendBadRequest(res, "Invalid otp");
    
    if (!user.otpExpire || user.otpExpire < new Date()) {
        return res.status(400).json({
            message: "OTP has expired",
            success: false
        });
    }
        
      //verify account and remove otp after successful verification 
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;

    // to save data in database
    await user.save()

    return sendSuccess(res, "otp verfiy successfully");
  } catch (error) {
    console.log(error)
    sendServerError(res);
  }
};

// Generate and send a replacement registration OTP.
export const resendRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendBadRequest(res, "Email is required");
    }

    const user = await UserModel.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return sendConflict(res, "User Not Found");
    }

    if (user.isVerified === true) {
      return res.status(400).json({
        message: "User already verified",
        success: false,
      });
    }
    
    const otp = Math.floor(Math.random() * 100000 + 800000);
    const otpExpire = Date.now() + 3 * 60 * 1000;

    await sendOtpMail(email, otp);

    user.otp = otp;
    user.otpExpire = otpExpire;

    await user.save();

    return res.status(200).json({
      message: "OTP resent successfully",
      success: true,
      email: email,
    });
  } catch (error) {
    console.log(error);
    sendServerError(res);
  }
};

// Authenticate a user, issue the token cookie, and return profile data.
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendBadRequest(res, "Email and password are required");
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) return sendNotFound(res);
    const decryptedPassword = cryptr.decrypt(user.password);
    if (password !== decryptedPassword) return sendBadRequest(res, "Incorrect password");
    if (!user.isVerified) return sendBadRequest(res, "Please verify your account");
    const token = generateToken(user._id);
    res.cookie("token", token, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.otp;
    delete safeUser.otpExpire;
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: safeUser
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

// Validate and append a delivery address to the authenticated user.
export const addAddress = async(req,res) =>{
  try {
    const userId = req.user._id;
    const { fullName, mobile, pincode, addressLine, city, state, country = "India" } = req.body;
    if (!fullName || !mobile || !pincode || !addressLine || !city || !state) {
      return sendBadRequest(res, "All address fields are required");
    }
    const address = { fullName, mobile, pincode, addressLine, city, state, country };

    const user = await UserModel.findById(userId);
    if (!user) return sendNotFound(res, "User not found");
    user.addresses.push(address);
    await user.save();
   
    res.json({
      success:true,
      addresses: user.addresses
    });
  } catch (error) {
    return sendServerError(res, error);
  }
}

// Return users for the protected admin user-management endpoint.
export const read = async (req, res) =>{
  try {
    const user = await UserModel.find();
    res.status(200).json({
      message: "users find",
      success: true,
      user
    })
  } catch (error) {
    return sendServerError(res, error);
  }
}

const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });
    return res.status(200).json({
      message: "Logout Successfully",
      success: true
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};


export { logout }

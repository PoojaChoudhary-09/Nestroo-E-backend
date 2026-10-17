import express from "express";
const router = express.Router();
import { register, login, otpVerify, resendRegisterOtp, logout, addAddress, read, getMe } from "../controllers/user.Controller.js"
import { authorized, verifyToken } from "../middleware/auth.js";

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", otpVerify);
router.post("/resend-register-otp", resendRegisterOtp);
router.get("/get-me",verifyToken, getMe);
router.post("/logout",verifyToken, logout);
router.post("/add-address",verifyToken, addAddress)
router.get("/", verifyToken,authorized("admin", "super_admin"), read)

export default router;
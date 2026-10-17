import express from "express";
import { placeOrder, verifyPayment } from "../controllers/order.Controller.js";
import { verifyToken, authorized } from "../middleware/auth.js";
import { read } from "../controllers/order.Controller.js";

const router = express.Router();

router.post("/place",verifyToken, placeOrder);
router.post("/payment-verify", verifyToken, verifyPayment);
router.get("/", verifyToken, authorized("admin", "superAdmin"), read);
export default router;

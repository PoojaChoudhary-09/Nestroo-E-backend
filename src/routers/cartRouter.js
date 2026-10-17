import express from "express";
const router = express.Router();
import { sync } from "../controllers/cart.Controller.js"
import { verifyToken } from "../middleware/auth.js";

router.post("/sync",verifyToken, sync);

export default router;
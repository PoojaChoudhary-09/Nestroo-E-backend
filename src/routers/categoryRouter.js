import express from "express";
const router = express.Router();
import { create, deleteById, read, readById, status, update } from "../controllers/category.Controller.js"
import upload from "../middleware/upload.js";
import { verifyToken, authorized } from "../middleware/auth.js";
router.post("/create", upload.single("image"),verifyToken,authorized("admin", "super_admin"), create);
router.get("/",  read);
router.get("/:id",  readById);
router.patch("/status/:id",verifyToken,authorized("admin", "super_admin"), status);
router.delete("/delete/:id",verifyToken,authorized("admin", "super_admin"), deleteById);
router.put("/update/:id", upload.single("image"),verifyToken,authorized("admin", "super_admin"), update);

export default router 
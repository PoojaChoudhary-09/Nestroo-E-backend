import express from "express";
const router = express.Router();
import { create, deleteById, read, readById, status, toggleBestSeller,
  toggleFeatured, toggleNewArrival, toggleStock, update, addImages
} from "../controllers/product.Controller.js"

import upload from "../middleware/upload.js";
import { verifyToken, authorized } from "../middleware/auth.js";

router.post("/create", upload.single("image"),verifyToken,authorized("admin", "super_admin"), create);
router.get("/", read);
router.get("/:id", readById);
router.patch("/status/:id",verifyToken,authorized("admin", "super_admin"), status);
router.patch("/stock/:id",verifyToken,authorized("admin", "super_admin"), toggleStock);
router.patch("/new-arrival/:id",verifyToken,authorized("admin", "super_admin"), toggleNewArrival);
router.patch("/featured/:id",verifyToken,authorized("admin", "super_admin"), toggleFeatured);
router.patch("/best-seller/:id",verifyToken,authorized("admin", "super_admin"), toggleBestSeller);
router.delete("/delete/:id",verifyToken,authorized("admin", "super_admin"), deleteById);
router.put("/update/:id", upload.single("image"),verifyToken,authorized("admin", "super_admin"), update);
router.post("/add-images/:id", upload.array("images"),verifyToken,authorized("admin", "super_admin"), addImages);

export default router;

import express from "express";
import { protect } from "../middlewares/auth.js";
import { getAllUserCreations, getCreationById, getUserCredits } from "../controllers/user/userControllers.js";

const router = express.Router();

router.get("/credits", protect, getUserCredits);
router.get("/creations", protect, getAllUserCreations);
router.get("/creation/:id", protect, getCreationById);

export default router;
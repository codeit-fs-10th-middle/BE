import express from "express";
import { presignPhotocardUpload } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/photocards/presign", presignPhotocardUpload);

export default router;

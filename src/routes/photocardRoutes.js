import express from "express";
import { create } from "../controllers/photocardController.js";

const router = express.Router();

router.post("/", create);

export default router;

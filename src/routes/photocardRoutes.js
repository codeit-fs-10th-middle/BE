import express from "express";
import { create, get, list, update } from "../controllers/photocardController.js";

const router = express.Router();

router.get("/", list);
router.get("/:id", get);
router.patch("/:id", update);
router.post("/", create);

export default router;

import express from "express";
import { getBalance, getHistory, listBoxDraws, draw } from "../controllers/pointController.js";

const router = express.Router();

// 유저별
router.get("/users/:userId/balance", getBalance);
router.get("/users/:userId/history", getHistory);
router.get("/users/:userId/box-draws", listBoxDraws);

// 포인트 뽑기 (point_box_draw)
router.post("/box-draw", draw);

export default router;

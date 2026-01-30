import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import notificationService from "../services/notificationService.js";

const notificationController = express.Router();

// GET /notifications - 내 알림 목록(최신순, 읽음처리 X)
notificationController.get("/", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const list = await notificationService.getMyNotifications(userId);

    return res.status(200).json({
      result: "success",
      message: "알림 목록 조회 성공",
      data: list,
    });
  } catch (err) {
    next(err);
  }
});

// GET /notifications/:id - 알림 상세 열람(2번째 열람 시 읽음 처리)
notificationController.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const notificationId = Number(req.params.id);

    if (Number.isNaN(notificationId)) {
      const e = new Error("notificationId must be a number");
      e.code = 400;
      return next(e);
    }

    const detail = await notificationService.viewNotificationDetail(
      userId,
      notificationId
    );

    return res.status(200).json({
      result: "success",
      message: "알림 상세 조회 성공",
      data: detail,
    });
  } catch (err) {
    next(err);
  }
});

export default notificationController;

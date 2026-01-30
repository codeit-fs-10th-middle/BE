import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import userService from "../services/userService.js";

const userController = express.Router();

// GET /users/me - 내 정보 조회
userController.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await userService.getMe(userId);

    return res.status(200).json({
      result: "success",
      message: "내 정보 조회 성공",
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /users/me - 내 정보 수정 (email, nickname)
userController.patch("/me", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { email, nickname } = req.body;

    const updatedUser = await userService.updateMe(userId, {
      email,
      nickname,
    });

    return res.status(200).json({
      result: "success",
      message: "내 정보 수정 성공",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

export default userController;

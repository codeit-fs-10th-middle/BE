import express from "express";
import userService from "../services/userService.js";

const userController = express.Router();

// 전체 유저 목록 조회
userController.get("/", async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();

    res.json({
      success: true,
      message: "유저 목록을 성공적으로 조회했습니다.",
      data: users,
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
});

// 특정 유저 조회
userController.get("/:id", async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      const error = new Error("유효하지 않은 유저 ID입니다.");
      error.code = 400;
      throw error;
    }

    const user = await userService.getUserById(userId);

    res.json({
      success: true,
      message: "유저 정보를 성공적으로 조회했습니다.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// 유저 생성 API
userController.post("/", async (req, res, next) => {
  try {
    const { email, nickname, password } = req.body;

    const newUser = await userService.createUser({
      email,
      nickname,
      password,
    });

    res.status(201).json({
      success: true,
      message: "유저가 성공적으로 생성되었습니다.",
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
});

export default userController;

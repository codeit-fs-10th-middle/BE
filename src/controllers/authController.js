//Express Router로 /auth/* 처리
import express from "express";
import authService from "../services/authService.js";

const router = express.Router();

router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, nickname } = req.body;
    const data = await authService.signup({ email, password, nickname });

    return res.status(201).json({
      result: true,
      message: "Signup success",
      data,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login({ email, password });

    return res.status(200).json({
      result: true,
      message: "Login success",
      data,
    });
  } catch (err) {
    next(err);
  }
});

// ✅ Google OAuth Login (Authorization Code를 받는 방식)
router.post("/google", async (req, res, next) => {
  try {
    const { code } = req.body;
    const data = await authService.googleLogin({ code });

    return res.status(200).json({
      result: true,
      message: "Google login success",
      data,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const data = await authService.refresh({ refreshToken });

    return res.status(200).json({
      result: true,
      message: "Token refreshed",
      data,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const data = await authService.logout({ refreshToken });

    return res.status(200).json({
      result: true,
      message: "Logout success",
      data,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

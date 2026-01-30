/**
 * Auth 기능은 구현되어 있으나
 * 이번에는 사용하지 않아 라우터 연결만 제외했습니다.
 */

import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

import userController from "./controllers/userController.js";
import notificationController from "./controllers/notificationController.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

// 기본 미들웨어
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS 설정 (Render + 로컬 프론트 대응)
const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Postman/curl 같은 non-browser 요청은 origin이 없을 수 있음 -> 허용
    if (!origin) return callback(null, true);

    // 환경변수 미설정이면 모두 허용(개발 편의)
    if (allowedOrigins.length === 0) return callback(null, true);

    // 허용 목록에 있으면 허용
    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Preflight
app.options("*", cors(corsOptions));

// ✅ 라우터 (팀 명세서 스타일: /api prefix 권장)
app.use("/api/users", userController);
app.use("/api/notifications", notificationController);

// 404 처리 (컨트롤러 검증 실패 포맷에 맞춤)
app.use((req, res) => {
  return res.status(404).json({
    ok: false,
    error: "Not Found",
  });
});

// 공통 에러 핸들러
app.use(errorHandler);

export default app;

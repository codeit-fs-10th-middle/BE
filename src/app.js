import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import userController from "./controllers/userController.js";
import errorHandler from "./middlewares/errorHandler.js";
import cors from "cors";
import morgan from "morgan";
import authController from "./controllers/authController.js";

const app = express();

// 미들 웨어어
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(morgan("dev"));

// 라우터

app.use("/users", userController);
app.use("/auth", authController);

// 에러 핸들러
app.use(errorHandler);

export default app;

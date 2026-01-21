import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import path from "path";

import errorHandler from "./middlewares/errorHandler.js";
import userRoutes from "./routes/userRoutes.js";
import photocardRoutes from "./routes/photocardRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";


const app = express();

// 미들웨어
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(morgan("dev"));

// 로컬 업로드 파일 정적 서빙
app.use("/public", express.static(path.join(process.cwd(), "public")));

// 라우터
app.use("/users", userRoutes);
app.use("/api/photo-cards", photocardRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/listings", listingRoutes);

// 에러 핸들러
app.use(errorHandler);

export default app;
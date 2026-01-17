import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

import errorHandler from "./middlewares/errorHandler.js";
import userRoutes from "./routes/userRoutes.js";
import photocardRoutes from "./routes/photocardRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";


const app = express();

// 미들웨어
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(morgan("dev"));

// 라우터
app.use("/users", userRoutes);
app.use("/api/photo-cards", photocardRoutes);
app.use("/api/uploads", uploadRoutes);

// 에러 핸들러
app.use(errorHandler);

export default app;
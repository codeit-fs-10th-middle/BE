import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import userController from "./controllers/userController.js";
import errorHandler from "./middlewares/errorHandler.js";
import cors from "cors";
import morgan from "morgan";
const app = express();

// 미들 웨어어
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(morgan("dev"));

// 라우터

app.use("/users", userController);

// 에러 핸들러
app.use(errorHandler);

// 서버 실행
const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

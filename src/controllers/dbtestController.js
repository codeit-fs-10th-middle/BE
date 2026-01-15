import express from "express";
import { pool } from "../db/mysql.js";

const dbtestController = express.Router();

dbtestController.get("/", (req, res) => {
  pool.query("SELECT 1", (err, results) => {
    if (err) {
      console.error("DB 연결 오류:", err);
      res.status(500).json({ 
        status: "DB ERROR", 
        message: err.message 
      });
    } else {
      res.json({ 
        status: "DB OK", 
        message: "데이터베이스 연결 성공" 
      });
    }
  });
});

export default dbtestController;

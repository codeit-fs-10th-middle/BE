// src/db/mysql.js
import mysql from "mysql";

export const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123123",
  database: "favoritePhoto",
  port: 3306,
});

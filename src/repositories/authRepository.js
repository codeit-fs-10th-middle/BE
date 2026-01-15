import { pool } from "../db/pool.js"; // ⚠️ 파일 경로 필요

export async function findUserByEmail(email) {
  const [rows] = await pool.query(
    "SELECT user_id, email, password_hash, nickname FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows.length ? rows[0] : null;
}

import { pool } from "../db/mysql.js";

async function findUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT user_id, email, nickname, password_hash
     FROM users
     WHERE email = ?`,
    [email]
  );
  return rows[0] || null;
}

async function findUserById(userId) {
  const [rows] = await pool.query(
    `SELECT user_id, email, nickname, points, reg_date, upt_date
     FROM users
     WHERE user_id = ?`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * OAuth 사용자면 passwordHash = null 로 저장 가능해야 함.
 * 필요한 거: users.password_hash 컬럼이 NULL 허용이어야 함.
 */
async function createUser({ email, nickname, passwordHash }) {
  const [result] = await pool.query(
    `INSERT INTO users (email, nickname, password_hash, points, reg_date)
     VALUES (?, ?, ?, 0, NOW())`,
    [email, nickname, passwordHash ?? null]
  );
  return result.insertId;
}

async function saveRefreshToken({ userId, tokenHash, expiresAt }) {
  await pool.query(
    `INSERT INTO refresh_token (user_id, token_hash, expires_at, reg_date)
     VALUES (?, ?, ?, NOW())`,
    [userId, tokenHash, expiresAt]
  );
}

async function findRefreshTokenByHash(tokenHash) {
  const [rows] = await pool.query(
    `SELECT refresh_token_id, user_id, token_hash, expires_at, revoked_at
     FROM refresh_token
     WHERE token_hash = ?`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function revokeRefreshToken(tokenHash) {
  await pool.query(
    `UPDATE refresh_token
     SET revoked_at = NOW()
     WHERE token_hash = ? AND revoked_at IS NULL`,
    [tokenHash]
  );
}

export default {
  findUserByEmail,
  findUserById,
  createUser,
  saveRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
};

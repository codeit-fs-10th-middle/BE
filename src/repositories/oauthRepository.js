import { pool } from "../db/mysql.js";

async function findByProviderUserId({ provider, providerUserId }) {
  const [rows] = await pool.query(
    `SELECT oauth_account_id, user_id, provider, provider_user_id, email
     FROM oauth_account
     WHERE provider = ? AND provider_user_id = ?`,
    [provider, providerUserId]
  );
  return rows[0] || null;
}

async function createOauthAccount({ userId, provider, providerUserId, email }) {
  const [result] = await pool.query(
    `INSERT INTO oauth_account (user_id, provider, provider_user_id, email, reg_date)
     VALUES (?, ?, ?, ?, NOW())`,
    [userId, provider, providerUserId, email || null]
  );
  return result.insertId;
}

export default {
  findByProviderUserId,
  createOauthAccount,
};

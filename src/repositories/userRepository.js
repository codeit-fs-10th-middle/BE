import pool from "../db/mysql.js";

async function findById(id) {
  const [rows] = await pool.query(
    "SELECT user_id, email, nickname, password_hash, points, reg_date, upt_date FROM users WHERE user_id = ? LIMIT 1",
    [id]
  );
  return rows.length ? rows[0] : null;
}

// /users/me에서 요구하는 필드만(깔끔)
async function findMeById(id) {
  const [rows] = await pool.query(
    "SELECT email, nickname, points FROM users WHERE user_id = ? LIMIT 1",
    [id]
  );
  return rows.length ? rows[0] : null;
}

async function findByEmail(email) {
  const [rows] = await pool.query(
    "SELECT user_id, email, nickname, password_hash, points FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows.length ? rows[0] : null;
}

async function findByNickname(nickname) {
  const [rows] = await pool.query(
    "SELECT user_id, email, nickname, password_hash, points FROM users WHERE nickname = ? LIMIT 1",
    [nickname]
  );
  return rows.length ? rows[0] : null;
}

async function findAll() {
  const [rows] = await pool.query(
    "SELECT user_id, email, nickname, password_hash, points, reg_date, upt_date FROM users ORDER BY user_id DESC"
  );
  return rows;
}

async function save(user) {
  const { email, nickname, password_hash } = user;
  const [result] = await pool.query(
    "INSERT INTO users (email, nickname, password_hash, points, reg_date) VALUES (?, ?, ?, 0, NOW())",
    [email, nickname, password_hash]
  );
  return { user_id: result.insertId, ...user, points: 0 };
}

async function update(id, data) {
  const fields = [];
  const values = [];

  if (data.email !== undefined) {
    fields.push("email = ?");
    values.push(data.email);
  }
  if (data.nickname !== undefined) {
    fields.push("nickname = ?");
    values.push(data.nickname);
  }
  if (data.password_hash !== undefined) {
    fields.push("password_hash = ?");
    values.push(data.password_hash);
  }

  if (fields.length === 0) return;

  values.push(id);

  await pool.query(
    `UPDATE users SET ${fields.join(", ")}, upt_date = NOW() WHERE user_id = ?`,
    values
  );
}

async function createOrUpdate(provider, providerId, email, name) {
  const existing = await findByEmail(email);
  if (existing) return existing;

  const [result] = await pool.query(
    "INSERT INTO users (email, nickname, password_hash, points, reg_date) VALUES (?, ?, NULL, 0, NOW())",
    [email, name]
  );
  return { user_id: result.insertId, email, nickname: name, points: 0 };
}

export default {
  findById,
  findMeById,
  findByEmail,
  findByNickname,
  findAll,
  save,
  update,
  createOrUpdate,
};

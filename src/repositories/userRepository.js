async function findById(id) {
  const [rows] = await pool.query(
    "SELECT user_id, email, nickname, points, reg_date, upt_date FROM users WHERE user_id = ? LIMIT 1",
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

async function save(user) {
  const { email, nickname, password_hash } = user;
  const [result] = await pool.query(
    "INSERT INTO users (email, nickname, password_hash, points, reg_date) VALUES (?, ?, ?, 0, NOW())",
    [email, nickname, password_hash]
  );
  return { user_id: result.insertId, ...user, points: 0 };
}

async function update(id, data) {
  //nickname만 수정한다고 가정 (필요 시 확장)
  const fields = [];
  const values = [];

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
  // OAuth 연동은 oauth_account 테이블이 필요,
  // 이 함수는 일단 users 기준 "email로 upsert" 형태로만 최소 구현 예시.
  const existing = await findByEmail(email);
  if (existing) return existing;

  // oauth 유저는 password_hash 없이 생성
  const [result] = await pool.query(
    "INSERT INTO users (email, nickname, password_hash, points, reg_date) VALUES (?, ?, NULL, 0, NOW())",
    [email, name]
  );
  return { user_id: result.insertId, email, nickname: name, points: 0 };
}

export default {
  findById,
  findByEmail,
  save,
  update,
  createOrUpdate,
};

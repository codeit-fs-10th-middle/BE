import { pool } from "../db/mysql.js";

async function findById(id) {
  return new Promise((resolve, reject) => {
    pool.query("SELECT * FROM user WHERE user_id = ?", [id], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0] || null);
      }
    });
  });
}

async function findByEmail(email) {
  return new Promise((resolve, reject) => {
    pool.query("SELECT * FROM user WHERE email = ?", [email], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0] || null);
      }
    });
  });
}

async function findByNickname(nickname) {
  return new Promise((resolve, reject) => {
    pool.query("SELECT * FROM user WHERE nickname = ?", [nickname], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0] || null);
      }
    });
  });
}

async function save(user) {
  return new Promise((resolve, reject) => {
    const { email, nickname, password_hash } = user;
    const query = "INSERT INTO user (email, nickname, password_hash) VALUES (?, ?, ?)";
    
    pool.query(query, [email, nickname, password_hash], (err, results) => {
      if (err) {
        reject(err);
      } else {
        // 생성된 유저 정보 반환
        findById(results.insertId)
          .then(user => resolve(user))
          .catch(reject);
      }
    });
  });
}

async function update(id, data) {
  return new Promise((resolve, reject) => {
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
    if (data.points !== undefined) {
      fields.push("points = ?");
      values.push(data.points);
    }
    
    if (fields.length === 0) {
      return resolve(null);
    }
    
    values.push(id);
    const query = `UPDATE user SET ${fields.join(", ")} WHERE user_id = ?`;
    
    pool.query(query, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        findById(id)
          .then(user => resolve(user))
          .catch(reject);
      }
    });
  });
}

async function findAll() {
  return new Promise((resolve, reject) => {
    pool.query("SELECT user_id, email, nickname, points, reg_date, upt_date FROM user ORDER BY reg_date DESC", (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

async function createOrUpdate(provider, providerId, email, name) {
  throw new Error('Database not configured');
}

export default {
  findById,
  findByEmail,
  findByNickname,
  findAll,
  save,
  update,
  createOrUpdate,
}

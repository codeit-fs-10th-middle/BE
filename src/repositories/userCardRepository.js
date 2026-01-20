import { pool } from "../db/mysql.js";

export async function createUserCard({
  ownerId,
  photocardId,
  quantity,
  userId,
}) {
  const finalUserId = ownerId || userId;

  const sql = `
    INSERT INTO user_card
      (user_id, photo_card_id, quantity)
    VALUES
      (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      quantity = quantity + VALUES(quantity),
      upt_date = NOW()
  `;

  const [result] = await pool.query(sql, [
    finalUserId,
    photocardId,
    quantity
  ]);

  return result.insertId;
}

export async function getUserCard(userId, photoCardId) {
  const sql = `
        SELECT * FROM user_card
        WHERE user_id = ? AND photo_card_id = ?
    `;
  const [rows] = await pool.query(sql, [userId, photoCardId]);
  return rows[0] || null;
}

export async function findAllByUserId(userId) {
  const sql = `
    SELECT 
      uc.user_card_id,
      uc.user_id,
      uc.quantity,
      uc.reg_date as acquired_date,
      pc.photo_card_id,
      pc.name,
      pc.description,
      pc.genre,
      pc.grade,
      pc.min_price,
      pc.image_url,
      pc.creator_user_id
    FROM user_card uc
    JOIN photo_card pc ON uc.photo_card_id = pc.photo_card_id
    WHERE uc.user_id = ?
    ORDER BY uc.reg_date DESC
  `;
  const [rows] = await pool.query(sql, [userId]);
  return rows;
}

// 특정 포토카드의 모든 user_card의 quantity 합계 계산
export async function getTotalQuantityByPhotoCardId(photoCardId) {
  const sql = `
    SELECT COALESCE(SUM(quantity), 0) as total_quantity
    FROM user_card
    WHERE photo_card_id = ?
  `;
  const [rows] = await pool.query(sql, [photoCardId]);
  return Number(rows[0]?.total_quantity || 0);
}
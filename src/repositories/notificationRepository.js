import pool from "../db/mysql.js";

async function create({ userId, type, entityType, entityId, message }) {
  const [result] = await pool.query(
    `
    INSERT INTO notification (user_id, type, entity_type, entity_id, message, is_read, seen_at, reg_date)
    VALUES (?, ?, ?, ?, ?, 0, NULL, NOW())
    `,
    [userId, type, entityType, entityId, message]
  );

  return result.insertId;
}

// 목록 조회: 읽음 처리 X, 최신순(reg_date DESC)
async function findByUserId(userId) {
  const [rows] = await pool.query(
    `
    SELECT notification_id, user_id, type, entity_type, entity_id, message, is_read, seen_at, reg_date
    FROM notification
    WHERE user_id = ?
    ORDER BY reg_date DESC
    `,
    [userId]
  );
  return rows;
}

// 상세 조회용: 본인 알림 단건 조회
async function findByIdForUser({ notificationId, userId }) {
  const [rows] = await pool.query(
    `
    SELECT notification_id, user_id, type, entity_type, entity_id, message, is_read, seen_at, reg_date
    FROM notification
    WHERE notification_id = ? AND user_id = ?
    LIMIT 1
    `,
    [notificationId, userId]
  );
  return rows.length ? rows[0] : null;
}

/**
 * ✅ 2번째 열람(GET 상세)하면 읽음 처리
 * - 첫 열람: seen_at = NOW(), is_read는 그대로(0)
 * - 두번째 열람: seen_at 이미 존재 → is_read = 1
 *
 * 주의: 목록 조회(GET /notifications)에서는 호출하지 말고,
 *       상세 조회(GET /notifications/:id)에서만 호출해야 의도대로 동작함.
 */
async function touchReadProgress({ notificationId, userId }) {
  // 1) 첫 열람 처리: seen_at이 비어있으면 NOW() 기록
  // 2) 두번째 열람 처리: seen_at이 이미 있으면 is_read=1
  const [result] = await pool.query(
    `
    UPDATE notification
    SET
      seen_at = COALESCE(seen_at, NOW()),
      is_read = CASE
        WHEN seen_at IS NOT NULL THEN 1
        ELSE is_read
      END
    WHERE notification_id = ? AND user_id = ?
    `,
    [notificationId, userId]
  );

  return result.affectedRows;
}

export default {
  create,
  findByUserId,
  findByIdForUser,
  touchReadProgress,
};

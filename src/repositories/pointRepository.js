import { pool } from "../db/mysql.js";

/**
 * 유저 보유 포인트 조회 (user.points)
 * @returns { number | null } - 포인트 또는 유저 없으면 null
 */
async function getBalance(userId) {
    const [rows] = await pool.query(
        "SELECT points FROM user WHERE user_id = ?",
        [userId]
    );
    if (!rows?.length) return null;
    return rows[0].points;
}

/**
 * 포인트 내역 조회 (point_history, cursor 기반 페이지네이션)
 * @param { number } userId
 * @param { { limit: number, cursor?: number } } opts
 */
async function getHistory(userId, { limit = 20, cursor = null } = {}) {
    const limitClause = Math.min(limit || 20, 50);
    let sql = `
        SELECT point_history_id, user_id, amount, type, ref_entity_type, ref_entity_id, reg_date
        FROM point_history
        WHERE user_id = ?
    `;
    const params = [userId];
    if (cursor != null) {
        sql += " AND point_history_id < ?";
        params.push(cursor);
    }
    sql += " ORDER BY point_history_id DESC LIMIT ?";
    params.push(limitClause + 1);

    const [rows] = await pool.query(sql, params);
    const hasMore = rows.length > limitClause;
    const items = hasMore ? rows.slice(0, limitClause) : rows;
    const nextCursor = hasMore ? items[items.length - 1].point_history_id : null;
    return { items, nextCursor, hasMore };
}

async function getConnection() {
    return pool.getConnection();
}

/** 트랜잭션용: user.points 조회 (없으면 null). FOR UPDATE로 유저 행 잠금. */
async function getUserPoints(conn, userId) {
    const [rows] = await conn.query(
        "SELECT points FROM user WHERE user_id = ? FOR UPDATE",
        [userId]
    );
    if (!rows?.length) return null;
    return rows[0].points;
}

/** 트랜잭션용: 해당 유저의 마지막 포인트 뽑기 + 1시간 쿨다운 남은 초 (MySQL NOW() 기준) */
async function getLastBoxDrawByUserId(conn, userId) {
    const [rows] = await conn.query(
        `SELECT point_box_draw_id, user_id, reg_date,
                TIMESTAMPDIFF(SECOND, NOW(), reg_date + INTERVAL 1 HOUR) AS remaining_seconds
         FROM point_box_draw
         WHERE user_id = ?
         ORDER BY reg_date DESC
         LIMIT 1`,
        [userId]
    );
    return rows[0] ?? null;
}

/** 트랜잭션용: user.points += delta */
async function updateUserPointsByDelta(conn, userId, delta) {
    await conn.query(
        "UPDATE user SET points = points + ? WHERE user_id = ?",
        [delta, userId]
    );
}

/** 트랜잭션용: point_history INSERT, insertId 반환 */
async function insertPointHistory(conn, { userId, amount, type, refEntityType = null, refEntityId = null }) {
    const [result] = await conn.query(
        `INSERT INTO point_history (user_id, amount, type, ref_entity_type, ref_entity_id)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, amount, type, refEntityType, refEntityId]
    );
    return result.insertId;
}

/** 트랜잭션용: point_box_draw INSERT, insertId 반환 */
async function insertPointBoxDraw(conn, { userId, pointHistoryId, earnedPoints }) {
    const [result] = await conn.query(
        `INSERT INTO point_box_draw (user_id, point_history_id, earned_points)
         VALUES (?, ?, ?)`,
        [userId, pointHistoryId, earnedPoints]
    );
    return result.insertId;
}

/**
 * 유저별 포인트 뽑기 내역 (point_box_draw, cursor 페이지네이션)
 */
async function getBoxDrawsByUserId(userId, { limit = 20, cursor = null } = {}) {
    const limitClause = Math.min(limit || 20, 50);
    let sql = `
        SELECT point_box_draw_id, user_id, point_history_id, earned_points, reg_date
        FROM point_box_draw
        WHERE user_id = ?
    `;
    const params = [userId];
    if (cursor != null) {
        sql += " AND point_box_draw_id < ?";
        params.push(cursor);
    }
    sql += " ORDER BY point_box_draw_id DESC LIMIT ?";
    params.push(limitClause + 1);

    const [rows] = await pool.query(sql, params);
    const hasMore = rows.length > limitClause;
    const items = hasMore ? rows.slice(0, limitClause) : rows;
    const nextCursor = hasMore ? items[items.length - 1].point_box_draw_id : null;
    return { items, nextCursor, hasMore };
}

export default {
    getBalance,
    getHistory,
    getConnection,
    getUserPoints,
    getLastBoxDrawByUserId,
    updateUserPointsByDelta,
    insertPointHistory,
    insertPointBoxDraw,
    getBoxDrawsByUserId,
};

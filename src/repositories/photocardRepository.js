import { pool } from "../db/mysql.js";

async function countMonthlyByCreatorUserId(creatorUserId, from, to) {
    const sql = `
    SELECT COUNT(*) AS cnt
    FROM photo_card
    WHERE creator_user_id = ?
      AND reg_date >= ?
      AND reg_date < ?
  `;
    const [rows] = await pool.query(sql, [creatorUserId, from, to]);
    return Number(rows[0]?.cnt || 0);
}

async function createPhotoCard({
    creatorUserId,
    name,
    description,
    genre,
    grade,
    minPrice,
    totalSupply,
    imageUrl,
}) {
    const sql = `
    INSERT INTO photo_card
      (creator_user_id, name, description, genre, grade, min_price, total_supply, image_url)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?)
  `;
    const [result] = await pool.query(sql, [
        creatorUserId,
        name,
        description ?? null,
        genre,
        grade,
        minPrice ?? 0,
        totalSupply,
        imageUrl,
    ]);

    return result.insertId;
}

export default {
    countMonthlyByCreatorUserId,
    createPhotoCard,
};

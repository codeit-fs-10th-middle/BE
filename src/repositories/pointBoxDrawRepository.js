import { pool } from "../db/mysql.js";

async function findAll() {
    const [rows] = await pool.query(
        "SELECT * FROM photo_card ORDER BY reg_date DESC"
    );
    return rows;
}

export default {
    findAll,
};

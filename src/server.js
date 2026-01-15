import "dotenv/config";
import app from "./app.js";
import { pool } from "./db/mysql.js";

function connectDb() {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) return reject(err);
            conn.release();
            resolve();
        });
    });
}

async function start() {
    const port = process.env.PORT ?? 3000;

    try {
        await connectDb();
        console.log("DB 연결 성공");

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (err) {
        console.error("DB 연결 실패", err);
        process.exit(1);
    }
}

start();

process.on("SIGINT", () => pool.end(() => process.exit(0)));
process.on("SIGTERM", () => pool.end(() => process.exit(0)));

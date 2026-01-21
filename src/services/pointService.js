import pointRepo from "../repositories/pointRepository.js";

const EARN_MIN = 1;         // 최소 획득 포인트
const EARN_MAX = 10;        // 최대 획득 포인트

/**
 * 유저 보유 포인트 조회 (user.points)
 */
async function getBalance(userId) {
    const points = await pointRepo.getBalance(userId);
    if (points == null) {
        const err = new Error("유저를 찾을 수 없습니다.");
        err.status = 404;
        throw err;
    }
    return { points };
}

/**
 * 포인트 내역 조회 (point_history)
 * @param { number } userId
 * @param { { limit?: number, cursor?: number } } opts
 */
async function getHistory(userId, opts = {}) {
    const { items, nextCursor, hasMore } = await pointRepo.getHistory(userId, opts);
    return { items, nextCursor, hasMore };
}

/**
 * 유저별 포인트 뽑기 내역 (point_box_draw)
 */
async function listBoxDraws(userId, opts = {}) {
    return pointRepo.getBoxDrawsByUserId(userId, opts);
}

/**
 * 포인트 뽑기 (point_box_draw + point_history)
 * - 차감 없음. 랜덤 적립 → point_history(적립) + user.points + point_box_draw
 */
async function draw(userId) {
    const conn = await pointRepo.getConnection();
    try {
        await conn.beginTransaction();

        const currentPoints = await pointRepo.getUserPoints(conn, userId);
        if (currentPoints == null) {
            const err = new Error("유저를 찾을 수 없습니다.");
            err.status = 404;
            throw err;
        }

        // 1시간에 1번 제한: MySQL TIMESTAMPDIFF로 판단 (JS Date/타임존 이슈 제거)
        // remaining_seconds > 0 이면 아직 쿨다운, 429 + 포인트 지급 안 함
        const lastDraw = await pointRepo.getLastBoxDrawByUserId(conn, userId);
        if (lastDraw) {
            const remain = Number(lastDraw.remaining_seconds);
            if (remain > 0) {
                const min = Math.floor(remain / 60);
                const sec = remain % 60;
                const err = new Error(`다음 뽑기까지 ${min}분 ${sec}초 남았습니다.`);
                err.status = 429;
                err.data = { remainingTotalSeconds: remain };
                throw err;
            }
        }

        // 랜덤 획득 (1시간 경과한 경우에만 실행)
        const earnedPoints = EARN_MIN + Math.floor(Math.random() * (EARN_MAX - EARN_MIN + 1));

        // 적립: point_history + user.points + point_box_draw
        const pointHistoryId = await pointRepo.insertPointHistory(conn, {
            userId,
            amount: earnedPoints,
            type: "POINT_BOX_DRAW_EARN",
            refEntityType: "POINT_BOX_DRAW",
        });
        await pointRepo.updateUserPointsByDelta(conn, userId, earnedPoints);
        const pointBoxDrawId = await pointRepo.insertPointBoxDraw(conn, {
            userId,
            pointHistoryId,
            earnedPoints,
        });

        await conn.commit();
        return { earnedPoints, pointBoxDrawId, pointHistoryId };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

export default {
    getBalance,
    getHistory,
    listBoxDraws,
    draw,
};

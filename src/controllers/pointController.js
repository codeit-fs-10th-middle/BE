import pointService from "../services/pointService.js";

/**
 * GET /api/points/users/:userId/balance
 * 유저 보유 포인트 조회 (user.points)
 */
export async function getBalance(req, res, next) {
    try {
        const userId = Number(req.params.userId);
        if (!userId || Number.isNaN(userId)) {
            return res.status(400).json({ ok: false, error: "userId가 필요합니다." });
        }
        const data = await pointService.getBalance(userId);
        return res.json({ ok: true, data });
    } catch (err) {
        return next(err);
    }
}

/**
 * GET /api/points/users/:userId/history
 * 포인트 내역 조회 (point_history)
 * query: limit, cursor
 */
export async function getHistory(req, res, next) {
    try {
        const userId = Number(req.params.userId);
        if (!userId || Number.isNaN(userId)) {
            return res.status(400).json({ ok: false, error: "userId가 필요합니다." });
        }
        const limit = req.query?.limit != null ? Number(req.query.limit) : undefined;
        const cursor = req.query?.cursor != null ? Number(req.query.cursor) : undefined;
        const data = await pointService.getHistory(userId, { limit, cursor });
        return res.json({ ok: true, data });
    } catch (err) {
        return next(err);
    }
}

/**
 * GET /api/points/users/:userId/box-draws
 * 포인트 뽑기 내역 (point_box_draw)
 * query: limit, cursor
 */
export async function listBoxDraws(req, res, next) {
    try {
        const userId = Number(req.params.userId);
        if (!userId || Number.isNaN(userId)) {
            return res.status(400).json({ ok: false, error: "userId가 필요합니다." });
        }
        const limit = req.query?.limit != null ? Number(req.query.limit) : undefined;
        const cursor = req.query?.cursor != null ? Number(req.query.cursor) : undefined;
        const data = await pointService.listBoxDraws(userId, { limit, cursor });
        return res.json({ ok: true, data });
    } catch (err) {
        return next(err);
    }
}

/**
 * POST /api/points/box-draw
 * 포인트 뽑기 (point_box_draw, point_history)
 * body: { userId } — 포토카드의 creatorUserId와 동일하게 body에서 유저 ID
 */
export async function draw(req, res, next) {
    try {
        const userId = Number(req.body?.userId);
        if (!userId || Number.isNaN(userId)) {
            return res.status(400).json({ ok: false, error: "userId가 필요합니다." });
        }
        const data = await pointService.draw(userId);
        return res.status(201).json({ ok: true, data });
    } catch (err) {
        return next(err);
    }
}

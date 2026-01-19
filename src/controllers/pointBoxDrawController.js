import pointBoxDrawService from "../services/pointBoxDrawService.js";

export async function list(req, res, next) {
    try {
        const data = await pointBoxDrawService.getAll();
        return res.json({ ok: true, data });
    } catch (err) {
        return next(err);
    }
}

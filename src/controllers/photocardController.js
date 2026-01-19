import photocardService from "../services/photocardServices.js";

export async function create(req, res, next) {
    try {
        const creatorUserId = Number(req.body?.creatorUserId);

        const data = await photocardService.createPhotoCard(creatorUserId, {
            name: req.body?.name,
            description: req.body?.description,
            genre: req.body?.genre,
            grade: req.body?.grade,
            minPrice: req.body?.minPrice,
            totalSupply: req.body?.totalSupply,
            imageUrl: req.body?.imageUrl,
        });

        return res.status(201).json({ ok: true, data });
    } catch (err) {
        return next(err);
    }
}

// GET /api/photo-cards?limit=20&cursor=123
export async function list(req, res, next) {
    try {
        const limit = Math.min(Number(req.query?.limit ?? 20) || 20, 50);
        const cursor = req.query?.cursor ? Number(req.query.cursor) : null;

        const data = await photocardService.listPhotoCards({ limit, cursor });
        return res.json({ ok: true, data });
    } catch (err) {
        return next(err);
    }
}

// GET /api/photo-cards/:id
export async function get(req, res, next) {
    try {
        const id = Number(req.params?.id);
        const data = await photocardService.getPhotoCardById(id);
        return res.json({ ok: true, data });
    } catch (err) {
        return next(err);
    }
}

// (호환용) 기존 이름을 쓰고 있으면 이렇게 위임해도 됨
export async function getPhotoCards(req, res, next) {
    return list(req, res, next);
}

// PATCH /api/photo-cards/:id
export async function update(req, res, next) {
    try {
        const id = Number(req.params?.id);
        const creatorUserId = Number(req.body?.creatorUserId);

        const data = await photocardService.updatePhotoCard(id, creatorUserId, {
            name: req.body?.name,
            description: req.body?.description,
            genre: req.body?.genre,
            grade: req.body?.grade,
            minPrice: req.body?.minPrice,
            totalSupply: req.body?.totalSupply,
            imageUrl: req.body?.imageUrl,
        });

        return res.json({ ok: true, data });
    } catch (err) {
        return next(err);
    }
}

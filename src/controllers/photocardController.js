import photocardService from "../services/photocardServices.js";

export async function create(req, res, next) {
    try {
        const creatorUserId = req.body?.creatorUserId;
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

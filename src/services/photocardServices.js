import photocardRepo from "../repositories/photocardRepository.js";

const MONTHLY_LIMIT = Number(process.env.PHOTO_CARD_MONTHLY_LIMIT || 5);
const S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL;

function getLocalMonthRange(date = new Date()) {
    const y = date.getFullYear();
    const m = date.getMonth();
    const from = new Date(y, m, 1, 0, 0, 0, 0);
    const to = new Date(y, m + 1, 1, 0, 0, 0, 0);
    return { from, to };
}

async function createPhotoCard(creatorUserId, payload) {
    if (!creatorUserId) {
        const err = new Error("UNAUTHORIZED");
        err.status = 401;
        throw err;
    }

    const { from, to } = getLocalMonthRange();
    const used = await photocardRepo.countMonthlyByCreatorUserId(
        creatorUserId,
        from,
        to
    );
    if (used >= MONTHLY_LIMIT) {
        const err = new Error("MONTHLY_LIMIT_EXCEEDED");
        err.status = 429;
        err.meta = { limit: MONTHLY_LIMIT, used };
        throw err;
    }

    const name = String(payload?.name || "").trim();
    const genre = String(payload?.genre || "").trim();
    const grade = String(payload?.grade || "").trim();

    if (!name || !genre || !grade) {
        const err = new Error("VALIDATION_ERROR");
        err.status = 400;
        err.meta = { required: ["name", "genre", "grade"] };
        throw err;
    }

    const totalSupply = Number(payload?.totalSupply);
    if (!Number.isFinite(totalSupply) || totalSupply <= 0) {
        const err = new Error("VALIDATION_ERROR");
        err.status = 400;
        err.meta = { field: "totalSupply", rule: "must be positive number" };
        throw err;
    }

    const minPrice = payload?.minPrice != null ? Number(payload.minPrice) : 0;

    const imageUrl = (payload?.imageUrl && String(payload.imageUrl).trim()) || "";
    if (!imageUrl) {
        const err = new Error("VALIDATION_ERROR");
        err.status = 400;
        err.meta = { required: ["imageUrl"] };
        throw err;
    }

    // imageUrl은 우리 S3 public prefix만 허용(아무 URL 저장 방지)
    if (S3_PUBLIC_BASE_URL) {
        const expectedPrefix = `${S3_PUBLIC_BASE_URL}/public/users/${creatorUserId}/photocards/`;
        if (!imageUrl.startsWith(expectedPrefix)) {
            const err = new Error("INVALID_IMAGE_URL");
            err.status = 400;
            err.meta = { expectedPrefix };
            throw err;
        }
    }

    const id = await photocardRepo.createPhotoCard({
        creatorUserId,
        name,
        description: payload?.description ?? null,
        genre,
        grade,
        minPrice,
        totalSupply,
        imageUrl,
    });

    return { photoCardId: id, imageUrl };
}

export default {
    createPhotoCard,
};
import photocardRepo from "../repositories/photocardRepository.js";

const MONTHLY_LIMIT = Number(process.env.PHOTO_CARD_MONTHLY_LIMIT || 5);

const ALLOWED_GRADES = new Set(["common", "rare", "epic", "legendary"]);
const ALLOWED_GENRES = new Set([
    "앨범",
    "특전",
    "팬싸",
    "시즌그리팅",
    "팬미팅",
    "콘서트",
    "MD",
    "콜라보",
    "팬클럽",
    "기타",
]);

function normalizeGrade(value) {
    const v = String(value ?? "").trim().toLowerCase();
    return v || "";
}

function normalizeGenre(value) {
    const v = String(value ?? "").trim();
    return v || "";
}

function assertAllowedGrade(grade) {
    if (!ALLOWED_GRADES.has(grade)) {
        const err = new Error("INVALID_GRADE");
        err.status = 400;
        err.meta = { allowed: Array.from(ALLOWED_GRADES) };
        throw err;
    }
}

function assertAllowedGenre(genre) {
    if (!ALLOWED_GENRES.has(genre)) {
        const err = new Error("INVALID_GENRE");
        err.status = 400;
        err.meta = { allowed: Array.from(ALLOWED_GENRES) };
        throw err;
    }
}

function normalizeToPath(imageUrl) {
    const raw = String(imageUrl || "").trim();
    if (!raw) return "";

    // full URL이면 pathname만 검사 (호스트는 환경/배포마다 달라질 수 있음)
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
        try {
            return new URL(raw).pathname;
        } catch {
            return "";
        }
    }
    return raw;
}

function getLocalMonthRange(date = new Date()) {
    const y = date.getFullYear();
    const m = date.getMonth();
    const from = new Date(y, m, 1, 0, 0, 0, 0);
    const to = new Date(y, m + 1, 1, 0, 0, 0, 0);
    return { from, to };
}

async function createPhotoCard(creatorUserId, payload) {

    if (!Number.isInteger(creatorUserId) || creatorUserId <= 0) {
        const err = new Error("VALIDATION_ERROR");
        err.status = 400;
        err.meta = { field: "creatorUserId", rule: "must be a positive integer" };
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
    const genre = normalizeGenre(payload?.genre);
    const grade = normalizeGrade(payload?.grade);

    if (!name || !genre || !grade) {
        const err = new Error("VALIDATION_ERROR");
        err.status = 400;
        err.meta = { required: ["name", "genre", "grade"] };
        throw err;
    }

    assertAllowedGenre(genre);
    assertAllowedGrade(grade);

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

    // imageUrl은 우리 서버가 서빙하는 public 경로만 허용(아무 URL 저장 방지)
    const expectedPathPrefix = `/public/users/${creatorUserId}/photocards/`;
    const imagePath = normalizeToPath(imageUrl);
    if (!imagePath.startsWith(expectedPathPrefix)) {
        const err = new Error("INVALID_IMAGE_URL");
        err.status = 400;
        err.meta = { expectedPathPrefix };
        throw err;
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

function mapRow(row) {
    return {
        photoCardId: Number(row.photo_card_id),
        creatorUserId: Number(row.creator_user_id),
        name: row.name,
        description: row.description,
        genre: row.genre,
        grade: row.grade,
        minPrice: Number(row.min_price),
        totalSupply: Number(row.total_supply),
        imageUrl: row.image_url,
        regDate: row.reg_date,
        uptDate: row.upt_date,
    };
}

async function listPhotoCards({ limit = 20, cursor = null } = {}) {
    const parsedLimit = Math.min(Number(limit) || 20, 50);
    const parsedCursor = cursor != null ? Number(cursor) : null;

    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
        const err = new Error("VALIDATION_ERROR");
        err.status = 400;
        err.meta = { field: "limit", rule: "must be a positive integer" };
        throw err;
    }
    if (parsedCursor != null && (!Number.isInteger(parsedCursor) || parsedCursor <= 0)) {
        const err = new Error("VALIDATION_ERROR");
        err.status = 400;
        err.meta = { field: "cursor", rule: "must be a positive integer" };
        throw err;
    }

    const rows = await photocardRepo.listPhotoCards({
        limit: parsedLimit,
        cursor: parsedCursor,
    });
    const items = rows.map(mapRow);
    const nextCursor = items.length ? items[items.length - 1].photoCardId : null;

    return { items, nextCursor };
}

async function getPhotoCardById(photoCardId) {
    const id = Number(photoCardId);
    if (!Number.isInteger(id) || id <= 0) {
        const err = new Error("VALIDATION_ERROR");
        err.status = 400;
        err.meta = { field: "id", rule: "must be a positive integer" };
        throw err;
    }

    const row = await photocardRepo.getPhotoCardById(id);
    if (!row) {
        const err = new Error("NOT_FOUND");
        err.status = 404;
        err.meta = { photoCardId: id };
        throw err;
    }

    return mapRow(row);
}

async function updatePhotoCard(photoCardId, creatorUserId, patch) {
    const id = Number(photoCardId);
    if (!Number.isInteger(id) || id <= 0) {
        const err = new Error("VALIDATION_ERROR");
        err.status = 400;
        err.meta = { field: "id", rule: "must be a positive integer" };
        throw err;
    }
    if (!Number.isInteger(creatorUserId) || creatorUserId <= 0) {
        const err = new Error("VALIDATION_ERROR");
        err.status = 400;
        err.meta = { field: "creatorUserId", rule: "must be a positive integer" };
        throw err;
    }

    const existing = await photocardRepo.getPhotoCardById(id);
    if (!existing) {
        const err = new Error("NOT_FOUND");
        err.status = 404;
        err.meta = { photoCardId: id };
        throw err;
    }
    if (Number(existing.creator_user_id) !== creatorUserId) {
        const err = new Error("FORBIDDEN");
        err.status = 403;
        err.meta = { reason: "NOT_OWNER" };
        throw err;
    }

    const nextPatch = {};

    if (patch?.name !== undefined) {
        const name = String(patch.name || "").trim();
        if (!name) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.meta = { field: "name", rule: "cannot be empty" };
            throw err;
        }
        nextPatch.name = name;
    }

    if (patch?.description !== undefined) {
        nextPatch.description = patch.description == null ? null : String(patch.description);
    }

    if (patch?.genre !== undefined) {
        const genre = normalizeGenre(patch.genre);
        if (!genre) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.meta = { field: "genre", rule: "cannot be empty" };
            throw err;
        }
        assertAllowedGenre(genre);
        nextPatch.genre = genre;
    }

    if (patch?.grade !== undefined) {
        const grade = normalizeGrade(patch.grade);
        if (!grade) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.meta = { field: "grade", rule: "cannot be empty" };
            throw err;
        }
        assertAllowedGrade(grade);
        nextPatch.grade = grade;
    }

    if (patch?.minPrice !== undefined) {
        const minPrice = Number(patch.minPrice);
        if (!Number.isFinite(minPrice) || minPrice < 0) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.meta = { field: "minPrice", rule: "must be a non-negative number" };
            throw err;
        }
        nextPatch.minPrice = minPrice;
    }

    if (patch?.totalSupply !== undefined) {
        const totalSupply = Number(patch.totalSupply);
        if (!Number.isFinite(totalSupply) || totalSupply <= 0) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.meta = { field: "totalSupply", rule: "must be a positive number" };
            throw err;
        }
        nextPatch.totalSupply = totalSupply;
    }

    if (patch?.imageUrl !== undefined) {
        const raw = (patch.imageUrl && String(patch.imageUrl).trim()) || "";
        if (!raw) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.meta = { field: "imageUrl", rule: "cannot be empty" };
            throw err;
        }

        const expectedPathPrefix = `/public/users/${creatorUserId}/photocards/`;
        const imagePath = normalizeToPath(raw);
        if (!imagePath.startsWith(expectedPathPrefix)) {
            const err = new Error("INVALID_IMAGE_URL");
            err.status = 400;
            err.meta = { expectedPathPrefix };
            throw err;
        }

        // DB에는 path만 저장 (호스트/포트는 환경마다 달라질 수 있음)
        nextPatch.imageUrl = imagePath;
    }

    if (Object.keys(nextPatch).length === 0) {
        const err = new Error("VALIDATION_ERROR");
        err.status = 400;
        err.meta = { message: "no fields to update" };
        throw err;
    }

    const affected = await photocardRepo.updatePhotoCardById(id, nextPatch);
    if (!affected) {
        const err = new Error("UPDATE_FAILED");
        err.status = 500;
        throw err;
    }

    const updated = await photocardRepo.getPhotoCardById(id);
    return mapRow(updated);
}

export default {
    createPhotoCard,
    listPhotoCards,
    getPhotoCardById,
    updatePhotoCard,
};
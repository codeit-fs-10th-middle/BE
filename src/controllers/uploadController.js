import { createPresignedPhotocardUpload } from "../services/uploadService.js";

export async function presignPhotocardUpload(req, res, next) {
  try {
    const contentType = String(req.body?.contentType || "").trim();
    const userId = req.body?.userId;
    const data = await createPresignedPhotocardUpload({ userId, contentType });

    return res.json({ ok: true, data });
  } catch (err) {
    return next(err);
  }
}

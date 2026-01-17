import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

function extFromMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return null;
}

export async function createPresignedPhotocardUpload({ userId, contentType }) {
  if (!ALLOWED_MIME.has(contentType)) {
    const err = new Error("UNSUPPORTED_CONTENT_TYPE");
    err.status = 400;
    err.meta = { allowed: Array.from(ALLOWED_MIME) };
    throw err;
  }

  const bucket = process.env.S3_BUCKET;
  const region = process.env.AWS_REGION;
  const baseUrl = process.env.S3_PUBLIC_BASE_URL;
  const expiresIn = Number(process.env.S3_PRESIGN_EXPIRES || 60);

  if (!bucket || !region || !baseUrl) {
    const err = new Error("S3_NOT_CONFIGURED");
    err.status = 500;
    err.meta = { requiredEnv: ["S3_BUCKET", "AWS_REGION", "S3_PUBLIC_BASE_URL"] };
    throw err;
  }

  const ext = extFromMime(contentType);
  const key = `public/users/${userId}/photocards/${crypto.randomUUID()}.${ext}`;

  const s3 = new S3Client({ region });
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn });
  const imageUrl = `${baseUrl}/${key}`;

  return { uploadUrl, imageUrl, key, expiresIn };
}

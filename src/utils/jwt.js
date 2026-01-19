import jwt from "jsonwebtoken";

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!accessSecret || !refreshSecret) {
  throw new Error(
    "JWT secrets are not configured. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env"
  );
}

const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES || "15m";
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES || "14d";

export function signAccessToken(payload) {
  return jwt.sign(payload, accessSecret, { expiresIn: accessExpiresIn });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpiresIn });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret);
}

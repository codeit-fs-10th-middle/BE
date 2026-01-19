import bcrypt from "bcrypt";
import crypto from "crypto";

import authRepository from "../repositories/authRepository.js";
import oauthRepository from "../repositories/oauthRepository.js";

import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

import {
  exchangeCodeForTokens,
  verifyGoogleIdToken,
} from "../utils/googleOAuth.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function toMySqlDateTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
}

function getRefreshExpiresAtFromJwtPayload(payload) {
  if (!payload?.exp) return null;
  return new Date(payload.exp * 1000);
}

function generateDefaultNickname(email) {
  const base = (email?.split("@")[0] || "user").slice(0, 10);
  const rand = crypto.randomBytes(3).toString("hex");
  return `${base}_${rand}`;
}

async function signup({ email, password, nickname }) {
  if (!email || !password || !nickname) {
    const err = new Error("email, password, nickname are required");
    err.status = 400;
    throw err;
  }

  const existing = await authRepository.findUserByEmail(email);
  if (existing) {
    const err = new Error("Email already exists");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await authRepository.createUser({
    email,
    nickname,
    passwordHash,
  });

  return { userId, email, nickname };
}

async function login({ email, password }) {
  if (!email || !password) {
    const err = new Error("email and password are required");
    err.status = 400;
    throw err;
  }

  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  if (!user.password_hash) {
    const err = new Error("This account uses OAuth. Please login with Google.");
    err.status = 400;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken({
    userId: user.user_id,
    email: user.email,
  });
  const refreshToken = signRefreshToken({ userId: user.user_id });

  const tokenHash = hashToken(refreshToken);
  const payload = verifyRefreshToken(refreshToken);
  const expiresAt = getRefreshExpiresAtFromJwtPayload(payload);

  if (!expiresAt) {
    const err = new Error("Failed to calculate refresh token expiration");
    err.status = 500;
    throw err;
  }

  await authRepository.saveRefreshToken({
    userId: user.user_id,
    tokenHash,
    expiresAt: toMySqlDateTime(expiresAt),
  });

  return {
    user: {
      userId: user.user_id,
      email: user.email,
      nickname: user.nickname,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * ✅ Google OAuth Login (Phase 1)
 * - 이메일 인증(email_verified) 강제 X (팀 합의 반영)
 * - id_token은 반드시 백엔드에서 verify (위조 방지)
 * - 우선순위: oauth_account(provider+sub) > users(email)
 * - 신규면 users 자동 가입 + oauth_account 저장
 * - 기존 email이면 oauth_account 자동 링크
 */
async function googleLogin({ code }) {
  if (!code) {
    const err = new Error("code is required");
    err.status = 400;
    throw err;
  }

  // 1) code -> tokens
  const tokens = await exchangeCodeForTokens(code);
  if (!tokens?.id_token) {
    const err = new Error("Google token exchange failed: id_token missing");
    err.status = 401;
    throw err;
  }

  // 2) id_token 검증 -> 사용자 식별
  const googlePayload = await verifyGoogleIdToken(tokens.id_token);

  const provider = "google";
  const providerUserId = googlePayload.sub;
  const email = googlePayload.email;

  if (!email) {
    const err = new Error("Google account email not provided");
    err.status = 401;
    throw err;
  }

  // 3) oauth_account로 기존 링크 조회
  const linked = await oauthRepository.findByProviderUserId({
    provider,
    providerUserId,
  });

  let user;
  if (linked) {
    user = await authRepository.findUserById(linked.user_id);
    if (!user) {
      const err = new Error("Linked user not found");
      err.status = 404;
      throw err;
    }
  } else {
    // 4) email로 기존 회원 여부 식별
    const existingByEmail = await authRepository.findUserByEmail(email);

    if (existingByEmail) {
      // 4-1) 기존 회원이면 oauth_account만 저장(연동)
      await oauthRepository.createOauthAccount({
        userId: existingByEmail.user_id,
        provider,
        providerUserId,
        email,
      });
      user = await authRepository.findUserById(existingByEmail.user_id);
    } else {
      // 4-2) 신규면 자동 가입 (password_hash = NULL)
      const nickname = generateDefaultNickname(email);
      const userId = await authRepository.createUser({
        email,
        nickname,
        passwordHash: null,
      });

      await oauthRepository.createOauthAccount({
        userId,
        provider,
        providerUserId,
        email,
      });

      user = await authRepository.findUserById(userId);
    }
  }

  // 5) 토큰 발급
  const accessToken = signAccessToken({
    userId: user.user_id,
    email: user.email,
  });
  const refreshToken = signRefreshToken({ userId: user.user_id });

  const tokenHash = hashToken(refreshToken);
  const refreshPayload = verifyRefreshToken(refreshToken);
  const expiresAt = getRefreshExpiresAtFromJwtPayload(refreshPayload);

  if (!expiresAt) {
    const err = new Error("Failed to calculate refresh token expiration");
    err.status = 500;
    throw err;
  }

  await authRepository.saveRefreshToken({
    userId: user.user_id,
    tokenHash,
    expiresAt: toMySqlDateTime(expiresAt),
  });

  return {
    user: {
      userId: user.user_id,
      email: user.email,
      nickname: user.nickname,
    },
    accessToken,
    refreshToken,
  };
}

async function refresh({ refreshToken }) {
  if (!refreshToken) {
    const err = new Error("refreshToken is required");
    err.status = 400;
    throw err;
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (e) {
    const err = new Error("Invalid refresh token");
    err.status = 401;
    throw err;
  }

  const tokenHash = hashToken(refreshToken);
  const row = await authRepository.findRefreshTokenByHash(tokenHash);

  if (!row) {
    const err = new Error("Refresh token not found");
    err.status = 401;
    throw err;
  }
  if (row.revoked_at) {
    const err = new Error("Refresh token revoked");
    err.status = 401;
    throw err;
  }
  if (new Date(row.expires_at) < new Date()) {
    const err = new Error("Refresh token expired");
    err.status = 401;
    throw err;
  }

  const user = await authRepository.findUserById(payload.userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const newAccessToken = signAccessToken({
    userId: user.user_id,
    email: user.email,
  });

  return { accessToken: newAccessToken };
}

async function logout({ refreshToken }) {
  if (!refreshToken) {
    const err = new Error("refreshToken is required");
    err.status = 400;
    throw err;
  }

  try {
    verifyRefreshToken(refreshToken);
  } catch (e) {
    return { ok: true };
  }

  const tokenHash = hashToken(refreshToken);
  await authRepository.revokeRefreshToken(tokenHash);

  return { ok: true };
}

export default {
  signup,
  login,
  googleLogin, // 추가한 거
  refresh,
  logout,
};

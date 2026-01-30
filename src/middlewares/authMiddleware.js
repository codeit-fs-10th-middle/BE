import { verifyAccessToken } from "../utils/jwt.js";

// Authorization: Bearer <token> 에서 토큰만 추출
function extractBearerToken(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;

  const [type, token] = auth.split(" ");
  if (!type || !token) return null;

  if (type.toLowerCase() !== "bearer") return null;
  return token.trim();
}

// 인증 에러 객체 생성 (기본 401)
function createAuthError(message, status = 401) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// 보호 API용 인증 미들웨어
export default function authMiddleware(req, res, next) {
  try {
    // 1. 토큰 추출
    const token = extractBearerToken(req);
    if (!token) {
      return next(createAuthError("Access token is required", 401));
    }

    // 2. 토큰 검증
    const payload = verifyAccessToken(token);
    if (!payload?.userId) {
      return next(createAuthError("Invalid access token", 401));
    }

    // 3. 이후 컨트롤러에서 사용할 사용자 정보 세팅
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    return next();
  } catch (e) {
    if (e?.name === "TokenExpiredError") {
      return next(createAuthError("Access token expired", 401));
    }
    if (e?.name === "JsonWebTokenError") {
      return next(createAuthError("Invalid access token", 401));
    }

    return next(createAuthError("Authentication failed", 401));
  }
}

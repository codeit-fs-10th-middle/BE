import { verifyAccessToken } from "../utils/jwt.js";

/**
 * Authorization 헤더에서 Bearer 토큰만 추출
 * [팀원] 클라이언트는 반드시
 * Authorization: Bearer <accessToken>
 * 형태로 요청을 보내야 합니다.
 */
function extractBearerToken(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;

  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;

  return token;
}

/**
 * 공통 에러 처리기(errorHandler)와 연동하기 위한 에러 생성 함수
 * [참고] 인증 실패 시 항상 401로 내려갑니다.
 */
function createAuthError(message, status = 401) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * authMiddleware
 * - 보호 API에서 로그인 사용자만 접근하도록 하는 미들웨어
 *
 * [참고]
 * 이 미들웨어를 라우트 앞에 붙이면,
 * 이후 컨트롤러에서 req.user.userId 로
 * "로그인한 사용자 ID"를 바로 사용할 수 있습니다.
 *
 * 예)
 * router.post("/purchase", authMiddleware, purchaseController.create);
 */
export default function authMiddleware(req, res, next) {
  try {
    // 1. 토큰이 없으면 바로 차단
    const token = extractBearerToken(req);
    if (!token) {
      return next(createAuthError("Access token is required", 401));
    }

    // 2. 토큰 검증 (만료/위조 여부 확인)
    const payload = verifyAccessToken(token);

    // 3. userId가 없으면 유효하지 않은 토큰으로 처리
    if (!payload?.userId) {
      return next(createAuthError("Invalid access token", 401));
    }

    /**
     * [참고]
     * 여기서 req.user에 userId를 넣어주기 때문에,
     * 구매/교환/포인트 API에서는
     * req.user.userId를 그대로 사용하면 됩니다.
     *
     * 예)
     * const buyerId = req.user.userId;
     */
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    return next();
  } catch (e) {
    // 만료된 토큰
    if (e?.name === "TokenExpiredError") {
      return next(createAuthError("Access token expired", 401));
    }

    // 잘못된 토큰
    if (e?.name === "JsonWebTokenError") {
      return next(createAuthError("Invalid access token", 401));
    }

    /**
     * [참고]
     * 인증 단계에서는 내부 에러를 상세히 노출하지 않고,
     * 항상 401(Authentication failed)로 통일.
     */
    return next(createAuthError("Authentication failed", 401));
  }
}

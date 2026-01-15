import { verifyAccessToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }
    const token = auth.split(" ")[1];
    const decoded = verifyAccessToken(token);
    req.user = { userId: decoded.sub };
    next();
  } catch (err) {
    return res.status(401).json({ message: "토큰이 유효하지 않습니다." });
  }
}

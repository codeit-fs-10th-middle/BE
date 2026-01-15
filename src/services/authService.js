import bcrypt from "bcrypt";
import { findUserByEmail } from "../repositories/authRepository.js";
import { signAccessToken } from "../utils/jwt.js";

export async function login(email, password) {
  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    err.status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.password_hash ?? "");
  if (!ok) {
    const err = new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken(user.user_id);

  return {
    accessToken,
    user: {
      userId: user.user_id,
      email: user.email,
      nickname: user.nickname,
    },
  };
}

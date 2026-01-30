import userRepository from "../repositories/userRepository.js";

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function createUser(userData) {
  const { email, nickname, password } = userData;

  if (!email || !nickname) {
    throw createError("이메일과 닉네임은 필수입니다.", 400);
  }

  const existingUserByEmail = await userRepository.findByEmail(email);
  if (existingUserByEmail) {
    throw createError("이미 사용 중인 이메일입니다.", 409);
  }

  const existingUserByNickname = await userRepository.findByNickname(nickname);
  if (existingUserByNickname) {
    throw createError("이미 사용 중인 닉네임입니다.", 409);
  }

  const password_hash = password || null;

  const newUser = await userRepository.save({
    email,
    nickname,
    password_hash,
  });

  delete newUser.password_hash;
  return newUser;
}

async function getUserById(userId) {
  if (!userId) {
    throw createError("유저 ID가 필요합니다.", 400);
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw createError("유저를 찾을 수 없습니다.", 404);
  }

  delete user.password_hash;
  return user;
}

async function getAllUsers() {
  const users = await userRepository.findAll();
  return users.map((user) => {
    const { password_hash, ...rest } = user;
    return rest;
  });
}

//  GET /users/me 용: email, nickname, points만 반환
async function getMe(userId) {
  if (!userId) {
    throw createError("유저 ID가 필요합니다.", 400);
  }

  const user = await userRepository.findMeById(userId);
  if (!user) {
    throw createError("유저를 찾을 수 없습니다.", 404);
  }

  return user; // { email, nickname, points }
}

// PATCH /users/me 용: email/nickname 수정 + 중복 체크
async function updateMe(userId, { email, nickname }) {
  if (!userId) {
    throw createError("유저 ID가 필요합니다.", 400);
  }

  // 둘 다 없으면 수정할 게 없음
  if (email === undefined && nickname === undefined) {
    throw createError("수정할 값이 없습니다.", 400);
  }

  // 공백 문자열 방지
  if (email !== undefined && String(email).trim() === "") {
    throw createError("이메일은 비어 있을 수 없습니다.", 400);
  }
  if (nickname !== undefined && String(nickname).trim() === "") {
    throw createError("닉네임은 비어 있을 수 없습니다.", 400);
  }

  // 내 계정 존재 확인 (겸사겸사 현재 값도 가져옴)
  const current = await userRepository.findById(userId);
  if (!current) {
    throw createError("유저를 찾을 수 없습니다.", 404);
  }

  // 이메일 중복 체크 (본인 제외)
  if (email !== undefined && email !== current.email) {
    const existingByEmail = await userRepository.findByEmail(email);
    if (existingByEmail && existingByEmail.user_id !== userId) {
      throw createError("이미 사용 중인 이메일입니다.", 409);
    }
  }

  // 닉네임 중복 체크 (본인 제외)
  if (nickname !== undefined && nickname !== current.nickname) {
    const existingByNickname = await userRepository.findByNickname(nickname);
    if (existingByNickname && existingByNickname.user_id !== userId) {
      throw createError("이미 사용 중인 닉네임입니다.", 409);
    }
  }

  await userRepository.update(userId, { email, nickname });

  // 수정 후 최신 데이터 반환 (요구사항: email, nickname, points)
  const updated = await userRepository.findMeById(userId);
  return updated;
}

export default {
  createUser,
  getUserById,
  getAllUsers,
  getMe,
  updateMe,
};

import userRepository from "../repositories/userRepository.js";

async function createUser(userData) {
  const { email, nickname, password } = userData;

  // 필수 필드 검증
  if (!email || !nickname) {
    const error = new Error("이메일과 닉네임은 필수입니다.");
    error.code = 400;
    throw error;
  }

  // 이메일 중복 확인
  const existingUserByEmail = await userRepository.findByEmail(email);
  if (existingUserByEmail) {
    const error = new Error("이미 사용 중인 이메일입니다.");
    error.code = 409;
    throw error;
  }

  // 닉네임 중복 확인
  const existingUserByNickname = await userRepository.findByNickname(nickname);
  if (existingUserByNickname) {
    const error = new Error("이미 사용 중인 닉네임입니다.");
    error.code = 409;
    throw error;
  }

  // 비밀번호 해싱 (나중에 bcrypt로 변경 가능)
  // 일단 평문으로 저장하거나, 간단한 해싱 적용
  const password_hash = password || null;

  // 유저 생성
  const newUser = await userRepository.save({
    email,
    nickname,
    password_hash,
  });

  // 비밀번호 해시는 응답에서 제외
  delete newUser.password_hash;

  return newUser;
}

async function getUserById(userId) {
  if (!userId) {
    const error = new Error("유저 ID가 필요합니다.");
    error.code = 400;
    throw error;
  }

  const user = await userRepository.findById(userId);
  
  if (!user) {
    const error = new Error("유저를 찾을 수 없습니다.");
    error.code = 404;
    throw error;
  }

  // 비밀번호 해시는 응답에서 제외
  delete user.password_hash;

  return user;
}

async function getAllUsers() {
  const users = await userRepository.findAll();
  
  // 모든 유저의 비밀번호 해시 제외
  return users.map(user => {
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
}

export default {
  createUser,
  getUserById,
  getAllUsers,
};

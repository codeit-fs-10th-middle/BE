import notificationRepository from "../repositories/notificationRepository.js";

function createError(message, status) {
  const e = new Error(message);

  e.status = status;
  e.code = status;
  return e;
}

// 이벤트 발생 시 알림 생성
async function createNotification({
  userId,
  type,
  entityType,
  entityId,
  message,
}) {
  if (!userId) throw createError("userId is required", 400);
  if (!type) throw createError("type is required", 400);
  if (!entityType) throw createError("entityType is required", 400);
  if (!entityId) throw createError("entityId is required", 400);
  if (!message) throw createError("message is required", 400);

  const notificationId = await notificationRepository.create({
    userId,
    type,
    entityType,
    entityId,
    message,
  });

  return { notificationId };
}

// GET /notifications : 목록(최신순) - 읽음 처리 없음
async function getMyNotifications(userId) {
  if (!userId) throw createError("userId is required", 400);
  return await notificationRepository.findByUserId(userId);
}

// GET /notifications/:id : 상세 열람(2번째 열람 시 읽음 처리)
async function viewNotificationDetail(userId, notificationId) {
  if (!userId) throw createError("userId is required", 400);
  if (!notificationId) throw createError("notificationId is required", 400);

  const affected = await notificationRepository.touchReadProgress({
    userId,
    notificationId,
  });

  if (affected === 0) throw createError("알림을 찾을 수 없습니다.", 404);

  const detail = await notificationRepository.findByIdForUser({
    userId,
    notificationId,
  });
  if (!detail) throw createError("알림을 찾을 수 없습니다.", 404);

  return detail;
}

export default {
  createNotification,
  getMyNotifications,
  viewNotificationDetail,
};

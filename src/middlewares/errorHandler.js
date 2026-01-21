export default function errorHandler(error, req, res, next) {
  const status = Number.isInteger(error?.status) ? error.status : 500;
  console.error(error);
  const body = {
    path: req.path,
    method: req.method,
    message: error.message ?? 'Internal Server Error',
    data: error.data ?? error.meta ?? undefined,
    date: new Date(),
  };
  const resObj = res.status(status);
  if (status === 429 && typeof error?.data?.remainingTotalSeconds === 'number') {
    resObj.set('Retry-After', String(error.data.remainingTotalSeconds));
  }
  return resObj.json(body);
}

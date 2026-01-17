export default function errorHandler(error, req, res, next) {
  const status = error.status ?? error.code ?? 500;
  console.error(error);
  return res.status(status).json({
    path: req.path,
    method: req.method,
    message: error.message ?? 'Internal Server Error',
    data: error.data ?? error.meta ?? undefined,
    date: new Date(),
  });
}

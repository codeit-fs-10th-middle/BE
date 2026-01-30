export default function errorHandler(error, req, res, next) {
  const status = error.status ?? error.code ?? 500;

  console.error(error);

  const response = {
    result: "fail",
    message: error.message ?? "Internal Server Error",
    data: error.data ?? null,
  };

  if (process.env.NODE_ENV !== "production") {
    response.debug = {
      path: req.path,
      method: req.method,
      date: new Date(),
    };
  }

  return res.status(status).json(response);
}

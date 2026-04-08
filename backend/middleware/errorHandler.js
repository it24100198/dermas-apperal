const ApiError = require("../utils/ApiError");

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error.message === "Not allowed by CORS") {
    res.status(403).json({
      success: false,
      message: "Origin not allowed by CORS policy.",
    });
    return;
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    res.status(400).json({
      success: false,
      message: "Invalid JSON payload.",
    });
    return;
  }

  if (error.name === "CastError") {
    res.status(400).json({
      success: false,
      message: "Invalid resource identifier.",
    });
    return;
  }

  if (error.name === "ValidationError") {
    const details = Object.values(error.errors).map((entry) => ({
      field: entry.path,
      message: entry.message,
    }));

    res.status(400).json({
      success: false,
      message: "Validation failed.",
      details,
    });
    return;
  }

  if (error.code === 11000) {
    res.status(409).json({
      success: false,
      message: "Duplicate value detected.",
      details: error.keyValue,
    });
    return;
  }

  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : "Internal server error.";

  const payload = {
    success: false,
    message,
  };

  if (error instanceof ApiError && error.details) {
    payload.details = error.details;
  }

  if (process.env.NODE_ENV !== "production" && !(error instanceof ApiError)) {
    payload.error = error.message;
  }

  res.status(statusCode).json(payload);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

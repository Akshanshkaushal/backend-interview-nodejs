// API Response formatter
const sendResponse = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
  });
};

// Error handler
const handleError = (res, error, statusCode = 500) => {
  console.error(error);
  sendResponse(res, statusCode, error.message || "Something went wrong");
};

// Validate MongoDB ID
const isValidId = (id) => {
  return id.length === 24 && /^[0-9a-f]{24}$/.test(id);
};

module.exports = {
  sendResponse,
  handleError,
  isValidId,
};

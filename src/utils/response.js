// success response
// Send a standard successful response.
const sendSuccess = (res, message = "Success") => {
  return res.status(200).json({
    success: true,
    message
  });
};

// created response
// Send a standard resource-created response.
const sendCreated = (res, message = "Created successfully") => {
  return res.status(201).json({
    success: true,
    message
  });
};


// bad request (validation errors)
// Send a standard validation/client-error response.
const sendBadRequest = (res, message = "Bad request") => {
  return res.status(400).json({
    success: false,
    message
  });
};

// not found
// Send a standard not-found response.
const sendNotFound = (res, message = "Resource not found") => {
  return res.status(404).json({
    success: false,
    message
  });
};

// conflict (already exists)
// Send a standard duplicate/conflict response.
const sendConflict = (res, message = "Data already exists") => {
  return res.status(409).json({
    success: false,
    message
  });
};

// server error
// Log the internal error and return a safe generic server response.
const sendServerError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};

export {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
  sendConflict,
  sendServerError
};

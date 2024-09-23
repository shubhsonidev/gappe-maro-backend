const { validateToken } = require("../services/authentication");

function checkForAuthenticationHeader(headerName) {
  return (req, res, next) => {
    const token = req.headers["authtoken"]; // Retrieve token from the specified header
    if (!token) {
      return next(); // No token, proceed without authentication
    }
    try {
      const userPayload = validateToken(token); // Validate the token
      req.user = userPayload; // Attach user payload to the request object
    } catch (error) {
      // Handle token validation error (optional)
      console.error("Token validation failed:", error);
    }
    return next();
  };
}

module.exports = {
  checkForAuthenticationHeader,
};

const JWT = require("jsonwebtoken");

const secret = process.env.JWT_TOKEN;

function createTokenForUser(user) {
  const payload = {
    _id: user._id,
    mobileNumber: user.mobileNumber,
    email: user.email,
    profileImageURL: user.profileImageURL,
    role: user.role,
  };

  const token = JWT.sign(payload, secret);
  return token;
}

function validateToken(token) {
  console.log(token);
  const payload = JWT.verify(token, secret);
  return payload;
}

module.exports = {
  createTokenForUser,
  validateToken,
};

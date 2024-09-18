const express = require("express");
const {
  hangleGenerateOTP,
  handleVerifyOTP,
  handleUserUpdate,
  handleUserSearch,
  handleGetUserInfo,
} = require("../controllers/user");
const router = express.Router();

router.get("/profile", handleGetUserInfo);

router.post("/generateOtp", hangleGenerateOTP);

router.post("/verify", handleVerifyOTP);

router.put("/update", handleUserUpdate);

router.post("/search", handleUserSearch);

module.exports = router;

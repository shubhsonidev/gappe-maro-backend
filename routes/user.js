const express = require("express");
const { hangleGenerateOTP, handleVerifyOTP, handleUserUpdate, handleUserSearch } = require("../controllers/user");
const router = express.Router();

router.post("/generateOtp", hangleGenerateOTP);

router.post("/verify", handleVerifyOTP);

router.put("/update", handleUserUpdate);

router.post("/search", handleUserSearch);

module.exports = router;

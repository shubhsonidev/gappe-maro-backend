const express = require("express");
const { hangleGenerateOTP, handleVerifyOTP, handleUserUpdate, handleUserSearch } = require("../controllers/user");
const router = express.Router();

router.get("/generateOtp", hangleGenerateOTP);

router.post("/verify", handleVerifyOTP);

router.put("/update", handleUserUpdate);

router.get("/search", handleUserSearch);

module.exports = router;

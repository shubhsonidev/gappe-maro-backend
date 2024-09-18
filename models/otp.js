const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    otp: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const otp = mongoose.model("otp", otpSchema);

module.exports = otp;

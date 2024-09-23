const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const user = require("../models/user");
const otp = require("../models/otp");
const { createTokenForUser } = require("../services/authentication");

async function hangleGenerateOTP(req, res) {
  await body("mobileNumber")
    .isLength({ min: 10, max: 10 })
    .withMessage("Mobile number must be exactly 10 characters long")
    .isMobilePhone("en-IN")
    .withMessage("Invalid mobile number")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { mobileNumber } = req.body;

  const otpGenerated = crypto.randomInt(100000, 999999);

  try {
    await otp.findOneAndDelete({
      mobileNumber: mobileNumber,
    });
    await otp.create({ mobileNumber: mobileNumber, otp: otpGenerated });

    const isUser = await user.findOne({
      mobileNumber: mobileNumber,
    });

    res.status(201).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        otpGenerated,
        isExists: isUser ? true : false,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to send OTP right now, please try after some time",
      error: error.message,
    });
  }
}

async function handleVerifyOTP(req, res) {
  await body("mobileNumber")
    .isLength({ min: 10, max: 10 })
    .withMessage("Mobile number must be exactly 10 characters long")
    .isMobilePhone("en-IN")
    .withMessage("Invalid mobile number")
    .run(req);

  await body("otpRcvd")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits long")
    .isNumeric()
    .withMessage("OTP must contain only numbers")
    .run(req);

  // Handle validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { fullName, mobileNumber, otpRcvd } = req.body;

  const storedOTPData = await otp.findOne({
    mobileNumber: mobileNumber,
  });

  if (!storedOTPData) {
    return res.status(400).json({
      success: false,
      message: "OTP has expired or does not exist",
    });
  }

  // Check if the OTP has expired
  if (Date.now() > storedOTPData.createdAt + 5 * 60 * 1000) {
    otp.findByIdAndDelete({ _id: storedOTPData._id });
    return res.status(400).json({
      success: false,
      message: "OTP has expired",
    });
  }

  if (otpRcvd.toString() === storedOTPData.otp.toString()) {
    try {
      await otp.findByIdAndDelete({ _id: storedOTPData._id });

      const isUserExist = await user.findOne({
        mobileNumber: mobileNumber,
      });

      if (isUserExist) {
        const token = createTokenForUser(isUserExist);

        return res
          .status(200)
          .cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "None",
          })
          .json({
            success: true,
            message: "Logged in successfully",
            token: token,
          });
      } else {
        const newUser = await user.create({
          fullName: fullName,
          mobileNumber: mobileNumber,
        });

        const token = createTokenForUser(newUser);

        return res
          .status(200)
          .cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
          })
          .json({
            success: true,
            message: "Logged in successfully",
            token: token,
          });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP",
    });
  }
}

async function handleUserUpdate(req, res) {
  const { fullName, email, bio } = req.body;

  try {
    const updatedUser = await user.findByIdAndUpdate(
      { _id: req.user._id },
      {
        ...(fullName && { fullName }),
        ...(email && { email }),
        ...(bio && { bio }),
      },
      {
        new: true,
      }
    );
    if (!updatedUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    res.status(200).json({ status: true, message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ status: false, message: "Server error" });
  }
}

async function handleUserSearch(req, res) {
  await body("mobileNumber")
    .isLength({ min: 10, max: 10 })
    .withMessage("Mobile number must be exactly 10 characters long")
    .isMobilePhone("en-IN")
    .withMessage("Invalid mobile number")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  const { mobileNumber } = req.body;

  try {
    const foundUser = await user.findOne({ mobileNumber: mobileNumber });

    if (!foundUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Return the found user's basic information (excluding sensitive data)
    res.status(200).json({
      success: true,
      user: {
        foundUser,
      },
    });
  } catch (error) {
    console.error("Error finding user:", error);
    res.status(500).json({ message: "Server error" });
  }
}

async function handleGetUserInfo(req, res) {
  try {
    // Check if the user is present in the request
    if (!req.user) {
      return res.status(404).json({ status: false, message: "Invalid User" });
    }

    // Fetch the user by ID and populate the friends field with selected information
    const userInfo = await user
      .findById(req.user._id)
      .populate("friends", "fullName mobileNumber bio profileImageURL")
      .lean();

    // If user is not found
    if (!userInfo) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // If user is found, return the user info
    res.status(200).json({
      status: true,
      message: "User Found successfully",
      user: userInfo,
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
}

module.exports = {
  hangleGenerateOTP,
  handleVerifyOTP,
  handleUserUpdate,
  handleUserSearch,
  handleGetUserInfo,
};

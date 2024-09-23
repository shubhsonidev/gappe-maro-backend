const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    bio: {
      type: String,
      default: "Hey there! I am using Gappe-maro",
    },
    profileImageURL: {
      type: String,
      default: "https://picsum.photos/200",
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  { timestamps: true }
);

const user = mongoose.model("user", userSchema);

module.exports = user;

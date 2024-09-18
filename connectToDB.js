const mongoose = require("mongoose");

async function connectToDB() {
  return mongoose.connect(process.env.MONGO_URL);
}
module.exports = { connectToDB };

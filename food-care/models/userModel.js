
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Please enter the name."] },
    email: {
      type: String,
      required: [true, "Please enter the email."],
      unique: [true, "Email address is already taken"],
    },
    phone: {
      type: String,
      required: [true, "Please enter the mobile number."],
    },
    address: {
      type: String,
    },
    imageUrl: { type: String },
    isVerify: { type: Boolean },
    verificationToken: { type: String },
    role: { type: String, enum: ['ADMIN', 'DONOR', 'RECEIPIAN'], required: true },
    foodRequest: {
      type: [
        {
          foodId: { type: String},
          permission: { type: String},
        },
      ],
      default: [],
    },
    deviceToken: {
      type: Array,
    },
    password: { type: String, required: [true, "Please enter the password."] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);

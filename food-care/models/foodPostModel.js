const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    
    title: { type: String, required: true },
    author: { type: String },
    description: { type: String, required: true },
    quantity: { type: String },
    other: { type: String },
    pickupTimes: { type: String },
    listDays: { type: String },
    location: {
      lan: {
        type: String,
      },
      lon: {
        type: String,
      },
    },
    imageUrls: { type: Array },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FoodPost", foodSchema);

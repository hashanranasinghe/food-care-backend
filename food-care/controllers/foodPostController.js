const asyncHandler = require("express-async-handler");
const Food = require("../models/foodPostModel");
const validator = require("validator");
const fs = require("fs");

//get all food post======================================================================
const getFoodPosts = asyncHandler(async (req, res) => {
  const foods = await Food.find();
  res.status(200).json(foods);
});

//create food post======================================================================
const createFoodPost = async (req, res, next) => {
  console.log(req.user.id);
  if (!req.body.title || !req.body.description) {
    res.status(400);
    throw new Error("Title and Description are required.");
  }
  const food = new Food({
    user_id: req.user.id,
    title: req.body.title,
    author: req.body.author,
    description: req.body.description,
    quantity: req.body.quantity,
    other: req.body.other,
    pickupTimes: req.body.pickupTimes,
    listDays: req.body.listDays,
    isShared: validator.toBoolean(req.body.isShared),
    location: {
      lan: req.body.location.lan,
      lon: req.body.location.lon,
    },
  });
  if (req.files) {
    // <-- use req.files instead of req.file
    food.imageUrls = req.files.map((file) => file.path); // <-- store an array of all file paths
  }

  console.log(food.imageUrls);
  try {
    const savedFood = await food.save();
    res.json({
      message: "Food post uploaded.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//get own all foods======================================================================
const getOwnFoods = asyncHandler(async (req, res) => {
  console.log(req.user.id);
  const foods = await Food.find({ user_id: req.user.id });
  res.status(200).json(foods);
});

//get a own food======================================================================
const getOwnFood = asyncHandler(async (req, res) => {
  const food = await Food.findOne({
    _id: req.params.id,
    user_id: req.user.id,
  });

  if (!food) {
    res.status(404);
    throw new Error("Forum not found");
  }

  res.status(200).json(food);
});

//get a food post======================================================================
const getFoodPost = asyncHandler(async (req, res) => {
  const foodPost = await Food.findById(req.params.id);
  if (!foodPost) {
    res.status(404);
    throw new Error("Food post not found");
  }
  res.status(200).json(foodPost);
});

//update a food======================================================================
const updateFoodPost = asyncHandler(async (req, res) => {
  const food = await Food.findOne({
    _id: req.params.id,
    user_id: req.user.id,
  });

  console.log(food);

  if (!food) {
    res.status(404);
    throw new Error("Food post not found");
  }

  if (req.files) {
    const newImageUrls = req.files.map((file) => file.path);
    food.imageUrls = food.imageUrls.concat(newImageUrls); // <-- merge the new array with the existing one
  }

  food.title = req.body.title || food.title;
  food.description = req.body.description || food.description;
  food.quantity = req.body.quantity || food.quantity;
  food.other = req.body.other || food.other;
  food.pickupTimes = req.body.pickupTimes || food.pickupTimes;
  food.listDays = req.body.listDays || food.listDays;
  food.isShared = validator.toBoolean(req.body.isShared) || food.isShared;
  food.location.lan = req.body.location.lan || food.location.lan;
  food.location.lon = req.body.location.lon || food.location.lon;

  console.log(food);
  const updatedFood = await food.save();

  res.status(200).json({
    message: "Food updated successfully",
    food: updatedFood,
  });
});

//requet for food================================================================
const requestFood = asyncHandler(async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (req.body.requesterId == "") {
      if (!food.requests.includes(req.user.id)) {
        await food.updateOne({ $push: { requests: req.user.id } });
        res.status(200).json("The food has been requested..");
      } else {
        await food.updateOne({ $pull: { requests: req.user.id } });
        res.status(200).json("The request has been canceled.");
      }
    } else {
      await food.updateOne({ $pull: { requests: req.body.requesterId } });
      res.status(200).json("The request has been canceled.");
    }
  } catch (err) {}
});

//delete a food======================================================================
const deleteFoodPost = asyncHandler(async (req, res) => {
  const food = await Food.findOne({
    _id: req.params.id,
    user_id: req.user.id,
  });

  if (!food) {
    res.status(404);
    throw new Error("Forum not found");
  }

  if (food.imageUrls && food.imageUrls.length > 0) {
    // Remove the image files from the file system
    food.imageUrls.forEach((url) => {
      fs.unlink(url, (err) => {
        if (err) {
          console.error(err);
        }
      });
    });
  }

  await food.remove();

  res.status(200).json({
    message: "Forum deleted successfully",
    food: food,
  });
});

//delete a food images======================================================================
const deleteFoodPostImages = asyncHandler(async (req, res) => {
  const food = await Food.findOne({
    _id: req.params.id,
    user_id: req.user.id,
  });

  if (!food) {
    res.status(404);
    throw new Error("Forum not found");
  }

  if (food.imageUrls && food.imageUrls.length > 0) {
    const deletePromises = food.imageUrls.map((url) => {
      return new Promise((resolve, reject) => {
        fs.unlink(url, (err) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            const index = food.imageUrls.indexOf(url);
            console.log(index);

            if (index !== -1) {
              food.imageUrls.splice(index, 1);
            }
            resolve();
          }
        });
      });
    });

    // Wait for all the delete promises to complete
    await Promise.all(deletePromises);
  }

  const updatedFood = await food.save();

  console.log(food);
  res.status(200).json({
    message: "Forum deleted successfully",
    food: updatedFood,
  });
});

module.exports = {
  getFoodPosts,
  createFoodPost,
  updateFoodPost,
  deleteFoodPost,
  getOwnFoods,
  getOwnFood,
  getFoodPost,
  deleteFoodPostImages,
  requestFood,
};

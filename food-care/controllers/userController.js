const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const axios = require("axios");
const { verificationEmail, resetEmail } = require("../middleware/emailService");
const { FirebaseDynamicLinks } = require("firebase-dynamic-links");
const firebaseDynamicLinks = new FirebaseDynamicLinks(process.env.WEB_API_KEY);

//register user============================================================================
const registerUser = asyncHandler(async (req, res, next) => {
  const allowedRoles = ['ADMIN', 'DONOR', 'RECEIPIAN'];

  if (
    !req.body.name ||
    !req.body.email ||
    !req.body.phone ||
    !req.body.isVerify ||
    !req.body.verificationToken ||
    !req.body.deviceToken ||
    !req.body.foodRequest ||
    !req.body.password ||
    !req.body.role
  ) {
    res.status(400);
    throw new Error("Name, email,phone,password are required.");
  }
  if (!allowedRoles.includes(req.body.role)) {
    res.status(400);
    throw new Error("Invalid role.");
  }


  const email = req.body.email;
  const userAvailable = await User.findOne({ email });
  if (userAvailable) {
    res.status(400);
    throw new Error("User already registered.");
  }
  //hash password
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  console.log(req.body.deviceToken);
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    isVerify: validator.toBoolean(req.body.isVerify),
    verificationToken: req.body.verificationToken,
    role: req.body.role,
    deviceToken: [req.body.deviceToken],
    foodRequest: [],
    password: hashedPassword,
  });
  if (req.file) {
    user.imageUrl = req.file.path;
  }

  console.log(user);
  user
    .save()
    .then((response) => {
      verificationEmail(user.email, user.verificationToken, user.name);
      res.json({
        message: "Users uploaded.",
        user: user,
      });
    })
    .catch((error) => {
      res.json({
        message: "Error",
      });
    });
});

//verify user=========================================================================================
const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    verificationToken: req.params.id,
  });
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  user.isVerify = true;
  console.log(user.isVerify);
  await user.save();

  if (user.isVerify) {
    res.render("index");
  } else {
    res.json({
      message: "Error updating user.",
      user: user,
    });
  }
});

//login user======================================================================
const loginUser = asyncHandler(async (req, res) => {

  const { email, password, deviceToken } = req.body;
  if (!email || !password || !deviceToken) {
    res.status(400);
    throw new Error("All fields requeried.");
  }
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    if (!user.deviceToken.includes(deviceToken)) {
      await user.updateOne({ $push: { deviceToken: deviceToken } });
    }
    const accessToken = jwt.sign(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          deviceToken: user.deviceToken,
          imageUrl: user.imageUrl,
          password: user.password,
          address: user.address,
          isVerify: user.isVerify,
          foodRequest: user.foodRequest,
          verificationToken: user.verificationToken,
          role:user.role,
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.status(200).json({ accessToken, user });
  } else {
    res.status(401);
    throw new Error("Email or password s incorrecrt.");
  }
});


//current user======================================================================
const currentUser = asyncHandler(async (req, res) => {
  res.json(req.user);
  console.log(req.user);
});

//update user===========================================================================================

const updateUser = asyncHandler(async (req, res) => {
  const { name, email, phone, address, password } = req.body;
  console.log(req.body);

  const userId = req.params.id;
  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }
  console.log(name);
  user.name = name || user.name;
  user.email = email || user.email;
  user.phone = phone || user.phone;
  user.address = address || user.address;
  user.isVerify = user.isVerify;
  user.verificationToken = user.verificationToken;

  if (password) {
    user.password = await bcrypt.hash(password, 10);
  }

  if (req.file) {
    user.imageUrl = req.file.path;
  }

  await user
    .save()
    .then((response) => {
      console.log(response);
      res.json({
        message: "User updated.",
        user: user,
      });
      console.log("=====================================================");
    })
    .catch((error) => {
      res.status(400);
      console.log(error);
      throw new Error("Error updating user.");
    });
});

//foget password
const postForgetPassowrd = asyncHandler(async (req, res, next) => {
  //post
  const email = req.body.email;
  if (!email) {
    res.status(400);
    throw new Error("Email requeried.");
  }
  const user = await User.findOne({ email: email });

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }
  //user exist and create one time password link
  const secret = process.env.JWT_SECRET + user.password;
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    imageUrl: user.imageUrl,
    password: user.password,
    address: user.address,
    isVerify: user.isVerify,
    verificationToken: user.verificationToken,
  };

  const token = jwt.sign(payload, secret, { expiresIn: "15m" });
  const link = user.id + "/" + token;

  const { shortLink, previewLink } = await firebaseDynamicLinks.createLink({
    dynamicLinkInfo: {
      domainUriPrefix: "https://foodcare.page.link",
      link: "https://www.foodcare.com/token?token=" + link,
      androidInfo: {
        androidPackageName: "com.example.food_care",
      },
    },
  });

  resetEmail(email, shortLink);

  res.status(200).json({
    message: "Reset link is sent.",
  });
});

const postResetPassowrd = asyncHandler(async (req, res) => {
  //post
  const { password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const secret = process.env.JWT_SECRET + user.password;
  try {
    const payload = jwt.verify(req.params.token, secret);
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user
      .save()
      .then((response) => {
        console.log(response);
        res.json({
          message: "User updated.",
          user: user,
        });
      })
      .catch((error) => {
        res.status(400);
        console.log(error);
        throw new Error("Error updating user.");
      });
  } catch (e) {
    if (e.message == "jwt expired") {
      res.status(401).json({ message: "Invalid token" });
    } else if (e.message == "invalid signature") {
      res.status(404).json({ message: "Invalid token" });
    } else {
      console.log(e.message);
    }
  }
});

//get a user==========================================================================
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("Forum not found");
  }
  res.status(200).json(user);
});

//get all users======================================================================
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  res.status(200).json(users);
});

//request for food=================================================
const requestFood = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json("User not found.");
    }

    const foodId = req.body.foodId;
    const permission = req.body.permission;

    const foodRequestIndex = user.foodRequest.findIndex(
      (request) => request.foodId === foodId
    );

    if (foodRequestIndex === -1) {
      // If the foodId is not present in the user's foodRequest, add it.
      const newFoodRequest = { foodId, permission };
      user.foodRequest.push(newFoodRequest);
      await user.save();
      res.status(200).json("The food has been requested.");
    } else {
      // If the foodId is already in the user's foodRequest, remove it using the `_id` field.
      const requestIdToDelete = req.body.foodId;
      if (requestIdToDelete) {
        const requestIndexToDelete = user.foodRequest.find(
          (request) => request.foodId.toString() === requestIdToDelete
        );
        if (requestIndexToDelete !== -1) {
          user.foodRequest.splice(requestIndexToDelete, 1);
          await user.save();
          res.status(200).json("The request has been canceled.");
        } else {
          res.status(404).json("Request not found.");
        }
      } else {
        res.status(400).json("Missing _id field.");
      }
    }
  } catch (err) {
    // Handle any errors that occur during the process
    console.error(err);
    res.status(500).json("Server error.");
  }
});

//update state of request food========================================
const updatePermission = asyncHandler(async (req, res) => {
  try {
    const { userId, foodId, permission } = req.body;
    const user = await User.findOne({
      _id: userId,
    });
    console.log(user);
    if (!user) {
      return res.status(404).json("User not found.");
    }

    const foodRequestToUpdate = user.foodRequest.find(
      (request) => request.foodId.toString() === foodId
    );

    if (!foodRequestToUpdate) {
      return res.status(404).json("Request not found.");
    }

    // Update the permission for the food request
    foodRequestToUpdate.permission = permission;
    await user.save();

    res.status(200).json("Permission updated successfully.");
  } catch (err) {
    // Handle any errors that occur during the process
    console.error(err);
    res.status(500).json("Server error.");
  }
});

module.exports = {
  registerUser,
  loginUser,
  currentUser,
  getUser,
  getUsers,
  updateUser,
  verifyUser,
  requestFood,
  postForgetPassowrd,
  postResetPassowrd,
  updatePermission,
};

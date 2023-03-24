const express = require("express");
const {
  registerUser,
  loginUser,
  currentUser,
  getUser,
  getUsers,
  updateUser,
} = require("../controllers/userController");
const upload = require("../middleware/uploadProfileImage");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();

router.post("/register", upload.single("imageUrl"), registerUser);

router.post("/login", loginUser);

router.get("/current", validateToken, currentUser);
router.put("/update/:id",validateToken,updateUser);
router.get("/user/:id",getUser);
router.get("/users",getUsers);

module.exports = router;

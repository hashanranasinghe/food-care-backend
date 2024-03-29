const express = require("express");
const {
  getFoodPosts,
  createFoodPost,
  updateFoodPost,
  deleteFoodPost,
  getOwnFoods,
  getOwnFood,
  getFoodPost,
  deleteFoodPostImages,
  shareFoodPost,
  requestFood,
  acceptFood,
  rejectFood,
} = require("../controllers/foodPostController");
const router = express.Router();
const validateToken = require("../middleware/validateTokenHandler");
const upload = require("../middleware/uploadFoodImage");
const authorizeRoles = require("../middleware/authorizeRoles");

router
  .route("/foodadmin")
  .get(getFoodPosts);
router.use(validateToken);

router
  .route("/")
  .get(getFoodPosts)
  .post(upload.array("imageUrls", 5), createFoodPost);
router.route("/ownfood").get(getOwnFoods);
router.route("/:id").get(getFoodPost);
router.route("/:id/request").put(requestFood);
router.route("/accept").put(acceptFood);
router.route("/reject").put(rejectFood);

router
  .route("/ownfood/:id")
  .get(getOwnFood)
  .put(upload.array("imageUrls", 5), updateFoodPost)
  .delete(deleteFoodPost);

router.route("/ownfood/:id/images").delete(deleteFoodPostImages);
module.exports = router;

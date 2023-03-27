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
} = require("../controllers/foodPostController");
const router = express.Router();
const validateToken = require("../middleware/validateTokenHandler");
const upload = require("../middleware/uploadFoodImage");

router.use(validateToken);

router
  .route("/")
  .get(getFoodPosts)
  .post(upload.array("imageUrls", 5), createFoodPost);
router.route("/ownfood").get(getOwnFoods);
router.route("/:id").get(getFoodPost);

router
  .route("/ownfood/:id")
  .get(getOwnFood)
  .put(upload.array("imageUrls", 5), updateFoodPost)
  .delete(deleteFoodPost);

router.route("/ownfood/:id/images").delete(deleteFoodPostImages);
module.exports = router;

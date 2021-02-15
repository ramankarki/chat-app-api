const router = require("express").Router();

const {
  createMessage,
  getAllMessages,
} = require("../controller/messageController");
const auth = require("../controller/auth");

// protected route for creating message
router.use(auth.protect);

router.route("/").post(createMessage).get(getAllMessages);

module.exports = router;

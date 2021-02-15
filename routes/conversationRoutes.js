const router = require("express").Router();

const auth = require("../controller/auth");

const {
  createConversation,
  getMyConversations,
} = require("../controller/conversationController");

router.use(auth.protect);

router.route("/").post(createConversation).get(getMyConversations);

module.exports = router;

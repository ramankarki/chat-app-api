const Conversation = require("../model/Conversation");
const User = require("../model/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

exports.createConversation = catchAsync(async (req, res, next) => {
  if (!req.body.user1 || !req.body.user2)
    return next(
      new AppError(400, "two users are required to create a conversation")
    );

  const user1 = await User.findById(req.body.user1);
  const user2 = await User.findById(req.body.user2);

  if (!user1 || !user2) {
    return next(new AppError(400, "no users found with those user ids !"));
  }

  if (user1.joinedAt > user2.joinedAt) {
    req.body.user1 = user2.id;
    req.body.user2 = user1.id;
  }

  const newConversation = await Conversation.create({
    user1: req.body.user1,
    user2: req.body.user2,
  });

  res.status(201).json({
    status: "success",
    newConversation,
  });
});

exports.getMyConversations = catchAsync(async (req, res, next) => {
  const fromConversation = await Conversation.find({
    user1: req.user.id,
  }).populate("messages");
  const toConversation = await Conversation.find({
    user2: req.user.id,
  }).populate("messages");
  const conversations = [...fromConversation, ...toConversation];

  res.status(200).json({
    status: "success",
    total: conversations.length,
    conversations,
  });
});

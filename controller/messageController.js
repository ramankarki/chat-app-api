const Message = require("../model/Message");
const catchAsync = require("../utils/catchAsync");

exports.createMessage = catchAsync(async (req, res, next) => {
  const message = await Message.create({
    conversation: req.body.conversation,
    user: req.body.user,
    message: req.body.message,
  });

  res.status(201).json({
    status: "success",
    message,
  });
});

exports.getAllMessages = catchAsync(async (req, res, next) => {
  const messages = await Message.find();

  res.status(200).json({
    status: "success",
    total: messages.length,
    messages,
  });
});

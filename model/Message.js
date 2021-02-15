const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.ObjectId,
      ref: "conversations",
      required: [true, "conversation id is required to message"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "users",
      required: [true, "user id required to create message"],
    },
    message: {
      type: String,
      trim: true,
      required: [true, "message body is required"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model("messages", messageSchema);

const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

const conversationSchema = mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.ObjectId,
      ref: "users",
      required: [true, "user1 is required to create conversation"],
    },
    user2: {
      type: mongoose.Schema.ObjectId,
      ref: "users",
      required: [true, "user2 is required to create conversation"],
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

conversationSchema.virtual("messages", {
  ref: "messages",
  foreignField: "conversation",
  localField: "_id",
});

conversationSchema.pre("save", async function (next) {
  const doc = await this.constructor.findOne({
    user1: this.user1,
    user2: this.user2,
  });

  if (doc) {
    return next(
      new AppError(
        400,
        "Already created conversation with these two users, can't create duplicate conversations"
      )
    );
  }

  next();
});

module.exports = mongoose.model("conversations", conversationSchema);

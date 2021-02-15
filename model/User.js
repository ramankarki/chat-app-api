const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, "Email is required"],
    validate: [validator.isEmail, "Email should be valid"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 12,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Confirm Password is required"],
    validate: {
      // this only works on .save, .create
      validator: function (el) {
        return this.password === el;
      },
      message: "Passwords are not the same.",
    },
  },
  logs: {
    lastLogin: Date,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  avatar: Buffer,
  isAccountActive: {
    type: Boolean,
    default: false,
  },
  joinedAt: {
    type: Date,
    default: Date.now(),
  },
  isUserActive: {
    type: Boolean,
    default: false,
  },
});

// document middleware
userSchema.pre("save", async function (next) {
  // only run this function if password modified
  if (!this.isModified("password")) return next();

  // hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // delete confirmPassword data, it will fulfill the condition of required with undefined
  this.confirmPassword = undefined;

  next();
});

// update passwordChangedAt property of document after resetting password
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.logs.passwordChangedAt = Date.now() - 1000;

  next();
});

// query middleware
// userSchema.pre(/^find/, function (next) {
//   this.find({ isAccountActive: true });

//   next();
// });

// instance method
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.logs.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.logs.passwordChangedAt.getTime() / 1000,
      10
    );

    return changedTimeStamp > JWTTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.logs.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const date = new Date();
  let expiryTime = new Date(date.getTime() + 10 * 60 * 1000);

  this.logs.passwordResetExpires = expiryTime;

  return resetToken;
};

module.exports = mongoose.model("users", userSchema);

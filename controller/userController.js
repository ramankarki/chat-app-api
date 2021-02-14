const User = require("../model/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { sendToken } = require("../utils/sendToken");

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const filter =
    process.env.NODE_ENV === "production" ? { isAccountActive: true } : {};
  const users = await User.find(filter);

  res.status(200).json({
    status: "success",
    total: users.length,
    users,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  res.status(200).json({
    status: "success",
    user,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!req.body.currentPassword)
    return next(new AppError(400, "Enter current password"));

  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError(401, "Your current password is wrong."));
  }

  user.password = req.body.newPassword;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  sendToken(user, 200, req, res);
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.user.id);

  res.cookie("jwt", "", {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
  });

  res.status(204).json({
    status: "success",
    message: "user has been successfully deleted !",
  });
});

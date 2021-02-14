const User = require("../model/User");
const catchAsync = require("../utils/catchAsync");

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

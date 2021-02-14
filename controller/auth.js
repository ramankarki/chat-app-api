const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("./../model/User");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/AppError");
const Email = require("../utils/email");
const { sendToken, createToken } = require("../utils/sendToken");

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (user && user.isAccountActive === false) {
    return next(
      new AppError(
        404,
        `User with email ${user.email} already exists but hasn't activated account`
      )
    );
  }

  const newUser = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.password,
    avatar: req.body.avatar,
  });

  const token = createToken(newUser, "1h");

  const url = `${req.protocol}://${req.get(
    "host"
  )}/user/activateAccount/${token}`;
  await new Email(newUser, url).sendActivateAccount();

  res.status(201).json({
    status: "success",
    message: "activate token has been sent in user email",
  });
});

exports.activateAccount = catchAsync(async (req, res, next) => {
  const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);

  const user = await User.findByIdAndUpdate(
    decoded.id,
    {
      isAccountActive: true,
    },
    { new: true }
  );

  sendToken(user, 200, req, res);
});

exports.resendActivationLink = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  const token = createToken(user, "1h");

  const url = `${req.protocol}://${req.get(
    "host"
  )}/user/activateAccount/${token}`;
  await new Email(user, url).sendActivateAccount();

  res.status(201).json({
    status: "success",
    message: "activate token has been sent in user email",
  });
});

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
  try {
    const url = `${req.protocol}://${req.get(
      "host"
    )}/user/activateAccount/${token}`;
    await new Email(newUser, url).sendActivateAccount();

    res.status(201).json({
      status: "success",
      message: "activate token has been sent in user email",
    });
  } catch (err) {
    return next(
      new AppError(
        500,
        "There was an error sending the email. Try again later!"
      )
    );
  }
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
  // check if email entered
  if (!req.body.email)
    return next(new AppError(404, "please enter your email"));

  const user = await User.findOne({ email: req.body.email });

  // check if user exist with that email
  if (!user)
    return next(
      new AppError(404, `user with email ${req.body.email} doesn't exists`)
    );

  try {
    // send url with token in params in email
    const token = createToken(user, "1h");
    const url = `${req.protocol}://${req.get(
      "host"
    )}/user/activateAccount/${token}`;
    await new Email(user, url).sendActivateAccount();

    res.status(200).json({
      status: "success",
      message: "activate token has been sent in user email",
    });
  } catch (err) {
    return next(
      new AppError(
        500,
        "There was an error sending the email. Try again later!"
      )
    );
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if email, password exist in body
  if (!email || !password) {
    return next(new AppError(400, "Please provide email and password"));
  }

  const user = await User.findOne({ email }).select("+password");

  // check if user account is not active
  if (user && user.isAccountActive === false) {
    return next(
      new AppError(
        404,
        `User with email ${user.email} hasn't activated account`
      )
    );
  }

  // check if user exist and password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(401, "Incorrect email or password"));
  }

  sendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "", {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success", message: "user is logged out" });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get user email
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return next(
      new AppError(
        404,
        `There is no user with ${req.body.email} email address.`
      )
    );

  // check if user account is not active
  if (user && user.isAccountActive === false) {
    return next(
      new AppError(
        404,
        `User with email ${user.email} hasn't activated account`
      )
    );
  }

  // generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // send it to the user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendResetPassword();

    res.status(200).json({
      status: "success",
      message: "Reset password Token with url sent to email!",
    });
  } catch (err) {
    user.logs.passwordResetToken = undefined;
    user.logs.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        500,
        "There was an error sending the email. Try again later!"
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  const user = await User.findOne({
    "logs.passwordResetToken": hashedToken,
    "logs.passwordResetExpires": { $gt: Date.now() },
  });

  // if token has not expired, and there is user, set the new password
  if (!user) return next(new AppError(400, "Token is invalid or has expired"));

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.logs.passwordResetToken = undefined;
  user.logs.passwordResetExpires = undefined;
  await user.save();

  // update changedPasswordAt property for the user
  // log the user in, send JWT
  sendToken(user, 200, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // check token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else {
    token = req.cookies.jwt;
  }

  if (!token) return next(new AppError(401, "You are not logged in!"));

  // verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // check if user still exists
  const existUser = await User.findById(decoded.id);
  if (!existUser) {
    return next(new AppError(401, "The user doesn't exist anymore!"));
  }

  // check if user changed password after the token was issued
  if (existUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError(401, "Password has been changed !"));
  }

  // access granted to next middleware
  req.user = existUser;
  next();
});

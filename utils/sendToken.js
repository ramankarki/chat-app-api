const jwt = require("jsonwebtoken");

const signToken = (user, expiresIn) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

exports.sendToken = (user, statusCode, req, res) => {
  const token = signToken(user, process.env.JWT_EXPIRES_IN);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
};

exports.createToken = signToken;

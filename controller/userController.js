const multer = require("multer");
const sharp = require("sharp");

const User = require("../model/User");
const Conversation = require("../model/Conversation");
const Message = require("../model/Message");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { sendToken } = require("../utils/sendToken");

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError(400, "Not an image, please upload an image only."));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("avatar");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `users__${req.user.id}.jpeg`;

  req.file = await sharp(req.file.buffer)
    .resize(400, 400)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toBuffer();

  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.confirmPassword)
    return next(
      new AppError(
        400,
        "This route is not for password updates, Please use /api/v1/users/updatePassword"
      )
    );

  if (req.file) req.body.avatar = req.file;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    user: updatedUser,
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({ isAccountActive: true });

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
  await Message.deleteMany({ user: req.user.id });
  await Conversation.deleteMany({ user1: req.user.id });
  await Conversation.deleteMany({ user2: req.user.id });

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

exports.updateOnlineState = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user.id,
    { isUserActive: req.body.isUserActive },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
  });
});

const router = require("express").Router();

const auth = require("../controller/auth");
const userController = require("../controller/userController");

router.post("/signup", auth.signup);
router.get("/activateAccount/:token", auth.activateAccount);
router.post("/resendActivationLink", auth.resendActivationLink);
router.post("/login", auth.login);
router.get("/logout", auth.logout);

router.post("/forgotPassword", auth.forgotPassword);
router.patch("/resetPassword/:resetToken", auth.resetPassword);

router.post("/updateMe", userController.updateOnlineState);

// all the routes under this route are protected
router.use(auth.protect);

router.get("/", userController.getAllUsers);
router.get("/me", userController.getMe, userController.getUser);
router.patch("/updatePassword", userController.updatePassword);

router.patch(
  "/updateMe",
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);

router.delete("/deleteMe", userController.deleteMe);

router.get("/:id", userController.getUser);

module.exports = router;

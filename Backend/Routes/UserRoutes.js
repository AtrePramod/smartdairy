const express = require("express");
const verifyToken = require("../Middlewares/VerifyToken");
const {
  checkUniqueDname,
  checkUniqueusername,
  userLogin,
  userRegister,
  setupBasicInformation,
  userLogout,
  sendOtp,
  getUserProfile,
  verifySession,
  getmobileSendOtp,
  updatePassword,
} = require("../Controllers/UserController");

const router = express.Router();

// User Routes

router.route("/check/dairyname").post(checkUniqueDname);
router.route("/check/username").post(checkUniqueusername);
router.route("/register").post(userRegister, setupBasicInformation);
router.route("/login").post(userLogin);
router.route("/logout").post(verifyToken, userLogout);
router.route("/verify-session").post(verifyToken, verifySession);
router.route("/profile/info").post(verifyToken, getUserProfile);
router.route("/send/otp").post(sendOtp);
router.route("/get/user/mobile").post(getmobileSendOtp);
router.route("/update/user/password").put(updatePassword);

// Customer Routes
module.exports = router;

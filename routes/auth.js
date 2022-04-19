import express from "express";
import { requireSignIn } from "../middlewares";
import {
  logout,
  register,
  currentUser,
  sendTestEmail,
  login,
  forgotPassword,
  resetPassword,
} from "./../controllers/auth";

const router = express.Router();
router.post("/register", register);
router.get("/logout", logout);
router.get("/current-user", requireSignIn, currentUser);
router.post("/login", login);
router.get("/send-email", sendTestEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
module.exports = router;

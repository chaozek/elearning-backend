import express from "express";
import { isInstructor, requireSignIn } from "../middlewares";
import {
  makeInstructor,
  getAccountStatus,
  currentInstructor,
  instructorCourses,
  studentCount,
  instructorBalance,
  payoutSettings,
} from "./../controllers/instructor";

const router = express.Router();
router.post("/make-instructor", requireSignIn, makeInstructor);
router.post("/get-account-status", requireSignIn, getAccountStatus);
router.get("/current-instructor", requireSignIn, currentInstructor);
router.get(
  "/instructor-courses",
  requireSignIn,
  isInstructor,
  instructorCourses
);
router.post("/instructor/student-count", requireSignIn, studentCount);
router.get("/instructor/balance", requireSignIn, instructorBalance);
router.get("/instructor/payout-settings", requireSignIn, payoutSettings);
module.exports = router;

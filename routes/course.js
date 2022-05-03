import express from "express";
import {
  isInstructor,
  requireSignIn,
  isEnrolled,
  requireCookieToken,
} from "../middlewares/index.js";
import {
  uploadImage,
  removeImage,
  create,
  read,
  uploadVideo,
  removeVideo,
  addLesson,
  update,
  removeLesson,
  updateLesson,
  publishCourse,
  unpublishCourse,
  courses,
  checkEnrollment,
  freeEnrollment,
  paidEnrollment,
  stripeSuccess,
  userCourses,
  markCompleted,
  listCompleted,
  markIncompleted,
  personalizedCourses,
  readLesson,
} from "./../controllers/course.js";
const formidableMiddleware = require("express-formidable");

const router = express.Router();
router.post("/image-upload", uploadImage);
router.post("/remove-image", removeImage);
router.post("/course", requireSignIn, isInstructor, create);
router.get("/courses/:userId", personalizedCourses);
router.get("/courses/", courses);
router.get("/course/:slug", read);
router.put(`/course/:slug`, requireSignIn, isInstructor, update);
router.put(
  "/course/publish/:courseId",
  requireSignIn,
  isInstructor,
  publishCourse
);
router.put(
  "/course/unpublish/:courseId",
  requireSignIn,
  isInstructor,
  unpublishCourse
);
router.put(
  `/course/:slug/:lessonId`,
  requireSignIn,
  isInstructor,
  removeLesson
);
router.post(
  "/course/remove-video/:instructorId",
  requireSignIn,
  isInstructor,
  removeVideo
);
router.post(
  "/course/video-upload/:instructorId",
  requireSignIn,
  isInstructor,
  formidableMiddleware({ maxFileSize: 500 * 1024 * 1024 }),
  uploadVideo
);
router.post(
  "/course/:slug/:instructorId",
  requireSignIn,
  isInstructor,
  addLesson
);
router.put(
  "/course/lesson/:slug/:instructorId",
  requireSignIn,
  isInstructor,
  updateLesson
);
router.get("/check-enrollment/:courseId", requireSignIn, checkEnrollment);
router.post("/free-enrollment/:courseId", requireSignIn, freeEnrollment);
router.post("/paid-enrollment/:courseId", requireSignIn, paidEnrollment);
router.get("/stripe-success/:courseId", requireSignIn, stripeSuccess);
router.get("/user-courses", requireSignIn, requireCookieToken, userCourses);
router.get("/course/user/:slug", requireSignIn, isEnrolled, read);
router.get(
  "/course/user/:courseSlug/:lessonSlug/:lessonId",
  requireSignIn,
  readLesson
);
router.post("/mark-complete", requireSignIn, markCompleted);
router.post("/list-completed", requireSignIn, listCompleted);
router.post("/mark-incompleted", requireSignIn, markIncompleted);

module.exports = router;

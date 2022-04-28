import Course from "../models/course";
import User from "../models/user";

var jwt = require("express-jwt");

export const requireSignIn = jwt({
  getToken: (req, res) => req.cookies.token,
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});
export const requireCookieToken = (req, res, next) => {
  if (!req.cookies.user) {
    return res.sendStatus(403);
  }
  next();
};

export const isInstructor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.role.includes("Instructor")) {
      res.sendStatus(403);
    }
    next();
  } catch (error) {
    console.log(error);
  }
};

export const isEnrolled = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let ids = [];
    const course = await Course.findOne({ slug: req.params.slug });
    for (let i = 0; i < user.courses.length; i++) {
      ids.push(user.courses[i].toString());
    }
    if (!ids.includes(course._id.toString())) {
      res.sendStatus(403);
    }
    next();
  } catch (error) {
    console.log(error);
  }
};

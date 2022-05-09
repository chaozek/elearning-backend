import User from "../models/user";
import queryString from "query-string";
import Course from "../models/course";
import user from "../models/user";
const stripe = require("stripe")(process.env.STRIPE_SECRET);
export const makeInstructor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.stripe_account_id) {
      const account = await stripe.accounts.create({
        type: "standard",
      });
      user.stripe_account_id = account.id;
      user.save();
    }

    let accountLink = await stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: process.env.STRIPE_REDIRECT_URL,
      return_url: process.env.STRIPE_REDIRECT_URL,
      type: "account_onboarding",
    });

    accountLink = Object.assign(accountLink, {
      "stripe_user[email]": user.email,
    });

    res.send(`${accountLink.url}?${queryString.stringify(accountLink)}`);
  } catch (error) {
    console.log(error);
  }
};
export const getAccountStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const account = await stripe.accounts.retrieve(user.stripe_account_id);
    if (/*bug to fix*/ account.charges_enabled) {
      return res.status(401).send("Unauthorized");
    } else {
      const statusUpdated = await User.findByIdAndUpdate(
        user._id,
        {
          stripe_seller: account,
          $addToSet: { role: "Instructor" },
        },
        { new: true }
      );
      statusUpdated.password = undefined;
      res.json(statusUpdated);
    }
  } catch (error) {
    console.log(error);
  }
};
export const currentInstructor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.role.includes("Instructor")) {
      return res.sendStatus(403);
    } else {
      res.json({ ok: true });
    }
  } catch (error) {
    console.log(error);
  }
};
export const instructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(courses);
  } catch (error) {
    console.log(error);
  }
};

export const studentCount = async (req, res) => {
  try {
    const users = await User.find({ courses: req.body.courseId }).select("_id");
    res.json(users);
  } catch (error) {
    console.log(error);
  }
};
export const instructorBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const balance = await stripe.balance.retrieve({
      stripeAccount: user.stripe_account_id,
    });
    res.json(balance);
  } catch (error) {
    console.log(error);
  }
};

export const payoutSettings = async (req, res) => {
  try {
    console.log("HIT");
    const user = await User.findById(req.user._id);
    const userStripeId = user.stripe_seller.id;
    console.log(userStripeId, "IDDDS");
    const loginLink = await stripe.accounts.createLoginLink(
      user.stripe_account_id || userStripeId,
      {
        redirect_url: process.env.STRIPE_SETTINGS_REDIRECT,
      }
    );
    res.json(loginLink.url);
  } catch (error) {
    console.log(error);
  }
};

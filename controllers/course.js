import User from "../models/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AWS from "aws-sdk";
import { nanoid } from "nanoid";
import slugify from "slugify";
import Course from "../models/course";
import { readFileSync } from "fs";
import Completed from "../models/completed";
var mongoose = require("mongoose");

const stripe = require("stripe")(process.env.STRIPE_SECRET);
const client = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  apiVersion: process.env.AWS_API_VERSION,
});
const S3 = new AWS.S3(client);
export const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).send("NO IMAGE");
    }
    const base64Data = new Buffer(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    const type = image.split(";")[0].split("/")[1];
    const params = {
      Bucket: "e-learning23",
      Key: `${nanoid()}.${type}`,
      Body: base64Data,
      ACL: "public-read",
      ContentEncoding: "base64",
      ContentType: `image/${type}`,
    };
    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }
      res.send(data);
    });
  } catch (error) {
    console.log(error);
  }
};

export const removeImage = async (req, res) => {
  try {
    const { image } = req.body;
    const params = {
      Bucket: image.Bucket,
      Key: image.Key,
    };
    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(400);
        return;
      }
      res.send({ ok: true });
    });
  } catch (error) {
    console.log(error);
  }
};
export const create = async (req, res) => {
  try {
    const alreadyExists = await Course.findOne({
      slug: slugify(req.body.name.toLowerCase()),
    });
    if (alreadyExists) return res.status(400).send("Title is Taken");
    const course = await new Course({
      slug: slugify(req.body.name),
      instructor: req.user._id,
      ...req.body,
    });
    course.save();
    res.json(course);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Course failede, try again");
  }
};
export const read = async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug }).populate(
      "instructor",
      "_id name"
    );
    res.json(course);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Course failede, try again");
  }
};
export const readLesson = async (req, res) => {
  try {
    console.log(req.params);
    /*   const course = await Course.findOne({ slug: req.params.slug }).populate(
      "instructor",
      "_id name"
    );
    res.json(course); */
  } catch (error) {
    console.log(error);
    return res.status(400).send("Course failede, try again");
  }
};

export const courses = async (req, res) => {
  try {
    const courses = await Course.find({ published: true }).populate(
      "instructor",
      "_id, name"
    );
    res.json(courses);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Course failede, try again");
  }
};
export const personalizedCourses = async (req, res) => {
  const params = req.params.userId;
  try {
    const courses = await Course.find({ published: true });
    const user = await User.findById(params);
    let updatedCourses = [];
    const intersection = courses.filter((element) => {
      if (user.courses.includes(element._id)) {
        updatedCourses.push({ ...element._doc, bought: true });
      } else {
        updatedCourses.push(element);
      }
    });
    res.json(updatedCourses);

    let newCourses = [];
  } catch (error) {
    console.log(error);
    return res.status(400).send("Course failede, try again");
  }
};

export const uploadVideo = async (req, res) => {
  try {
    if (req.user._id !== req.params.instructorId) {
      res.status(400).send("UNAUTHORIZED");
    }
    const { video } = await req.files;
    if (!video) return res.status(400).send("No video");
    const params = {
      Bucket: "e-learning23",
      Key: `${nanoid()}.${video.type.split("/"[1])}`,
      Body: readFileSync(video.path),
      ACL: "public-read",
      ContentEncoding: video.type,
    };
    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      }
      res.send(data);
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Course failede, try again");
  }
};

export const removeVideo = async (req, res) => {
  try {
    if (req.params.instructorId !== req.user._id) {
      res.status(400).send("UNAUTHORIZED");
    }
    const { video } = req.body;
    const params = {
      Bucket: video.Bucket,
      Key: video.Key,
    };
    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(400);
        return;
      }
      res.send({ ok: true });
    });
  } catch (error) {
    console.log(error);
  }
};

export const addLesson = async (req, res) => {
  try {
    const { slug, instructorId } = req.params;
    const { title, content, video } = req.body;

    if (req.user._id !== instructorId) {
      res.status(400).send("UNAUTHORIZED");
    }
    const updated = await Course.findOneAndUpdate(
      { slug },
      { $push: { lessons: { title, content, video, slug: slugify(title) } } },
      { new: true }
    ).populate("instructor", "_id name");
    res.json(updated);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Course failede, try again");
  }
};

export const update = async (req, res) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug });
    const instructor = course.instructor.toString();
    if (req.user._id !== instructor) {
      return res.status(400).send("Unauthorized");
    }
    const updated = await Course.findOneAndUpdate({ slug }, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Update failed, try again");
  }
};

export const removeLesson = async (req, res) => {
  try {
    const { slug, lessonId } = req.params;
    const course = await Course.findOne({ slug });
    const instructor = course.instructor.toString();
    if (req.user._id !== instructor) {
      return res.status(400).send("Unauthorized");
    }
    const updated = await Course.findByIdAndUpdate(course._id, {
      $pull: { lessons: { _id: lessonId } },
    });
    res.json({ ok: true });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Update failed, try again");
  }
};
export const updateLesson = async (req, res) => {
  try {
    const { slug } = req.params;
    const { _id, title, content, video, free_preview } = req.body.current;
    const course = await Course.findOne({ slug });
    const instructor = course.instructor._id.toString();
    if (instructor !== req.user._id) {
      return res.status(400).send("Unauthorized");
    }
    const updated = await Course.updateOne(
      { "lessons._id": _id },
      {
        $set: {
          "lessons.$.title": title,
          "lessons.$.content": content,
          "lessons.$.video": video,
          "lessons.$.free_preview": free_preview,
        },
      },
      { new: true }
    ).exec();
    res.json({ ok: true });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Update failed, try again");
  }
};

export const publishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select("instructor");
    const instructor = course.instructor.toString();

    if (instructor !== req.user._id) {
      return res.status(400).send("Unauthorized");
    }

    const updated = await Course.findByIdAndUpdate(
      courseId,
      {
        published: true,
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Publish failed, try again");
  }
};

export const unpublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select("instructor");
    const instructor = course.instructor.toString();

    if (instructor !== req.user._id) {
      return res.status(400).send("Unauthorized");
    }
    const updated = await Course.findByIdAndUpdate(
      courseId,
      {
        published: false,
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Unpublish failed, try again");
  }
};
export const checkEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = await User.findById(req.user._id);

    let ids = [];
    let length = user.courses && user.courses.length;
    for (let i = 0; i < length; i++) {
      ids.push(user.courses[i].toString());
    }
    res.json({
      status: ids.includes(courseId),
      course: await Course.findById(courseId).exec(),
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Unpublish failed, try again");
  }
};

export const freeEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select("instructor");
    if (course.paid) {
      res.status(400).send("NOT ALLOWED");
    }
    const result = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { courses: course._id },
      },
      { new: true }
    );
    res.json({
      message: "You have enrolled now",
      course,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Unpublish failed, try again");
  }
};
export const paidEnrollment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate(
      "instructor"
    );

    if (!course.paid) return;

    const fee = (course.price * 30) / 100;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          name: course.name,
          amount: Math.round(course.price.toFixed(2) * 100),
          currency: "usd",
          quantity: 1,
        },
      ],
      success_url: `${process.env.STRIPE_SUCCESS_URL}/${course._id}`,
      cancel_url: `${process.env.STRIPE_CANCEL_URL}/${course._id}`,
    });

    await User.findByIdAndUpdate(req.user._id, { stripeSession: session });

    res.send(session.id);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Paid error");
  }
};

export const stripeSuccess = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate(
      "instructor"
    );
    const user = await User.findById(req.user._id);
    if (!user.stripeSession.id) return res.sendStatus(400);
    const session = await stripe.checkout.sessions.retrieve(
      user.stripeSession.id
    );
    if (session.payment_status === "paid") {
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { courses: course._id },
        $set: { stripeSession: {} },
      });
    }
    res.json({ success: true, course });
  } catch (error) {
    console.log(error);
    return res.json({ success: false });
  }
};
export const userCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const courses = await Course.find({ _id: { $in: user.courses } }).populate(
      "instructor",
      "_id, name"
    );
    res.json(courses);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Course failede, try again");
  }
};
export const markCompleted = async (req, res) => {
  try {
    const { lessonId, courseId } = req.body;
    var id = mongoose.Types.ObjectId(courseId);
    var userIdObj = mongoose.Types.ObjectId(req.user._id);

    const course = await Course.findOne(id);
    const existing = await Completed.findOne({
      user: userIdObj,
      course: id,
    });

    if (existing) {
      const updated = await Completed.findOneAndUpdate(
        {
          user: userIdObj,
          course: id,
        },
        { $addToSet: { lessons: lessonId } }
      ).exec();

      res.json({ ok: true });
    } else {
      const created = await new Completed({
        user: userIdObj,
        course: id,
        lessons: lessonId,
      }).save();
      res.json({ ok: true });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send("Course failede, try again");
  }
};

export const listCompleted = async (req, res) => {
  try {
    console.log("HIT1");
    const list = await Completed.findOne({
      user: req.user._id,
      course: req.body.courseId,
    });
    console.log(list);
    list && res.json(list.lessons);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Course failede, try again");
  }
};

export const markIncompleted = async (req, res) => {
  try {
    const list = await Completed.updateOne(
      {
        user: req.user._id,
        course: req.body.courseId,
      },
      { $pull: { lessons: req.body.lessonId } }
    );
    list && res.json(list.lessons);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Course failede, try again");
  }
};

var mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
var LessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      minlength: 6,
      maxlength: 320,
      required: true,
    },
    slug: { lowercase: true, type: String },
    content: { type: {}, minlength: 200 },
    video: {},
    free_preview: { type: Boolean, default: false },
  },
  { timeStamps: true }
);

module.exports = mongoose.model("Lesson", LessonSchema);

var CourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 6,
      maxlength: 320,
      required: true,
    },
    slug: { lowercase: true, type: String },
    description: { type: {}, minlength: 200, required: true },
    price: {
      type: Number,
      default: 9.99,
    },
    image: {},
    category: String,
    published: { type: Boolean, default: false },
    paid: { type: Boolean, default: true },
    instructor: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    lessons: [LessonSchema],
  },
  { timeStamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);

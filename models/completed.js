var mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
var completedSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: "User" },
    course: { type: ObjectId, ref: "Course" },
    lessons: [],
  },
  { timeStamps: true }
);

module.exports = mongoose.model("Completed", completedSchema);

var mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

var UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    password: { required: true, type: String, min: 6, max: 12 },
    email: { type: String, unique: true, trim: true, required: true },
    image: { type: String, default: "/avatar.png" },
    role: {
      type: [String],
      default: ["Subscriber"],
      enum: ["Subscriber", "Instructor", "Admin"],
    },
    stripe_account_id: "",
    stripe_seller: {},
    stripeSession: {},
    passwordResetCode: {
      data: String,
      default: "",
    },
    courses: [{ type: ObjectId, ref: "Course" }],
  },

  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

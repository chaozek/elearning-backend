import express from "express";
import cors from "cors";
import fs from "fs";
var csrf = require("csurf");
var bodyParser = require("body-parser");
const morgan = require("morgan");
var cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
//db
const URI = process.env.MONGODB_URL;

mongoose
  .connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected!"))
  .catch((err) => console.log(err));

//routes
const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//var parseForm = bodyParser.urlencoded({ extended: false });
var csrfProtection = csrf({ cookie: true });
fs.readdirSync("./routes").map((route) =>
  app.use("/api", require(`./routes/${route}`))
);
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log("SERVER RUNNING" + port);
});

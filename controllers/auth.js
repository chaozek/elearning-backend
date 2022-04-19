import User from "../models/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AWS from "aws-sdk";
import { nanoid } from "nanoid";

const client = new AWS.SES({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  apiVersion: process.env.AWS_API_VERSION,
});

export const register = async (req, res) => {
  try {
    if (!(req.body.email && req.body.password)) {
      return res.status(400).send({ message: "Data not formatted properly" });
    }
    const emailFromDatabase = await User.findOne({ email: req.body.email });
    if (emailFromDatabase) {
      return res.status(400).send({ message: "user exists" });
    }
    // creating a new mongoose doc from user data
    const user = new User(req.body);
    // generate salt to hash password
    const salt = await bcrypt.genSalt(10);
    // now we set user password to hashed password
    user.password = await bcrypt.hash(user.password, salt);
    await user.save().then((doc) => res.status(201).send(doc));
    return;
  } catch (error) {
    console.log(error);
  }
};

export const login = async (req, res) => {
  try {
    const body = req.body;
    const user = await User.findOne({ email: body.email });
    if (user == null) {
      res.json({ error: "User does not exist" });

      return res.status(201).end();
    }
    if (user) {
      const validPassword = await bcrypt.compare(body.password, user.password);
      if (validPassword) {
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "30d",
        });
        res.cookie("token", token, {
          httpOnly: true,
        });
        user.password = undefined;
        res.status(200).json({ user });
      } else {
        return res.status(400).json({ error: "Invalid Password" });
      }
    }
    return;
  } catch {
    res.status(401).json({ error: "User does not exist" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(201).send({ message: "user loged out" });
  } catch (error) {
    res.status(401).json({ error: "server error" });
  }
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      return res.json({ ok: true });
    }
  } catch (error) {
    console.log(error);
  }
};
export const sendTestEmail = async (req, res) => {
  const params = {
    Destination: {
      /* required */
      CcAddresses: [
        "pkaplan1@seznam.cz",
        /* more CC email addresses */
      ],
      ToAddresses: [
        "pkaplan1@seznam.cz",
        /* more To email addresses */
      ],
    },
    Source: process.env.EMAIL_FROM /* required */,
    ReplyToAddresses: process.env.EMAIL_FROM,
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
            <html>
            <h1>Reset Pass</h1>
            <p>Use following link</p>

            </html>
          `,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Reset password",
      },
    },
  };
  const emailSent = client.sendEmail(params).promise();
  emailSent
    .then(() => {
      res.json({ ok: true });
    })
    .catch((err) => {
      console.log(err);
    });
};
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const shortCode = nanoid(6).toUpperCase();
    const user = await User.findOneAndUpdate(
      { email },
      { passwordResetCode: shortCode }
    );
    if (!user) {
      return res.status(400).send("User not found");
    }
    const params = {
      Destination: {
        /* required */
        CcAddresses: [
          "pkaplan1@seznam.cz",
          /* more CC email addresses */
        ],
        ToAddresses: [
          email,
          /* more To email addresses */
        ],
      },
      Source: process.env.EMAIL_FROM /* required */,
      ReplyToAddresses: [process.env.EMAIL_FROM],
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
              <html>
              <h1>Reset Pass</h1>
              <p>Use following link</p>
                <h4>${shortCode}</h4>
              </html>
            `,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Reset password",
        },
      },
    };
    const emailSent = client.sendEmail(params).promise();
    emailSent
      .then((data) => {
        res.json({ ok: true });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, password, code } = req.body;
    const salt = await bcrypt.genSalt(10);
    // now we set user password to hashed password
    const newPassword = await bcrypt.hash(password, salt);
    const user = User.findOneAndUpdate(
      { email, passwordResetCode: code },
      {
        password: newPassword,
        passwordResetCode: "",
      }
    ).exec();

    res.json({ ok: true });
  } catch (err) {
    return res.status(400).send("error, try again");
  }
};

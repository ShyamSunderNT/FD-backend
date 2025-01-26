import User from "../Models/UserModels.js";
import { createTransport } from "nodemailer";
import emailValidator from "email-validator";
import userfeedback from "../Models/FeedbackModels.js";

// Nodemailer transporter setup
const transporter = createTransport({
  host: "smtp.gmail.com",
  service: "gmail",
  auth: {
    user: process.env.Gmail, // Your Gmail address
    pass: process.env.Password, // Gmail app password
  },
});

export const feedback = async (req, res) => {
  const { name, email, feedback } = req.body;
  
  // Validate input fields
  if (!name || !email || !feedback) {
    return res.status(422).json({
      success: false,
      message: "All fields are Required",
    });
  }

  // Validate email format
  if (!emailValidator.validate(email)) {
    return res.status(422).json({
      success: false,
      message: "Please enter a valid email ID",
    });
  }

  try {
    // Check if the user exists in the User collection
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    console.log("Email from request:", email);

    // Return an error if the user is not found
    if (!user) {
      return res.status(422).json({
        success: false,
        message: "Please create an account first, then contact us",
      });
    }

    // Check if feedback already exists for the email
    const existingFeedback = await userfeedback.findOne({ email });
    if (existingFeedback) {
      // Update existing feedback
      await userfeedback.findByIdAndUpdate(
        { _id: existingFeedback._id },
        { feedback },
        { new: true }
      );
    } else {
      // Save new feedback
      const newFeedback = new userfeedback({ name, email, feedback });
      await newFeedback.save();
    }

    // Define mail options for the user
    const mailOptionsToUser = {
      from: process.env.Gmail,
      to: email, // User's email
      subject: `Team Snack's Sprint`,
      text: `Hi ${user.name}, Thank you for your feedback. We will get back to you soon.`,
    };

    // Define mail options for the official email
    const mailOptionsToOfficial = {
      from: process.env.Gmail,
      to: process.env.Gmail, // Official email
      subject: `New Feedback Received`,
      text: `Feedback received from ${name} (${email}):\n\n${feedback}`,
    };

    // Send "Thank You" email to the user
    transporter.sendMail(mailOptionsToUser, (error) => {
      if (error) {
        console.error("Error sending email to user:", error);
        return res.status(400).json({
          success: false,
          message: "Internal Server Error while sending acknowledgment email.",
        });
      }
    });

    // Send feedback email to the official email
    transporter.sendMail(mailOptionsToOfficial, (error) => {
      if (error) {
        console.error("Error sending feedback email to official email:", error);
        return res.status(400).json({
          success: false,
          message: "Internal Server Error while sending feedback email.",
        });
      }
    });

    // Respond with success
    return res.status(200).json({
      success: true,
      message: "Thank you for your feedback. We will get back to you soon.",
    });

  } catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

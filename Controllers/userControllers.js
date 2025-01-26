import multer from "multer";
import bcryptjs from "bcryptjs";
import emailValidator from "email-validator";
import sendMail from "../Middleware/sendMail.js";
import jwt from "jsonwebtoken"
import User from "../Models/userModels.js";



// Setup multer for image upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware for handling image upload
export const uploadMiddleware = upload.single("img");

// Controller for signing up a new user
export const signupUser = async (req, res) => {
  const { name, email, password, confirmPassword, location, phoneNumber } = req.body;
  const imgBuffer = req.file?.buffer; // Safely get the image data as a Buffer

  // Validate input fields
  if (!name || !email || !password || !confirmPassword || !location || !phoneNumber || !imgBuffer) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  // Check if password and confirm password match
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match. Please ensure they are the same.",
    });
  }

  // Validate name length
  if (name.length < 3 || name.length > 20) {
    return res.status(400).json({
      success: false,
      message: "Name must be between 3 and 20 characters.",
    });
  }

  // Validate password length
  if (password.length < 8 || password.length > 12) {
    return res.status(400).json({
      success: false,
      message: "Password must be between 8 and 12 characters.",
    });
  }

  // Validate location length
  if (location.length < 3) {
    return res.status(400).json({
      success: false,
      message: "Address must be at least 3 characters.",
    });
  }

  // Validate email format
  if (!emailValidator.validate(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email.",
    });
  }

  // Hash the password
  const hashedPassword = await bcryptjs.hash(password, 10);
  console.log("Hashed Password:", hashedPassword);

  try {
    // Create a new user and save to the database
    const user = new User({
      name,
      email,
      password: hashedPassword,
      location,
      phoneNumber,
      img: {
        data: imgBuffer,
        contentType: req.file.mimetype,
      },
    });
    console.log("User before saving:", user);

    const result = await user.save();
    console.log("Saved user:", result);
     
    const authToken = jwt.sign(
        { userId: user._id, email: result.email },  // Payload
        process.env.JWT_SECRET_KEY,  // JWT secret from environment variables
  
      );
      console.log("Generated Token:", authToken);
    // Send the response to the frontend
    res.status(201).json({
      success: true,
      message: "Registration successful.",
      result,
      authToken, 
    });
  } catch (err) {
    // Handle duplicate entry error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "An account already exists with this email or phone number.",
      });
    }
    // Handle other errors
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
      

  export const loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    // Validate input fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }
  
    try {
      // Find the user by email
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid email or password.",
        });
      }
  
      // Log the user's password and the provided password
      console.log("Stored Password (user.password):", user.password);
      console.log("Provided Password:", password);
  
      // Check if the user's password exists
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: "User does not have a password set.",
        });
      }
  
      // Compare the password with the hashed password in the database
      const isPasswordValid = await bcryptjs.compare(password, user.password);
  
      // Log the result of the comparison
      console.log("Password Match Result:", isPasswordValid);
  
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid email or password.",
        });
      }
      
      // Generate JWT token
      const authToken = jwt.sign(
        { _id: user._id, email: user.email },
        process.env.JWT_SECRET_KEY,
      );
  
      // Send the token in the response
      res.status(200).json({
        success: true,
        message: "Login successful.",
        authToken, 
      });
    } catch (err) {
      console.error("Error during login:", err);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: err.message,
      });
    }
  };

  export const requestLoginOtp = async (req, res) => {
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }
  
    try {
      // Find the user by email
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found. Please register first.",
        });
      }
  
      // Generate a random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
  
      // Set OTP and expiry (e.g., valid for 5 minutes)
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes
      await user.save();
  
      // Send OTP via email
      await sendMail(email, "Your Login OTP", `Your OTP is: ${otp}`);
  
      return res.status(200).json({
        success: true,
        message: "OTP sent to your email. Please check your inbox.",
      });
    } catch (err) {
      console.error("Error during OTP request:", err);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: err.message,
      });
    }
  };
  
  // Step 2: Verify OTP and Login
  export const loginWithOtp = async (req, res) => {
    const { email, otp } = req.body;
  
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }
  
    try {
      // Find the user by email
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }
  
      // Check if OTP exists and is valid
      if (!user.otp || user.otpExpiry < new Date()) {
        return res.status(400).json({
          success: false,
          message: "OTP is invalid or has expired. Please request a new OTP.",
        });
      }
  
      // Verify OTP
      if (user.otp.toString() !== otp.trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP. Please try again.",
        });
      }
  
      // Clear OTP after successful verification
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
  
      // Generate a JWT token
      const token = jwt.sign(
        { _id: user._id, email: user.email },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1h" } // Adjust as needed
      );
  
      return res.status(200).json({
        success: true,
        message: "Login successful.",
        token,
      });
    } catch (err) {
      console.error("Error during OTP login:", err);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: err.message,
      });
    }
  };
  

  export const forgotPassword =async (req, res) => {
    const { email, newPassword } = req.body;
  
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required.",
      });
    }
  
    if (newPassword.length < 8 || newPassword.length > 12) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 12 characters.",
      });
    }
  
    try {
      // Find the user by email
      const user = await User.findOne({ email }).select("+password");
  
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "No account found with this email.",
        });
      }
  
      // Compare the new password with the old password
      const isSamePassword = await bcryptjs.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: "Please enter a password that is different from your current one.",
        });
      }
  
      // Hash the new password
      const hashedPassword = await bcryptjs.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
  
      res.status(200).json({
        success: true,
        message: "Password updated successfully.",
      });
    } catch (err) {
      console.error("Error during password reset:", err);
      res.status(500).json({
        success: false,
        message: "Internal Server Error.",
      });
    }
  };
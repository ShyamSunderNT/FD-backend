import axios from "axios";
import User from "../Models/UserModels.js";
import bcryptjs from "bcryptjs";


export const getUserDetails = async (req, res) => {
    const { email } = req.body;  // Use query parameters (or req.params if URL has it)
  
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }
  
    try {
      // Find the user by email and select the necessary fields
      const user = await User.findOne({ email }).select("+name +location +phoneNumber +img");
  
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Account does not exist with this email ID. Please continue to register.",
        });
      }
  
      // Convert the binary image data to base64 string
      const userImage = user.img
        ? {
            contentType: user.img.contentType,
            data: user.img.data.toString("base64"),
          }
        : null; // Handle the case where user has no image
  
      // Send the user details in the response
      res.status(200).json({
        success: true,
        message: "Fetch user details successful",
        userAddress: user.location,
        userName: user.name,
        userPhoneNumber: user.phoneNumber,
        userImage: userImage,
      });
    } catch (err) {
      console.error("Error fetching user details:", err);  // Log the error for debugging
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
        error: err.message,  // Send the error message for debugging
      });
    }
  };


  export const updatePhoneNumber = async (req, res) => {
    const { email, newPhoneNumber } = req.body;
  
    if (!newPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }
  
    // Validate phone number format using a regex (matches 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(newPhoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be 10 digits",
      });
    }
  
    try {
      // Find user by email
      const user = await User.findOne({ email }).exec();
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found with this email.",
        });
      }
  
      // Check if the new phone number is already taken by another user
      const existingUserWithPhone = await User.findOne({ phoneNumber: newPhoneNumber }).exec();
      if (existingUserWithPhone) {
        return res.status(400).json({
          success: false,
          message:
            "The entered phone number already exists. Please choose a different phone number",
        });
      }
  
      // Update phone number
      user.phoneNumber = newPhoneNumber;
      await user.save();
  
      return res.status(200).json({
        success: true,
        message: "Phone number updated successfully",
      });
    } catch (err) {
      console.error("Error updating phone number:", err); // Log the error for debugging
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: err.message, // Send the error message for debugging
      });
    }
  };

  export const updateAddress = async (req, res) => {
    const { email, newAddress } = req.body;
  
    // Check if the email and address fields are provided
    if (!email || !newAddress) {
      return res.status(422).json({
        success: false,
        message: "Please provide both email and new address",
      });
    }
  
    try {
      // Find the user by email and ensure location is accessible (selecting 'location')
      const user = await User.findOne({ email }).select("+location");
  
      // If user doesn't exist
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found with this email",
        });
      }
  
      // Check if the new address is the same as the current address
      if (user.location === newAddress) {
        return res.status(400).json({
          success: false,
          message: "The entered address already exists. Please enter a different address",
        });
      }
  
      // Update the address
      user.location = newAddress;
      await user.save();
  
      // Success response
      return res.status(200).json({
        success: true,
        message: "Address updated successfully",
      });
    } catch (err) {
      // Handle any other errors
      console.error("Error during address update:", err); // Log the error for debugging
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: err.message, // Send the actual error message for debugging
      });
    }
  };

  export const getLocation = async (req, res) => {
    try {
      const { lat, long } = req.body.latlong;  // Destructure the latitude and longitude
  
      console.log("Latitude:", lat, "Longitude:", long);
  
      // Call the geocode API to get location information
      const response = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${long}&key=70e8f4aca68746f4a0482f3b15642abe`
      );
  
      // Check if the response contains results
      if (response.data.results.length > 0) {
        const { town, country, state_district, state, postcode } = response.data.results[0].components;
  
        const location = `${town}, ${state_district}, ${state}, ${country}, ${postcode}`;
  
        // Send the location as the response
        return res.status(200).send({ location });
      } else {
        return res.status(404).send({ message: "Location not found for the provided coordinates" });
      }
    } catch (error) {
      console.error("Error in getLocation:", error.message);
      return res.status(500).send({ message: "Server Error" });
    }
  };


  export const deleteUser = async (req, res) => {
    const { email, password } = req.body;
  
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }
  
    try {
      // Find user by email and include the password field
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      // Compare provided password with stored hashed password
      const isPasswordValid = await bcryptjs.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
  
      // Delete user account
      await User.findByIdAndDelete(user._id);
  
      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user:", error.message);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
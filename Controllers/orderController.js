import Order from "../Models/orderModels.js";
import nodemailer from "nodemailer";

export const OrderData  = async (req, res) => {
    try {
      const data = req.body.order_data;
      data.unshift({ Order_date: req.body.order_date }); // Add order date to the start of the array
  
      const email = req.body.email;
  
      // Check if the email already exists in the database
      const existingOrder = await Order.findOne({ email });
  
      if (!existingOrder) {
        // If the email doesn't exist, create a new order
        await Order.create({
          email,
          order_data: [data],
        });
  
        return res.status(201).json({ success: true, message: "Order created successfully" });
      } else {
        // If the email exists, update the existing order with new data
        await Order.findOneAndUpdate(
          { email },
          { $push: { order_data: data } }
        );
  
        return res.status(200).json({ success: true, message: "Order updated successfully" });
      }
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  };



  export const myOrderData = async (req, res) => {
    try {
      const { email: userEmail } = req.body;
      console.log(req.body);
  
      // Validate email
      if (!userEmail) {
        return res.status(400).json({
          success: false,
          message: "Email not provided in the request body",
        });
      }
  
      // Fetch order data
      const orderData = await Order.findOne({ email: userEmail });
  
      // Check if order data exists for the email
      if (!orderData) {
        return res.status(404).json({
          success: false,
          message: "Order data not found for the provided email",
        });
      }
  
      // Respond with the order data
      return res.status(200).json({
        success: true,
        message: "Order data retrieved successfully",
        data: orderData,
      });
    } catch (error) {
      console.error("Error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };


  export const removeOrder = async (req, res) => {
    const { email } = req.body;
  
    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
  
    try {
      // Find orders associated with the email
      const userOrders = await Order.findOne({ email });
      if (!userOrders) {
        return res.status(404).json({
          success: false,
          message: "No orders found for the provided email",
        });
      }
  
      // Delete the user's orders
      await Order.findByIdAndDelete(userOrders._id);
  
      return res.status(200).json({
        success: true,
        message: "Orders deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting orders:", error.message);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
  

  export const confirmPayment = async (req, res) => {
    const { email, paidAmount } = req.body;
  
    // Validate input
    if (!email || !paidAmount) {
      return res.status(400).json({
        success: false,
        message: "Email and paid amount are required",
      });
    }
  
    try {
      // Fetch the user's order data
      const order = await Order.findOne({ email });
  
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "No orders found for the provided email",
        });
      }
  
      // Add payment details (optional: log payments in order history)
      const paymentDetails = {
        paidAmount,
        paidDate: new Date(),
      };
  
      // Update the order with payment confirmation
      await Order.findOneAndUpdate(
        { email },
        { $push: { payments: paymentDetails } }
      );
  
      // Configure Nodemailer for sending email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.Gmail,
          pass: process.env.Password,
        },
      });
  
      // Email content
      const mailOptions = {
        from: process.env.Gmail,
        to: email,
        subject: "Payment Confirmation",
        text: `Dear Customer, 
  
  Your payment of ₹${paidAmount} has been received successfully.
  
  Thank you for your purchase!
  
  Best regards,
  Snack's Sprint`,
      };
  
      // Send the email
      await transporter.sendMail(mailOptions);
  
      return res.status(200).json({
        success: true,
        message: "Payment confirmed and email sent successfully",
      });
    } catch (error) {
      console.error("Error confirming payment:", error.message);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import connectDB from './Database/config.js';
import userRouter from "./Routers/userRouter.js"
import orderRouter from "./Routers/orderRouter.js"

dotenv.config();

const app = express();

app.use(
    cors({
      origin: "*",
      credentials: true,
    })
  );
  

app.use(express.json());



app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
    });
  });

  connectDB();

  // Routes
  app.use("/api/user", userRouter);
  app.use('/api/user', orderRouter)


  app.get("/", (req, res) => {
    res.send("Welcome to the api");
  });


  app.listen(process.env.PORT, () => {
    console.log("Server is running on port");
  });
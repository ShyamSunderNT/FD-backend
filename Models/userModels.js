import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true,
        unique: true,
    },
    email :{
        type: String,
        required: true,
        unique: true,
        match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    },
    password :{
        type: String,
        required: true,
        minlength: 8,
    },
    location: {
        type: String,
        required: true,
      },
      phoneNumber :{
        type: String,
        required: true,
        unique: true,
        match: /^\+?\d{1,15}$/
      },
      img: {
        data: Buffer,
        contentType: String,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      otp : {
        type: Number,
        default: null,
      },
      otpExpiry: { type: Date },
  
},
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);
export default User;
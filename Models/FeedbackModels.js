import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
      },
      feedback: {
        type: String,
        required: true,
        trim: true,
      },

},
{
    timestamps: true,
},
);

const userfeedback = mongoose.model("userfeedback", feedbackSchema);

export default userfeedback;
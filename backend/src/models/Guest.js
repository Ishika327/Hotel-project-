import mongoose from "mongoose";

const guestSchema = new mongoose.Schema(
  {
    stay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stay",
      required: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    age: Number,

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    phoneNumber: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      trim: true,
    },

    citizenshipIdNumber: {
      type: String,
      trim: true,
    },

    idProofUrl: {
      type: String,
      trim: true,
    },

    relationship: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Guest", guestSchema);

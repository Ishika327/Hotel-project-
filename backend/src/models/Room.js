import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    roomType: {
      type: String,
      enum: ["Single", "Double", "Deluxe", "Suite"],
      required: true,
    },
    pricePerNight: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Available", "Occupied", "Cleaning"],
      default: "Available",
    },
    floor: { type: String, trim: true },
    amenities: [{ type: String }],
  },
  { timestamps: true },
);

export default mongoose.model("Room", roomSchema);

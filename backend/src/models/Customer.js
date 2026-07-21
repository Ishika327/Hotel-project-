import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    citizenshipIdNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    notes: { type: String, trim: true },
    idProofUrl: { type: String, trim: true },
    totalSpent: { type: Number, default: 0 },
    lastVisitAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("Customer", customerSchema);

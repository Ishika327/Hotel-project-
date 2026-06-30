import mongoose from "mongoose";

const staySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    actualCheckOutAt: { type: Date },
    guests: { type: Number, required: true, min: 1 },
    stayNotes: { type: String, trim: true },
    roomCharges: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
    },
    amountPaid: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },
    paidStatus: {
      type: String,
      enum: ["Paid", "Unpaid", "Partial"],
      default: "Unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "Bank Transfer", "Mobile Money", "Other"],
      default: "Cash",
    },
    stayStatus: {
      type: String,
      enum: ["Reserved", "CheckedIn", "CheckedOut", "Cancelled"],
      default: "CheckedIn",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Stay", staySchema);

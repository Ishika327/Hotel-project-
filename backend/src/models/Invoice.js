import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    stay: { type: mongoose.Schema.Types.ObjectId, ref: "Stay", required: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    roomCharges: { type: Number, required: true },
    expenseTotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
    },
    paidAmount: { type: Number, default: 0 },
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
    paidAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("Invoice", invoiceSchema);

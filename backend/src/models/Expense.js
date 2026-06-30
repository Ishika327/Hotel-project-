import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    stay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stay",
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    expenseType: {
      type: String,
      enum: ["Food", "Drinks", "Laundry", "Room Service", "Other"],
      required: true,
    },
    description: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

expenseSchema.pre("validate", function validateTotal(next) {
  this.total = Number(this.quantity || 0) * Number(this.price || 0);
  next();
});

export default mongoose.model("Expense", expenseSchema);

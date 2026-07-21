import mongoose from "mongoose";

const staySchema = new mongoose.Schema(
  {
    // Primary Guest
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    additionalGuests: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    ],
    // Additional Guests
    guestList: [
      {
        fullName: {
          type: String,
          trim: true,
          required: true,
        },

        gender: {
          type: String,
          enum: ["Male", "Female", "Other"],
          default: "Male",
        },

        age: Number,

        phoneNumber: {
          type: String,
          trim: true,
        },

        citizenshipIdNumber: {
          type: String,
          trim: true,
        },

        address: {
          type: String,
          trim: true,
        },

        relation: {
          type: String,
          trim: true,
        },
      },
    ],

    // Assigned Room
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    // Employee who checked in the guest
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    // Stay Dates
    checkInDate: {
      type: Date,
      required: true,
    },

    checkOutDate: {
      type: Date,
      required: true,
    },

    actualCheckOutAt: {
      type: Date,
    },

    // Total Guests (Primary + Additional)
    guests: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    // Notes
    stayNotes: {
      type: String,
      trim: true,
    },

    // Billing
    roomCharges: {
      type: Number,
      default: 0,
    },

    totalExpenses: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    // Payment
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
    },

    amountPaid: {
      type: Number,
      default: 0,
    },

    remainingBalance: {
      type: Number,
      default: 0,
    },

    paidStatus: {
      type: String,
      enum: ["Paid", "Partial", "Unpaid"],
      default: "Unpaid",
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "Bank Transfer", "Mobile Money", "Other"],
      default: "Cash",
    },

    // Stay Status
    stayStatus: {
      type: String,
      enum: ["Reserved", "CheckedIn", "CheckedOut", "Cancelled"],
      default: "CheckedIn",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Stay", staySchema);

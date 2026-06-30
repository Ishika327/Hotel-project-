import Customer from "../models/Customer.js";
import Stay from "../models/Stay.js";
import Expense from "../models/Expense.js";
import Invoice from "../models/Invoice.js";
import Room from "../models/Room.js";
import asyncHandler from "../utils/asyncHandler.js";

export const searchHistory = asyncHandler(async (req, res) => {
  const { phoneNumber, name, roomNumber } = req.query;
  const customerFilter = {};
  if (phoneNumber) customerFilter.phoneNumber = phoneNumber.replace(/\D/g, "");
  if (name) customerFilter.fullName = { $regex: name, $options: "i" };

  const customer = await Customer.findOne(customerFilter);
  let room = null;
  if (roomNumber) {
    room = await Room.findOne({ roomNumber });
  }

  const stayFilter = {};
  if (customer) stayFilter.customer = customer._id;
  if (room) stayFilter.room = room._id;

  const [stays, expenses, invoices] = await Promise.all([
    Stay.find(stayFilter)
      .populate("customer room employee")
      .sort({ createdAt: -1 }),
    customer
      ? Expense.find({ customer: customer._id }).sort({ createdAt: -1 })
      : [],
    customer
      ? Invoice.find({ customer: customer._id }).sort({ createdAt: -1 })
      : [],
  ]);

  const totalSpending = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.totalAmount || 0),
    0,
  );

  res.json({
    customer,
    room,
    stays,
    expenses,
    invoices,
    totalSpending,
    totalVisits: stays.length,
  });
});

import Customer from "../models/Customer.js";
import Room from "../models/Room.js";
import Stay from "../models/Stay.js";
import Invoice from "../models/Invoice.js";
import Expense from "../models/Expense.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getDashboardSummary = asyncHandler(async (_req, res) => {
  const [customers, rooms, activeStays, paidInvoices, expenses] =
    await Promise.all([
      Customer.countDocuments(),
      Room.find(),
      Stay.find({ stayStatus: "CheckedIn" })
        .populate("customer room")
        .sort({ createdAt: -1 }),
      Invoice.find({ paidStatus: "Paid" }),
      Expense.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("customer room stay"),
    ]);

  const totalEarnings = paidInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.totalAmount || 0),
    0,
  );
  const occupiedRooms = rooms.filter(
    (room) => room.status === "Occupied",
  ).length;
  const availableRooms = rooms.filter(
    (room) => room.status === "Available",
  ).length;

  res.json({
    summary: {
      totalCustomers: customers,
      occupiedRooms,
      availableRooms,
      totalEarnings,
      activeCheckIns: activeStays.length,
    },
    activeStays,
    recentExpenses: expenses,
  });
});

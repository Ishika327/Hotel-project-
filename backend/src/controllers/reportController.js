import Invoice from "../models/Invoice.js";
import Room from "../models/Room.js";
import Stay from "../models/Stay.js";
import asyncHandler from "../utils/asyncHandler.js";

const sumRevenue = (invoices, start, end) =>
  invoices.reduce((sum, invoice) => {
    const paidAt = invoice.paidAt ? new Date(invoice.paidAt) : null;
    if (!paidAt || paidAt < start || paidAt >= end) return sum;
    return sum + Number(invoice.totalAmount || 0);
  }, 0);

export const dailyRevenue = asyncHandler(async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const dayStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dayEnd = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
  );
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const yearEnd = new Date(date.getFullYear() + 1, 0, 1);

  const invoices = await Invoice.find({
    paidAt: { $gte: yearStart, $lt: yearEnd },
    paidStatus: "Paid",
  }).populate("customer room");
  const dayRevenue = sumRevenue(invoices, dayStart, dayEnd);
  const monthRevenue = sumRevenue(invoices, monthStart, monthEnd);
  const yearRevenue = sumRevenue(invoices, yearStart, yearEnd);

  res.json({
    date: dayStart,
    dailyRevenue: dayRevenue,
    monthlyRevenue: monthRevenue,
    yearlyRevenue: yearRevenue,
    totalRevenue: dayRevenue,
    invoices,
  });
});

export const occupancyReport = asyncHandler(async (_req, res) => {
  const [rooms, stays] = await Promise.all([
    Room.find(),
    Stay.find({ stayStatus: "CheckedIn" }).populate("customer room"),
  ]);

  const occupied = rooms.filter((room) => room.status === "Occupied").length;
  const available = rooms.filter((room) => room.status === "Available").length;

  res.json({
    totalRooms: rooms.length,
    occupied,
    available,
    occupancyRate: rooms.length
      ? Math.round((occupied / rooms.length) * 100)
      : 0,
    activeStays: stays,
  });
});

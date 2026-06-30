import Expense from "../models/Expense.js";
import Stay from "../models/Stay.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const addExpense = asyncHandler(async (req, res, next) => {
  const {
    stayId,
    customerId,
    roomId,
    expenseType,
    description,
    quantity,
    price,
    occurredAt,
  } = req.body;
  const addedBy = req.user?._id || req.body.addedBy;
  if (!addedBy) {
    return next(new ApiError(400, "Added by user is required"));
  }
  const stay = await Stay.findById(stayId);

  if (!stay) {
    return next(new ApiError(404, "Stay not found"));
  }

  const expense = await Expense.create({
    stay: stayId,
    customer: customerId,
    room: roomId,
    addedBy,
    expenseType,
    description,
    quantity,
    price,
    occurredAt,
  });

  stay.totalExpenses =
    Number(stay.totalExpenses || 0) + Number(expense.total || 0);
  stay.totalAmount =
    Number(stay.roomCharges || 0) + Number(stay.totalExpenses || 0);
  await stay.save();

  res.status(201).json({ expense });
});

export const listExpenses = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.stayId) filter.stay = req.query.stayId;
  if (req.query.customerId) filter.customer = req.query.customerId;
  const expenses = await Expense.find(filter)
    .populate("stay customer room addedBy")
    .sort({ occurredAt: -1 });
  res.json({ expenses });
});

export const deleteExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    return next(new ApiError(404, "Expense not found"));
  }

  const stay = await Stay.findById(expense.stay);
  if (!stay) {
    await expense.deleteOne();
    return res.json({ message: "Expense removed" });
  }

  await expense.deleteOne();

  const remainingExpenses = await Expense.find({ stay: stay._id });
  const expenseTotal = remainingExpenses.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0,
  );

  stay.totalExpenses = expenseTotal;
  stay.totalAmount = Number(stay.roomCharges || 0) + expenseTotal;
  await stay.save();

  res.json({
    message: "Expense removed",
    stay,
  });
});

export const updateExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    return next(new ApiError(404, "Expense not found"));
  }

  const stay = await Stay.findById(expense.stay);
  if (!stay) {
    return next(new ApiError(404, "Stay not found"));
  }

  if (req.body.quantity !== undefined) {
    expense.quantity = Math.max(1, Number(req.body.quantity || 1));
  }
  if (req.body.price !== undefined) {
    expense.price = Math.max(0, Number(req.body.price || 0));
  }
  if (req.body.description !== undefined) {
    expense.description = req.body.description;
  }
  if (req.body.expenseType !== undefined) {
    expense.expenseType = req.body.expenseType;
  }
  if (req.body.occurredAt !== undefined) {
    expense.occurredAt = req.body.occurredAt;
  }

  await expense.save();

  const remainingExpenses = await Expense.find({ stay: stay._id });
  const expenseTotal = remainingExpenses.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0,
  );

  stay.totalExpenses = expenseTotal;
  stay.totalAmount = Number(stay.roomCharges || 0) + expenseTotal;
  await stay.save();

  res.json({ expense, stay });
});

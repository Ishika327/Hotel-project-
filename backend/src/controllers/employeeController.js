import bcrypt from "bcryptjs";
import Employee from "../models/Employee.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const listEmployees = asyncHandler(async (_req, res) => {
  const employees = await Employee.find()
    .select("-password")
    .sort({ createdAt: -1 });
  res.json({ employees });
});

export const createEmployee = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, role = "receptionist" } = req.body;
  const existing = await Employee.findOne({
    email: String(email).toLowerCase().trim(),
  });
  if (existing) {
    return next(new ApiError(400, "Employee already exists"));
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const employee = await Employee.create({
    fullName,
    email: String(email).toLowerCase().trim(),
    password: hashedPassword,
    role,
  });

  res
    .status(201)
    .json({ employee: { id: employee._id, fullName, email, role } });
});

export const updateEmployee = asyncHandler(async (req, res, next) => {
  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 12);
  }

  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  }).select("-password");
  if (!employee) {
    return next(new ApiError(404, "Employee not found"));
  }

  res.json({ employee });
});

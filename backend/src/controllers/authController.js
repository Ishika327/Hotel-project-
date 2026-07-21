import bcrypt from "bcryptjs";
import Employee from "../models/Employee.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { signToken } from "../utils/token.js";

const toPublicEmployee = (employee) => ({
  id: employee._id,
  fullName: employee.fullName,
  email: employee.email,
  role: employee.role,
  isActive: employee.isActive,
  lastLoginAt: employee.lastLoginAt,
  createdAt: employee.createdAt,
  updatedAt: employee.updatedAt,
});

const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const employee = await Employee.findOne({
    email: normalizeEmail(email),
  }).select("+password");

  console.log("Email entered:", email);
  console.log("Employee found:", employee);

  if (!employee || !employee.isActive) {
    return next(new ApiError(401, "Invalid credentials"));
  }

  const validPassword = await bcrypt.compare(password, employee.password);

  console.log("Password valid:", validPassword);

  if (!validPassword) {
    return next(new ApiError(401, "Invalid credentials"));
  }

  employee.lastLoginAt = new Date();
  await employee.save();

  const token = signToken(employee);
  res.json({ token, employee: toPublicEmployee(employee) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ employee: req.user });
});

export const updateProfile = asyncHandler(async (req, res, next) => {
  const employeeId = req.user?._id || req.user?.id;
  const email = normalizeEmail(req.body.email || req.body.newEmail);
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");
  const confirmPassword = String(req.body.confirmPassword || "");

  if (!email && !newPassword) {
    return next(new ApiError(400, "No changes provided"));
  }

  const employee = await Employee.findById(employeeId).select("+password");
  if (!employee) {
    return next(new ApiError(401, "Employee not found"));
  }

  let shouldSave = false;

  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return next(new ApiError(400, "A valid email is required"));
    }

    const existingEmployee = await Employee.findOne({
      email,
      _id: { $ne: employee._id },
    });

    if (existingEmployee) {
      return next(new ApiError(409, "Email already in use"));
    }

    employee.email = email;
    shouldSave = true;
  }

  if (newPassword) {
    if (!currentPassword) {
      return next(new ApiError(400, "Current password is required"));
    }

    const validPassword = await bcrypt.compare(
      currentPassword,
      employee.password,
    );
    if (!validPassword) {
      return next(new ApiError(400, "Current password is incorrect"));
    }

    if (newPassword.length < 8) {
      return next(
        new ApiError(400, "New password must be at least 8 characters"),
      );
    }

    if (newPassword !== confirmPassword) {
      return next(new ApiError(400, "Passwords do not match"));
    }

    employee.password = await bcrypt.hash(newPassword, 10);
    shouldSave = true;
  }

  if (!shouldSave) {
    return next(new ApiError(400, "No changes provided"));
  }

  await employee.save();

  const updatedEmployee = await Employee.findById(employee._id).select(
    "-password",
  );
  res.json({
    message: "Credentials updated successfully",
    employee: toPublicEmployee(updatedEmployee),
  });
});

export const updateCredentials = updateProfile;

export const logout = asyncHandler(async (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

export const seedAdmin = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, role = "admin" } = req.body;
  const existing = await Employee.findOne({
    email: normalizeEmail(email),
  });
  if (existing) {
    return next(new ApiError(400, "Employee already exists"));
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const employee = await Employee.create({
    fullName,
    email: normalizeEmail(email),
    password: hashedPassword,
    role,
  });

  res.status(201).json({ employee: toPublicEmployee(employee) });
});

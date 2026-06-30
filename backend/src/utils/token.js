import jwt from "jsonwebtoken";

export const signToken = (employee) =>
  jwt.sign(
    {
      employeeId: employee._id.toString(),
      role: employee.role,
      fullName: employee.fullName,
      email: employee.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );

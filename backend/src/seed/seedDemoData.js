import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import Employee from "../models/Employee.js";
import Room from "../models/Room.js";
import Customer from "../models/Customer.js";
import Stay from "../models/Stay.js";
import Expense from "../models/Expense.js";
import Invoice from "../models/Invoice.js";

dotenv.config();

const seed = async () => {
  await connectDB();
  await Promise.all([
    Employee.deleteMany(),
    Room.deleteMany(),
    Customer.deleteMany(),
    Stay.deleteMany(),
    Expense.deleteMany(),
    Invoice.deleteMany(),
  ]);

  const password = await bcrypt.hash("Hotel@12345", 12);
  const admin = await Employee.create({
    fullName: "Admin User",
    email: "admin@hotel.local",
    password,
    role: "admin",
  });

  const receptionist = await Employee.create({
    fullName: "Front Desk User",
    email: "reception@hotel.local",
    password,
    role: "receptionist",
  });

  const rooms = await Room.insertMany([
    {
      roomNumber: "101",
      roomType: "Single",
      pricePerNight: 80,
      status: "Available",
    },
    {
      roomNumber: "102",
      roomType: "Double",
      pricePerNight: 120,
      status: "Occupied",
    },
    {
      roomNumber: "201",
      roomType: "Deluxe",
      pricePerNight: 180,
      status: "Cleaning",
    },
    {
      roomNumber: "301",
      roomType: "Suite",
      pricePerNight: 300,
      status: "Available",
    },
  ]);

  const customer = await Customer.create({
    fullName: "John Carter",
    phoneNumber: "15551234567",
    address: "42 Ocean View, Miami",
    citizenshipIdNumber: "ID-558899",
    lastVisitAt: new Date(),
  });

  const stay = await Stay.create({
    customer: customer._id,
    room: rooms[1]._id,
    employee: admin._id,
    checkInDate: new Date(),
    checkOutDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    guests: 2,
    roomCharges: 360,
    totalExpenses: 45,
    totalAmount: 405,
    paidStatus: "Partial",
    paymentMethod: "Cash",
    stayStatus: "CheckedIn",
  });

  await Expense.create({
    stay: stay._id,
    customer: customer._id,
    room: rooms[1]._id,
    addedBy: receptionist._id,
    expenseType: "Food",
    description: "Breakfast buffet",
    quantity: 3,
    price: 15,
    total: 45,
  });

  await Invoice.create({
    invoiceNumber: `INV-SEED-${Date.now()}`,
    stay: stay._id,
    customer: customer._id,
    room: rooms[1]._id,
    generatedBy: admin._id,
    roomCharges: 360,
    expenseTotal: 45,
    totalAmount: 405,
    paidStatus: "Partial",
    paymentMethod: "Cash",
  });

  console.log(
    "Seed data created. Admin login: admin@hotel.local / Hotel@12345",
  );
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});

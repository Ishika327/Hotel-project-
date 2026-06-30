import Customer from "../models/Customer.js";
import Stay from "../models/Stay.js";
import Expense from "../models/Expense.js";
import Invoice from "../models/Invoice.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { normalizePhone } from "../utils/normalizePhone.js";

const buildCustomerHistory = async (customerId) => {
  const [stays, expenses, invoices] = await Promise.all([
    Stay.find({ customer: customerId })
      .populate("room employee")
      .sort({ createdAt: -1 }),
    Expense.find({ customer: customerId })
      .populate("room stay addedBy")
      .sort({ createdAt: -1 }),
    Invoice.find({ customer: customerId })
      .populate("room stay generatedBy")
      .sort({ createdAt: -1 }),
  ]);

  return { stays, expenses, invoices };
};

export const searchCustomers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const normalizedQuery = normalizePhone(q || "");

  const customers = await Customer.find({
    $or: [
      { fullName: { $regex: q || "", $options: "i" } },
      { phoneNumber: { $regex: normalizedQuery || "", $options: "i" } },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(20);

  const activeStays = customers.length
    ? await Stay.find({
        customer: { $in: customers.map((customer) => customer._id) },
        stayStatus: "CheckedIn",
      })
        .populate("room")
        .sort({ createdAt: -1 })
    : [];

  const currentRoomByCustomerId = new Map();
  activeStays.forEach((stay) => {
    const customerId = String(stay.customer);
    if (!currentRoomByCustomerId.has(customerId)) {
      currentRoomByCustomerId.set(customerId, {
        stayId: stay._id,
        roomId: stay.room?._id || null,
        roomNumber: stay.room?.roomNumber || null,
        roomType: stay.room?.roomType || null,
        ratePerNight: Number(stay.room?.pricePerNight || 0),
        floorNumber: stay.room?.floor || null,
        checkInDate: stay.checkInDate,
        checkOutDate: stay.checkOutDate,
      });
    }
  });

  res.json({
    customers: customers.map((customer) => ({
      ...customer.toObject(),
      currentRoom: currentRoomByCustomerId.get(String(customer._id)) || null,
    })),
  });
});

export const getCustomerByPhone = asyncHandler(async (req, res) => {
  const phoneNumber = normalizePhone(req.params.phoneNumber);
  const customer = await Customer.findOne({ phoneNumber });

  if (!customer) {
    return res.status(200).json({ customer: null, repeatCustomer: false });
  }

  const history = await buildCustomerHistory(customer._id);
  res.json({ customer, repeatCustomer: true, history });
});

export const getCustomerById = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return next(new ApiError(404, "Customer not found"));
  }

  const history = await buildCustomerHistory(customer._id);
  res.json({ customer, history });
});

export const createOrUpdateCustomer = asyncHandler(async (req, res) => {
  const payload = req.body;
  const phoneNumber = normalizePhone(payload.phoneNumber);
  const existing = await Customer.findOne({ phoneNumber });

  if (existing) {
    existing.fullName = payload.fullName || existing.fullName;
    existing.address = payload.address ?? existing.address;
    existing.citizenshipIdNumber =
      payload.citizenshipIdNumber ?? existing.citizenshipIdNumber;
    existing.email = payload.email ?? existing.email;
    existing.notes = payload.notes ?? existing.notes;
    existing.idProofUrl = payload.idProofUrl ?? existing.idProofUrl;
    existing.lastVisitAt = new Date();
    await existing.save();

    const history = await buildCustomerHistory(existing._id);
    return res.json({ customer: existing, repeatCustomer: true, history });
  }

  const customer = await Customer.create({
    ...payload,
    phoneNumber,
    lastVisitAt: new Date(),
  });

  res.status(201).json({ customer, repeatCustomer: false });
});

export const updateCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!customer) {
    return next(new ApiError(404, "Customer not found"));
  }

  res.json({ customer });
});

export const updateCustomerIdProof = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return next(new ApiError(404, "Customer not found"));
  }

  if (req.file) {
    customer.idProofUrl = `/uploads/id-proofs/${req.file.filename}`;
    await customer.save();
  }

  res.json({ customer });
});

export const deleteCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) {
    return next(new ApiError(404, "Customer not found"));
  }

  res.json({ message: "Customer deleted successfully" });
});

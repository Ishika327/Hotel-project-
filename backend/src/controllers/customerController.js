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
  const rawQuery = String(q || "").trim();
  const normalizedQuery = normalizePhone(rawQuery);

  // Direct matches: customer's own name or phone
  const directMatches = await Customer.find({
    $or: [
      { fullName: { $regex: rawQuery, $options: "i" } },
      { phoneNumber: { $regex: normalizedQuery || "", $options: "i" } },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(20);

  // Also search additional guests embedded on stays (guestList snapshots)
  // and the linked additionalGuests Customer records, so someone who
  // stayed as a "plus one" is still findable by name.
  let guestMatches = [];
  if (rawQuery) {
    const staysWithMatchingGuest = await Stay.find({
      "guestList.fullName": { $regex: rawQuery, $options: "i" },
    })
      .populate("customer additionalGuests")
      .sort({ createdAt: -1 })
      .limit(20);

    const guestCustomerIds = new Set();
    staysWithMatchingGuest.forEach((stay) => {
      (stay.additionalGuests || []).forEach((guest) => {
        if (guest?.fullName && new RegExp(rawQuery, "i").test(guest.fullName)) {
          guestCustomerIds.add(String(guest._id));
        }
      });
    });

    if (guestCustomerIds.size) {
      guestMatches = await Customer.find({
        _id: { $in: Array.from(guestCustomerIds) },
      });
    }
  }

  // Merge, de-duplicate by _id, direct matches first
  const seen = new Set(directMatches.map((c) => String(c._id)));
  const merged = [...directMatches];
  guestMatches.forEach((customer) => {
    const id = String(customer._id);
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(customer);
    }
  });

  const customers = merged.slice(0, 20);

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

const checkCitizenshipConflict = async (
  citizenshipIdNumber,
  excludeCustomerId,
) => {
  const trimmed = String(citizenshipIdNumber || "").trim();
  if (!trimmed) return null;

  const query = { citizenshipIdNumber: trimmed };
  if (excludeCustomerId) {
    query._id = { $ne: excludeCustomerId };
  }

  return Customer.findOne(query);
};

export const createOrUpdateCustomer = asyncHandler(async (req, res, next) => {
  const payload = req.body;
  const phoneNumber = normalizePhone(payload.phoneNumber);
  const existing = await Customer.findOne({ phoneNumber });

  if (existing) {
    if (payload.citizenshipIdNumber) {
      const conflict = await checkCitizenshipConflict(
        payload.citizenshipIdNumber,
        existing._id,
      );
      if (conflict) {
        return next(
          new ApiError(
            409,
            "This citizenship number is already registered to another customer.",
          ),
        );
      }
    }

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

  if (payload.citizenshipIdNumber) {
    const conflict = await checkCitizenshipConflict(
      payload.citizenshipIdNumber,
      null,
    );
    if (conflict) {
      return next(
        new ApiError(
          409,
          "This citizenship number is already registered to another customer.",
        ),
      );
    }
  }

  const customer = await Customer.create({
    ...payload,
    phoneNumber,
    lastVisitAt: new Date(),
  });

  res.status(201).json({ customer, repeatCustomer: false });
});

export const updateCustomer = asyncHandler(async (req, res, next) => {
  if (req.body.citizenshipIdNumber) {
    const conflict = await checkCitizenshipConflict(
      req.body.citizenshipIdNumber,
      req.params.id,
    );
    if (conflict) {
      return next(
        new ApiError(
          409,
          "This citizenship number is already registered to another customer.",
        ),
      );
    }
  }

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

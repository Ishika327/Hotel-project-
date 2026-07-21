import mongoose from "mongoose";
import Stay from "../models/Stay.js";
import Room from "../models/Room.js";
import Customer from "../models/Customer.js";
import Expense from "../models/Expense.js";
import Invoice from "../models/Invoice.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const calculateRoomCharge = (roomPricePerNight, checkInDate, checkOutDate) => {
  const oneDayMs = 1000 * 60 * 60 * 24;
  const nights = Math.max(
    1,
    Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / oneDayMs),
  );
  return nights * Number(roomPricePerNight || 0);
};

const parseDateInput = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const countNights = (checkInDate, checkOutDate) => {
  const start = parseDateInput(checkInDate);
  const end = parseDateInput(checkOutDate);
  if (!start || !end) return 1;
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
};

const normalizePayment = (totalAmount, rawPaymentStatus, rawAmountPaid) => {
  const paymentStatus = String(rawPaymentStatus || "unpaid").toLowerCase();
  const total = Number(totalAmount || 0);
  const amountPaid = Math.max(Number(rawAmountPaid || 0), 0);
  const remainingBalance = Math.max(0, total - amountPaid);
  return {
    paymentStatus: remainingBalance === 0 ? "paid" : paymentStatus,
    amountPaid,
    remainingBalance,
    paidStatus:
      remainingBalance === 0
        ? "Paid"
        : paymentStatus === "partial"
          ? "Partial"
          : "Unpaid",
  };
};

const resolveRoom = async (roomId, roomNumber, session) => {
  if (roomId) {
    return Room.findById(roomId).session(session);
  }

  if (roomNumber) {
    const normalizedRoomNumber = String(roomNumber).trim();
    return Room.findOne({ roomNumber: normalizedRoomNumber }).session(session);
  }

  return null;
};

// Cleans the raw guestList payload from the frontend into a
// consistent shape matching the Stay schema's embedded guestList.
const cleanGuestList = (guestList) =>
  (Array.isArray(guestList) ? guestList : [])
    .map((guest) => ({
      fullName: String(guest?.fullName || "").trim(),
      gender: ["Male", "Female", "Other"].includes(guest?.gender)
        ? guest.gender
        : "Male",
      age: guest?.age ? Number(guest.age) : undefined,
      phoneNumber: String(guest?.phoneNumber || "").trim(),
      citizenshipIdNumber: String(guest?.citizenshipIdNumber || "").trim(),
      address: String(guest?.address || "").trim(),
      relation: String(guest?.relation || "").trim(),
    }))
    .filter((guest) => guest.fullName);

// Turns the cleaned guestList into real, searchable Customer records.
// Reuses an existing customer by phone number if there's a match;
// falls back to name matching for guests without a phone number.
const resolveAdditionalGuests = async (cleanedGuests, session) => {
  if (!cleanedGuests.length) return [];

  const guestIds = [];

  for (const guest of cleanedGuests) {
    let existing = null;

    if (guest.phoneNumber) {
      existing = await Customer.findOne({
        phoneNumber: guest.phoneNumber,
      }).session(session);
    }

    if (!existing) {
      existing = await Customer.findOne({
        fullName: { $regex: `^${guest.fullName}$`, $options: "i" },
        phoneNumber: { $in: [null, ""] },
      }).session(session);
    }

    if (existing) {
      existing.lastVisitAt = new Date();
      if (!existing.phoneNumber && guest.phoneNumber) {
        existing.phoneNumber = guest.phoneNumber;
      }
      if (!existing.address && guest.address) {
        existing.address = guest.address;
      }
      if (!existing.citizenshipIdNumber && guest.citizenshipIdNumber) {
        existing.citizenshipIdNumber = guest.citizenshipIdNumber;
      }
      await existing.save({ session });
      guestIds.push(existing._id);
      continue;
    }

    const notes = [
      guest.relation ? `Relation: ${guest.relation}` : "",
      guest.gender ? `Gender: ${guest.gender}` : "",
      guest.age ? `Age: ${guest.age}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    const created = await Customer.create(
      [
        {
          fullName: guest.fullName,
          phoneNumber: guest.phoneNumber || undefined,
          address: guest.address || undefined,
          citizenshipIdNumber: guest.citizenshipIdNumber || undefined,
          notes: notes || undefined,
          lastVisitAt: new Date(),
        },
      ],
      { session },
    );
    guestIds.push(created[0]._id);
  }

  return guestIds;
};

export const createStay = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerId,
      roomId,
      roomNumber,
      employeeId,
      checkInDate,
      checkOutDate,
      checkIn,
      checkOut,
      guests,
      stayNotes,
      specialRequests,
      guestList,
    } = req.body;
    const customer = await Customer.findById(customerId).session(session);
    const room = await resolveRoom(roomId, roomNumber, session);
    const effectiveCheckIn = checkInDate || checkIn;
    const effectiveCheckOut = checkOutDate || checkOut;
    const effectiveEmployeeId = employeeId || req.user?._id;
    const effectiveNotes = stayNotes || specialRequests;

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    if (!room) {
      throw new ApiError(404, "Room not found");
    }

    if (room.status === "Occupied") {
      throw new ApiError(400, "Room is already occupied");
    }

    const cleanedGuests = cleanGuestList(guestList);
    const additionalGuestIds = await resolveAdditionalGuests(
      cleanedGuests,
      session,
    );

    const effectiveGuests = Number(
      guests || additionalGuestIds.length + 1 || 1,
    );

    const roomCharges = calculateRoomCharge(
      room.pricePerNight,
      effectiveCheckIn,
      effectiveCheckOut,
    );
    const payment = normalizePayment(
      roomCharges,
      req.body.paymentStatus,
      req.body.amountPaid,
    );
    const stay = await Stay.create(
      [
        {
          customer: customer._id,
          additionalGuests: additionalGuestIds,
          guestList: cleanedGuests,
          room: room._id,
          employee: effectiveEmployeeId,
          checkInDate: effectiveCheckIn,
          checkOutDate: effectiveCheckOut,
          guests: effectiveGuests,
          stayNotes: effectiveNotes,
          roomCharges,
          totalAmount: roomCharges,
          paymentStatus: payment.paymentStatus,
          amountPaid: payment.amountPaid,
          remainingBalance: payment.remainingBalance,
          paidStatus: payment.paidStatus,
          stayStatus: "CheckedIn",
        },
      ],
      { session },
    );

    room.status = "Occupied";
    customer.lastVisitAt = new Date();
    await room.save({ session });
    await customer.save({ session });

    await session.commitTransaction();
    const populatedStay = await Stay.findById(stay[0]._id).populate(
      "customer room employee additionalGuests",
    );
    res.status(201).json({ stay: populatedStay });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
});

export const getActiveStayForCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.query;
  if (!customerId) {
    const activeStays = await Stay.find({ stayStatus: { $ne: "CheckedOut" } })
      .populate("customer room employee additionalGuests")
      .sort({ createdAt: -1 });

    return res.json({
      guests: activeStays.map((stay) => ({
        stayId: stay._id,
        customerId: stay.customer?._id || null,
        guestName: stay.customer?.fullName || "Guest",
        additionalGuestNames: (stay.additionalGuests || []).map(
          (guest) => guest.fullName,
        ),
        roomId: stay.room?._id || null,
        roomNumber: stay.room?.roomNumber || null,
        roomType: stay.room?.roomType || null,
        ratePerNight: Number(stay.room?.pricePerNight || 0),
        nights: countNights(stay.checkInDate, stay.checkOutDate),
        checkInDate: stay.checkInDate,
        checkOutDate: stay.checkOutDate,
        stayStatus: stay.stayStatus,
        stayNotes: stay.stayNotes || "",
        paymentStatus: stay.paymentStatus || "unpaid",
        amountPaid: Number(stay.amountPaid || stay.paidAmount || 0),
        remainingBalance: Number(
          stay.remainingBalance ||
            Math.max(
              0,
              Number(stay.totalAmount || stay.roomCharges || 0) -
                Number(stay.amountPaid || stay.paidAmount || 0),
            ),
        ),
      })),
    });
  }

  const stay = await Stay.findOne({
    customer: customerId,
    stayStatus: "CheckedIn",
  })
    .populate("room employee additionalGuests")
    .sort({ createdAt: -1 });

  res.json({
    stay: stay
      ? {
          ...stay.toObject(),
          paymentStatus: stay.paymentStatus || "unpaid",
          amountPaid: Number(stay.amountPaid || stay.paidAmount || 0),
          remainingBalance: Number(
            stay.remainingBalance ||
              Math.max(
                0,
                Number(stay.totalAmount || stay.roomCharges || 0) -
                  Number(stay.amountPaid || stay.paidAmount || 0),
              ),
          ),
        }
      : null,
  });
});

export const updateStayPayment = asyncHandler(async (req, res, next) => {
  const stay = await Stay.findById(req.params.id).populate("room customer");
  if (!stay) {
    return next(new ApiError(404, "Stay not found"));
  }

  const totalAmount = Number(
    req.body.totalAmount || stay.totalAmount || stay.roomCharges || 0,
  );
  const { paymentStatus, amountPaid } = normalizePayment(
    totalAmount,
    req.body.paymentStatus,
    req.body.amountPaid,
  );

  stay.paymentStatus = paymentStatus;
  stay.amountPaid = amountPaid;
  stay.remainingBalance = Math.max(0, totalAmount - amountPaid);
  stay.totalAmount = totalAmount;
  stay.paidStatus =
    paymentStatus === "paid"
      ? "Paid"
      : paymentStatus === "partial"
        ? "Partial"
        : "Unpaid";
  stay.paymentMethod = req.body.paymentMethod || stay.paymentMethod || "Cash";
  await stay.save();

  res.json({
    stay: {
      ...stay.toObject(),
      paymentStatus: stay.paymentStatus,
      amountPaid: Number(stay.amountPaid || stay.paidAmount || 0),
      remainingBalance: Number(
        stay.remainingBalance ||
          Math.max(
            0,
            Number(totalAmount || 0) -
              Number(stay.amountPaid || stay.paidAmount || 0),
          ),
      ),
    },
  });
});

export const checkoutStay = asyncHandler(async (req, res, next) => {
  const stay = await Stay.findById(req.params.id).populate("room customer");
  if (!stay) {
    return next(new ApiError(404, "Stay not found"));
  }

  const expenses = await Expense.find({ stay: stay._id });
  const expenseTotal = expenses.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0,
  );
  const roomCharges = Number(stay.roomCharges || 0);
  const currentTotalAmount = roomCharges + expenseTotal;

  const totalAmount = currentTotalAmount;
  const amountPaid = Number(stay.amountPaid || stay.paidAmount || 0);
  const remainingBalance = Math.max(0, totalAmount - amountPaid);
  const returnAmount = Math.max(0, amountPaid - totalAmount);

  if (remainingBalance > 0) {
    return next(new ApiError(400, "Full payment is required before checkout"));
  }

  if (returnAmount > 0) {
    return next(new ApiError(400, "plz collect your money"));
  }

  const finalTotalAmount = currentTotalAmount;

  stay.totalExpenses = expenseTotal;
  stay.totalAmount = finalTotalAmount;
  stay.actualCheckOutAt = new Date();
  stay.stayStatus = "CheckedOut";
  await stay.save();

  stay.room.status = "Cleaning";
  await stay.room.save();

  res.json({ stay });
});

export const getStays = asyncHandler(async (_req, res) => {
  const stays = await Stay.find()
    .populate("customer room employee additionalGuests")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ stays });
});

export const getStayById = asyncHandler(async (req, res, next) => {
  const stay = await Stay.findById(req.params.id).populate(
    "customer room employee additionalGuests",
  );
  if (!stay) {
    return next(new ApiError(404, "Stay not found"));
  }

  const expenses = await Expense.find({ stay: stay._id }).sort({
    createdAt: -1,
  });
  const invoice = await Invoice.findOne({ stay: stay._id });
  res.json({ stay, expenses, invoice });
});

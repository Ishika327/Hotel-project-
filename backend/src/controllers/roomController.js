import Room from "../models/Room.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const getRooms = asyncHandler(async (_req, res) => {
  const rooms = await Room.find().sort({ roomNumber: 1 });
  res.json({ rooms });
});

export const getRoomById = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id);
  if (!room) {
    return next(new ApiError(404, "Room not found"));
  }

  res.json({ room });
});

export const createRoom = asyncHandler(async (req, res) => {
  const room = await Room.create(req.body);
  res.status(201).json({ room });
});

export const updateRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!room) {
    return next(new ApiError(404, "Room not found"));
  }

  res.json({ room });
});

export const deleteRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findByIdAndDelete(req.params.id);
  if (!room) {
    return next(new ApiError(404, "Room not found"));
  }

  res.json({ message: "Room deleted successfully" });
});

export const getRoomAvailability = asyncHandler(async (_req, res) => {
  const rooms = await Room.find();
  const available = rooms.filter((room) => room.status === "Available").length;
  const occupied = rooms.filter((room) => room.status === "Occupied").length;
  res.json({ total: rooms.length, available, occupied });
});

export const getAvailableRooms = asyncHandler(async (_req, res) => {
  const rooms = await Room.find({ status: "Available" }).sort({
    roomNumber: 1,
  });
  res.json({
    rooms: rooms.map((room) => ({
      _id: room._id,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      ratePerNight: room.pricePerNight,
      floorNumber: room.floor || null,
    })),
  });
});

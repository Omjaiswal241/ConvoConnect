const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const http = require("http");
const { Server } = require("socket.io");
const { connectDB, User, Room, Message, RoomMember } = require("./db");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Zod schemas for request validation
const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const renameRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
});

// Helper: generate a unique room code
async function generateRoomCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid ambiguous chars
  const length = 6;

  while (true) {
    let code = "";
    for (let i = 0; i < length; i++) {
      const index = Math.floor(Math.random() * characters.length);
      code += characters[index];
    }

    // Ensure code is unique
    const existing = await Room.findOne({ roomCode: code });
    if (!existing) {
      return code;
    }
  }
}

// Helper: generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Middleware: authenticate user
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"]; // "Bearer <token>"
  if (!authHeader) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  const [, token] = authHeader.split(" ");
  if (!token) {
    return res.status(401).json({ message: "Invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email, name }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// CURRENT USER PROFILE
// GET /me
app.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email avatar createdAt updatedAt"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
      },
    });
  } catch (err) {
    console.error("GET /me error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  avatar: z.string().max(100, "Avatar must be short").optional(),
});

// UPDATE PROFILE
// PATCH /me { name?, avatar? }
app.patch("/me", authMiddleware, async (req, res) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid profile data",
        errors: parsed.error.flatten(),
      });
    }

    const { name, avatar } = parsed.data;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name && name !== user.name) {
      const existingName = await User.findOne({ name });
      if (existingName && String(existingName._id) !== String(user._id)) {
        return res.status(409).json({ message: "Username already in use" });
      }
      user.name = name;
    }

    if (typeof avatar === "string") {
      user.avatar = avatar.trim() || undefined;
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
      },
    });
  } catch (err) {
    console.error("PATCH /me error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected", socket.id);

  socket.on("joinRoom", (roomId) => {
    if (roomId) {
      socket.join(String(roomId));
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected", socket.id);
  });
});

// SIGN UP
// POST /signup { name, email, password }
app.post("/signup", async (req, res) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid signup data",
        errors: parsed.error.flatten(),
      });
    }

    const { name, email, password } = parsed.data;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const existingName = await User.findOne({ name });
    if (existingName) {
      return res.status(409).json({ message: "Username already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, passwordHash });
    const token = generateToken(user);

    res.status(201).json({
      message: "User created",
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error("/signup error", err);

    // Handle duplicate key errors as a safety net
    if (err.code === 11000 && err.keyPattern) {
      if (err.keyPattern.email) {
        return res.status(409).json({ message: "Email already in use" });
      }
      if (err.keyPattern.name) {
        return res.status(409).json({ message: "Username already in use" });
      }
    }

    res.status(500).json({ message: "Internal server error" });
  }
});

// SIGN IN
// POST /signin { email, password }
app.post("/signin", async (req, res) => {
  try {
    const parsed = signinSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid signin data",
        errors: parsed.error.flatten(),
      });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.json({
      message: "Signed in",
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error("/signin error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// CREATE ROOM (auth required)
// POST /rooms { name, description, maxMembers? }
app.post("/rooms", authMiddleware, async (req, res) => {
  try {
    const { name, description, maxMembers } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Room name is required" });
    }

    const roomCode = await generateRoomCode();

    const room = await Room.create({
      name,
      description: description || "",
      roomCode,
      owner: req.user.id,
      maxMembers: maxMembers || 50,
    });

    // Creator automatically becomes owner + member
    await RoomMember.create({
      room: room._id,
      user: req.user.id,
      role: "owner",
      status: "online",
    });

    res.status(201).json({ room });
  } catch (err) {
    console.error("/rooms error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// JOIN ROOM BY CODE (auth required)
// POST /rooms/join-by-code { roomCode }
app.post("/rooms/join-by-code", authMiddleware, async (req, res) => {
  try {
    const { roomCode } = req.body;

    if (!roomCode || !roomCode.trim()) {
      return res.status(400).json({ message: "Room code is required" });
    }

    const room = await Room.findOne({ roomCode: roomCode.trim().toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const memberCount = await RoomMember.countDocuments({ room: room._id });
    if (memberCount >= room.maxMembers) {
      return res.status(400).json({ message: "Room is full" });
    }

    let membership = await RoomMember.findOne({ room: room._id, user: req.user.id });
    if (!membership) {
      membership = await RoomMember.create({
        room: room._id,
        user: req.user.id,
        role: "member",
        status: "online",
      });
    } else {
      membership.status = "online";
      await membership.save();
    }

    res.json({ room, membership });
  } catch (err) {
    console.error("/rooms/join-by-code error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// JOIN ROOM (auth required)
// POST /rooms/:roomId/join
app.post("/rooms/:roomId/join", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const memberCount = await RoomMember.countDocuments({ room: roomId });
    if (memberCount >= room.maxMembers) {
      return res.status(400).json({ message: "Room is full" });
    }

    let membership = await RoomMember.findOne({ room: roomId, user: req.user.id });
    if (!membership) {
      membership = await RoomMember.create({
        room: roomId,
        user: req.user.id,
        role: "member",
        status: "online",
      });
    } else {
      membership.status = "online";
      await membership.save();
    }

    res.json({ room, membership });
  } catch (err) {
    console.error("/rooms/:roomId/join error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// SEND MESSAGE IN ROOM (auth required)
// POST /rooms/:roomId/messages { content }
app.post("/rooms/:roomId/messages", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const membership = await RoomMember.findOne({ room: roomId, user: req.user.id });
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this room" });
    }

    let message = await Message.create({
      room: roomId,
      author: req.user.id,
      content: content.trim(),
    });
    message = await message.populate("author", "name email avatar");

    io.to(String(roomId)).emit("room:new-message", {
      roomId: String(roomId),
      message,
    });

    res.status(201).json({ message });
  } catch (err) {
    console.error("/rooms/:roomId/messages error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ROOM DETAILS (auth required)
// GET /rooms/:roomId/details
app.get("/rooms/:roomId/details", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const membership = await RoomMember.findOne({ room: roomId, user: req.user.id });
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this room" });
    }

    const members = await RoomMember.find({ room: roomId })
      .sort({ joinedAt: 1 })
      .populate("user", "name email");

    res.json({ room, members, membership });
  } catch (err) {
    console.error("GET /rooms/:roomId/details error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// RENAME ROOM (only owner)
// PATCH /rooms/:roomId { name }
app.patch("/rooms/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const parsed = renameRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid room data",
        errors: parsed.error.flatten(),
      });
    }

    const { name } = parsed.data;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (String(room.owner) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "Only the room creator can rename the room" });
    }

    room.name = name;
    await room.save();

    res.json({ room });
  } catch (err) {
    console.error("PATCH /rooms/:roomId error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// OPTIONAL: get room messages
// GET /rooms/:roomId/messages
app.get("/rooms/:roomId/messages", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const membership = await RoomMember.findOne({ room: roomId, user: req.user.id });
    if (!membership) {
      return res
        .status(403)
        .json({ message: "You are not a member of this room" });
    }

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: 1 })
      .populate("author", "name email");

    res.json({ messages });
  } catch (err) {
    console.error("GET /rooms/:roomId/messages error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// OPTIONAL: list rooms
// GET /rooms
app.get("/rooms", authMiddleware, async (req, res) => {
  try {
    // Find all room memberships for this user
    const memberships = await RoomMember.find({ user: req.user.id }).select(
      "room"
    );

    const roomIds = memberships.map((m) => m.room);

    if (roomIds.length === 0) {
      return res.json({ rooms: [] });
    }

    // Get member counts per room
    const counts = await RoomMember.aggregate([
      { $match: { room: { $in: roomIds } } },
      { $group: { _id: "$room", count: { $sum: 1 } } },
    ]);

    const countsByRoom = counts.reduce((acc, c) => {
      acc[c._id.toString()] = c.count;
      return acc;
    }, {});

    // Load rooms the user has joined
    const rooms = await Room.find({ _id: { $in: roomIds } }).sort({
      createdAt: -1,
    });

    const roomsWithCounts = rooms.map((room) => {
      const obj = room.toObject();
      const key = room._id.toString();
      return {
        ...obj,
        membersCount: countsByRoom[key] || 0,
      };
    });

    res.json({ rooms: roomsWithCounts });
  } catch (err) {
    console.error("GET /rooms error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// LEAVE ROOM (auth required)
// POST /rooms/:roomId/leave
app.post("/rooms/:roomId/leave", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const membership = await RoomMember.findOne({
      room: roomId,
      user: req.user.id,
    });

    if (!membership) {
      return res
        .status(400)
        .json({ message: "You are not a member of this room" });
    }

    const membersInRoom = await RoomMember.find({ room: roomId }).sort({
      joinedAt: 1,
    });

    if (membersInRoom.length === 1) {
      // Last member leaving: delete room and its messages/memberships
      await Message.deleteMany({ room: roomId });
      await RoomMember.deleteMany({ room: roomId });
      await Room.findByIdAndDelete(roomId);
      return res.json({ deleted: true });
    }

    // More than one member in the room
    if (String(room.owner) === String(req.user.id)) {
      // Transfer ownership to the next member in line (excluding current user)
      const newOwnerMembership = membersInRoom.find(
        (m) => String(m.user) !== String(req.user.id)
      );

      if (newOwnerMembership) {
        room.owner = newOwnerMembership.user;
        await room.save();

        newOwnerMembership.role = "owner";
        await newOwnerMembership.save();
      }
    }

    await membership.deleteOne();

    res.json({ deleted: false, roomId: room._id, newOwnerId: room.owner });
  } catch (err) {
    console.error("POST /rooms/:roomId/leave error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

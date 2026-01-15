const mongoose = require("mongoose");

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://Om:om110904@cluster0.fbcrg9t.mongodb.net/ConvoConnect";

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Add options here if needed
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

// User schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true }, // store hashed password
    avatar: { type: String },
  },
  { timestamps: true }
);

// Room schema
const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    roomCode: { type: String, required: true, unique: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    maxMembers: { type: Number, default: 50 },
    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Message schema
const messageSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

// Room member schema
const roomMemberSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["owner", "moderator", "member"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Room = mongoose.model("Room", roomSchema);
const Message = mongoose.model("Message", messageSchema);
const RoomMember = mongoose.model("RoomMember", roomMemberSchema);

module.exports = {
  mongoose,
  connectDB,
  User,
  Room,
  Message,
  RoomMember,
};

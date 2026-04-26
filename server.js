const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ CORS FIRST — specific origins, before all routes
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://blackbox-omega-peach.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// --- SCHEMAS ---
const RoomSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    color: { type: String, default: "#000000" },
    savedCount: { type: Number, default: 0 },
    lastDropAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});
const Room = mongoose.model('Room', RoomSchema);

const DropSchema = new mongoose.Schema({
    roomId: String,
    content: String,
    image: String,
    tempName: String,
    avatarIndex: Number,
    color: String,
    likes: { type: [String], default: [] },
    dislikes: { type: [String], default: [] },
    replies: [
        {
          content: String,
          tempName: String,
          avatarIndex: Number, // <--- ENSURE THIS IS HERE
          createdAt: { type: Date, default: Date.now }
        }
    ],
    createdAt: { type: Date, default: Date.now }
});
const Drop = mongoose.model('Drop', DropSchema);

// --- ROUTES ---

// Get all rooms (Sorted by savedCount for Trending)
app.get('/api/rooms', async (req, res) => {
    const rooms = await Room.find().sort({ savedCount: -1 });
    res.json(rooms);
});

// Create Room
app.post('/api/rooms', async (req, res) => {
    const { title, color } = req.body;
    const slug = title.toLowerCase().split(' ').filter(Boolean).join('-');
    try {
        const room = await Room.create({ title, slug, color });
        res.json(room);
    } catch (e) { res.status(400).json({ error: "Title taken" }); }
});

// Get Room + Drops
app.get('/api/rooms/:slug', async (req, res) => {
    const room = await Room.findOne({ slug: req.params.slug });
    if (!room) return res.status(404).send("Not Found");

    let drops = await Drop.find({ roomId: room._id })
      .sort({ createdAt: -1 })
      .lean();

    drops = drops.map(d => ({
      ...d,
      replies: d.replies || []
    }));

    res.json({ room, drops });
});

// Post Drop
app.post('/api/drops', async (req, res) => {
    const drop = await Drop.create(req.body);
    await Room.findByIdAndUpdate(req.body.roomId, { lastDropAt: Date.now() });
    res.json(drop);
});

// Vote logic
app.post('/api/drops/:id/vote', async (req, res) => {
    const { userId, type } = req.body;
    try {
        const drop = await Drop.findById(req.params.id);
        if (drop[type].includes(userId)) {
            drop[type] = drop[type].filter(id => id !== userId);
        } else {
            drop[type].push(userId);
            const opposite = type === 'likes' ? 'dislikes' : 'likes';
            drop[opposite] = drop[opposite].filter(id => id !== userId);
        }
        await drop.save();
        res.json(drop);
    } catch (err) {
        res.status(500).json({ error: "Vote failed" });
    }
});

// Update Room Saved Count
app.post('/api/rooms/:id/save', async (req, res) => {
    const { action } = req.body;
    const room = await Room.findByIdAndUpdate(
        req.params.id,
        { $inc: { savedCount: action === 'increment' ? 1 : -1 } },
        { new: true }
    );
    res.json(room);
});

// ✅ Reply route — defined with all other routes, before mongoose.connect
// ✅ RE-WRITTEN REPLY ROUTE
app.post('/api/drops/:id/reply', async (req, res) => {
    try {
        const dropId = req.params.id.trim();
        
        // 1. Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(dropId)) {
            return res.status(400).json({ error: "Invalid Drop ID format" });
        }

        const { content, tempName, avatarIndex } = req.body;

        // 2. Find and Update
        const drop = await Drop.findById(dropId);
        if (!drop) {
            return res.status(404).json({ error: "Drop not found in database" });
        }

        // 3. Add reply to array
        const newReply = {
            content,
            tempName: tempName || "Anonymous",
            avatarIndex: Number(avatarIndex) || 0,
            createdAt: new Date()
        };

        drop.replies.unshift(newReply);
        await drop.save();

        // 4. Force JSON header and return
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(drop);

    } catch (err) {
        console.error("CRITICAL BACKEND ERROR:", err);
        return res.status(500).json({ error: "Server crashed processing reply" });
    }
});

// ✅ Connect + Listen at the VERY BOTTOM
mongoose.connect(process.env.MONGO_URI).then(() => {
    app.listen(process.env.PORT || 5000, () => console.log("🚀 Senior Backend Live"));
});

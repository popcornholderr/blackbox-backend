const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://blackbox-omega-peach.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

const BLOCKED_WORDS = [
  "fuck","fuk","fck","fucc","fuxk","f*ck","f**k","f***","f u c k",
  "f@ck","f#ck","f$ck","f%ck","f^ck","f&ck","f!ck",
  "fu*k","fuc*","fuc*k","f-u-c-k","f_u_c_k","phuck","phuk","phuc","phu*k",
  "shit","sh1t","sh!t","sh*t","s*it","s**t","$hit","$h1t","shyt","sh1tt","shiit","shi*t","s-h-i-t",
  "bitch","b1tch","biatch","b!tch","b*tch","btch","b!+ch","b i t c h","b-itch","b_it_ch",
  "ass","a$$","a55","a$s","@ss","a*s","a**","a s s","asshole","a$$hole","a55hole","assh0le","a$$h0le",
  "dick","d1ck","dik","d!ck","d*ck","di*k","d i c k",
  "cock","c0ck","c*ck","co*k","c o c k",
  "pussy","puss","pu$$y","p*ssy","p u s s y",
  "slut","sl0t","sl*t","s l u t",
  "hoe","hoes","h*e",
  "whore","wh0re","wh*re","w h o r e",
  "faggot","fag","f4g","f@g","f*g","fa**ot",
  "nigga","n1gga","nigg","n!gga","n*g","nigger","n1gger","n!gger","n*gger",
  "motherfucker","motherfuker","motherfcker","mofo","mo-fu","mofoe",
  "madarchod","madar chod","m@darchod","mad*rchod","m a d a r c h o d",
  "behenchod","behen chod","bhenchod","b*c","b c","bc","b.c","b-c",
  "chutiya","chut1ya","ch*tia","chut","chutiye","chutiy@",
  "bhosdike","bhosd!ke","bhosd1ke","bhosdikee","bhosd*k",
  "randi","rand1","r*ndi","r a n d i",
  "kamina","kamine","k@m1na",
  "gandu","gaand","gand","g@ndu","g*nd",
  "lund","l0nd","l*nd","l u n d",
  "loda","l0da","l*d@",
  "maa ki aankh","maa ki","maa k!","m@a ki",
  "teri maa","teri maa ki","t3ri maa","t*ri maa",
  "teri behen","teri bhen","t3ri bhen",
  "lavdo","lavda","lavdi","l@vdo","l*vda","laude","lavde","loude","l*ude","l*wde",
  "bhosdi","bhosdiya","bhosdiyo","bh0sdi",
  "gaand maro","gaandmaro","g@and maro",
  "nakamo","nakama","n@kamo",
  "gando","gandi","g@ndo",
  "gadedo","gadeda","g@dedo",
  "kukro","kukra","k*kr0",
  "tari maa","tari ben","tari maa ni","tari ben ni",
  "taro baap","t@ro baap",
  "bhad ma ja","bhadma ja","bh@d ma j@",
  "sex","s3x","s*x","$ex","sexx","sexxx","s e x","s-e-x","s_ex","sx","secks","seks","seggs","s3ggs","segg","segging",
  "sexual","s3xual","s*xual","sexuall","sexyy","sexy","s3xy","s*xy",
  "horny","h0rny","h*rny","hornyy","h0rni",
  "blowjob","bl0wjob","b*owjob","bj","b.j","b-j",
  "handjob","h@ndjob","h*ndjob","hj",
  "boobs","b00bs","bo0bs","b*obs","boobies",
  "tits","t1ts","t*ts","ti*ts",
  "nudes","n*des","nud3s","nude","send nudes",
  "porn","p0rn","p*rn","pr0n",
  "xxx","x x x","x-x-x","x_x_x",
  "chudai","ch*dai","chud@i","chodna","ch*dna","ch0dna",
  "chod","ch0d","ch*d",
  "sex karna","s*x karna","seks karna",
  "suhagrat","suhaagrat","sambhog","sambh0g",
  "chodu","ch0du","ch*du","chodi","ch0di","ch*di","chudelo","chudeli",
  "lauda sex","lavda sex",
  "kill","k1ll","k!ll","k*ll","k i l l",
  "rape","r@pe","r*pe","rap3","r a p e",
  "yoni","y0ni","y0n1","yon1",
  "shishn","shishna"
];

// Words ALWAYS blocked regardless of room type (CSAM, terrorism, extreme harm)
const ABSOLUTE_BLOCKED = [
  "child porn","childporn","cp porn","pedo","pedophile","pedophilia","loli","shota",
  "isis","isil","al qaeda","alqaeda","jihad","terrorism","terrorist","bomb making",
  "how to make bomb","suicide bomb","mass shooting","school shooting"
];

const normalize = (text) => {
  return text
    .toLowerCase()
    .replace(/[0-9]/g, (m) => ({ '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '6': 'g', '7': 't', '8': 'b' }[m] || m))
    .replace(/[@$]/g, (m) => ({ '@': 'a', '$': 's' }[m] || m))
    .replace(/\s+/g, ' ')
    .trim();
};

const findAbsoluteBlockedWord = (text) => {
  const norm = normalize(text);
  const original = text.toLowerCase().replace(/\s+/g, ' ').trim();
  for (const word of ABSOLUTE_BLOCKED) {
    if (norm.includes(word) || original.includes(word)) return word;
  }
  return null;
};

const findAbusiveWord = (text) => {
  const norm = normalize(text);
  const original = text.toLowerCase().replace(/\s+/g, ' ').trim();
  for (const word of BLOCKED_WORDS) {
    if (norm.includes(word) || original.includes(word)) return word;
  }
  return null;
};

const isEnglishOnly = (text) => {
  const withoutEmoji = text
    .replace(/\p{Emoji_Presentation}/gu, '')
    .replace(/[\u200d\ufe0f\u20e3]/g, '');
  return /^[a-zA-Z0-9\s.,!?'"()\-_@#$%&*+=:;<>/\\|~`^{}[\]]*$/.test(withoutEmoji);
};

// isAdult: if true, only absolute blocks apply. if false, full word list applies.
const moderateContent = (text, isAdult = false) => {
  if (!isEnglishOnly(text)) return { error: "Only English letters are allowed.", word: null };
  // Always check absolute blocks
  const absWord = findAbsoluteBlockedWord(text);
  if (absWord) return { error: "This content is not allowed.", word: absWord };
  // In safe rooms, also check the full abusive word list
  if (!isAdult) {
    const word = findAbusiveWord(text);
    if (word) return { error: "Abusive language is not allowed.", word };
  }
  return null;
};

// ── SCHEMAS ──────────────────────────────────────────────

const RoomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  color: { type: String, default: "#000000" },
  savedCount: { type: Number, default: 0, min: 0 },
  lastDropAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  isAdult: { type: Boolean, default: false },       // 18+ room
  isPrivate: { type: Boolean, default: false },     // private room
  adminCode: { type: String, default: null },       // admin passcode for private rooms
});
const Room = mongoose.model('Room', RoomSchema);

const DropSchema = new mongoose.Schema({
  roomId: String,
  content: String,
  tempName: String,
  avatarIndex: Number,
  color: String,
  likes: { type: [String], default: [] },
  dislikes: { type: [String], default: [] },
  replies: [
    {
      content: String,
      tempName: String,
      avatarIndex: Number,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});
const Drop = mongoose.model('Drop', DropSchema);

const PollSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  question: { type: String, required: true },
  options: [
    {
      text: { type: String, required: true },
      voters: { type: [String], default: [] }
    }
  ],
  allowMultiple: { type: Boolean, default: false },
  tempName: { type: String, default: "Anonymous" },
  avatarIndex: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const Poll = mongoose.model('Poll', PollSchema);

// Join requests for private rooms
const JoinRequestSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const JoinRequest = mongoose.model('JoinRequest', JoinRequestSchema);

// ── ROOM ROUTES ──────────────────────────────────────────

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find().sort({ savedCount: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

app.post('/api/rooms', async (req, res) => {
  const { title, color, isAdult, isPrivate, adminCode } = req.body;
  const slug = title.toLowerCase().split(' ').filter(Boolean).join('-');
  try {
    const room = await Room.create({
      title, slug, color,
      isAdult: !!isAdult,
      isPrivate: !!isPrivate,
      adminCode: isPrivate ? (adminCode || null) : null
    });
    res.json(room);
  } catch (e) {
    res.status(400).json({ error: "Title taken" });
  }
});

app.get('/api/rooms/:slug', async (req, res) => {
  try {
    const room = await Room.findOne({ slug: req.params.slug });
    if (!room) return res.status(404).send("Not Found");
    let drops = await Drop.find({ roomId: room._id }).sort({ createdAt: -1 }).lean();
    drops = drops.map(d => ({ ...d, replies: d.replies || [] }));
    let polls = await Poll.find({ roomId: room._id }).sort({ createdAt: -1 }).lean();
    // Don't expose adminCode to clients
    const roomData = room.toObject();
    delete roomData.adminCode;
    res.json({ room: roomData, drops, polls });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch room" });
  }
});

app.post('/api/rooms/:id/save', async (req, res) => {
  try {
    const { action } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (action === 'increment') {
      room.savedCount = (room.savedCount || 0) + 1;
    } else {
      room.savedCount = Math.max(0, (room.savedCount || 0) - 1);
    }
    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: "Save failed" });
  }
});

// Verify admin code for private room
app.post('/api/rooms/:id/verify-admin', async (req, res) => {
  try {
    const { code } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (!room.isPrivate) return res.status(400).json({ error: "Not a private room" });
    if (room.adminCode && room.adminCode === code) {
      return res.json({ isAdmin: true });
    }
    return res.json({ isAdmin: false });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

// ── JOIN REQUEST ROUTES ──────────────────────────────────

// Submit a join request
app.post('/api/rooms/:id/join-request', async (req, res) => {
  try {
    const { userId, name } = req.body;
    if (!userId || !name || !name.trim()) return res.status(400).json({ error: "Name is required." });
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (!room.isPrivate) return res.status(400).json({ error: "Not a private room" });
    // Check if request already exists
    const existing = await JoinRequest.findOne({ roomId: req.params.id, userId });
    if (existing) return res.json(existing);
    const request = await JoinRequest.create({ roomId: req.params.id, userId, name: name.trim() });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit request" });
  }
});

// Get join request status for a user
app.get('/api/rooms/:id/join-request/:userId', async (req, res) => {
  try {
    const request = await JoinRequest.findOne({ roomId: req.params.id, userId: req.params.userId });
    if (!request) return res.json({ status: 'none' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch request" });
  }
});

// Get all pending join requests (admin only — requires code verification via separate call)
app.get('/api/rooms/:id/join-requests', async (req, res) => {
  try {
    const requests = await JoinRequest.find({ roomId: req.params.id, status: 'pending' }).sort({ createdAt: 1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// Approve / deny / kick a user (admin action)
app.post('/api/rooms/:id/join-requests/:requestId', async (req, res) => {
  try {
    const { action } = req.body; // 'approved' | 'denied' | 'kick'
    if (!['approved', 'denied', 'kick'].includes(action)) return res.status(400).json({ error: "Invalid action" });
    const request = await JoinRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (action === 'kick') {
      await JoinRequest.findByIdAndDelete(req.params.requestId);
    } else {
      request.status = action;
      await request.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Action failed" });
  }
});

// ── DROP ROUTES ──────────────────────────────────────────

app.post('/api/drops', async (req, res) => {
  const { content, tempName, roomId } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: "Write something first." });
  // Fetch room to know if it's adult
  let isAdult = false;
  try {
    const room = await Room.findById(roomId);
    if (room) isAdult = room.isAdult;
  } catch {}
  const contentResult = moderateContent(content, isAdult);
  if (contentResult) return res.status(400).json({ error: contentResult.error, abusiveWord: contentResult.word });
  if (tempName) {
    const nameResult = moderateContent(tempName, false); // names always safe-moderated
    if (nameResult) return res.status(400).json({ error: "Display name contains invalid words.", abusiveWord: nameResult.word });
  }
  try {
    const drop = await Drop.create(req.body);
    await Room.findByIdAndUpdate(roomId, { lastDropAt: Date.now() });
    res.json(drop);
  } catch (e) {
    res.status(500).json({ error: "Post failed." });
  }
});

app.post('/api/drops/:id/vote', async (req, res) => {
  const { userId, type } = req.body;
  if (!userId || !['likes', 'dislikes'].includes(type)) {
    return res.status(400).json({ error: "Invalid vote request" });
  }
  try {
    const drop = await Drop.findById(req.params.id);
    if (!drop) return res.status(404).json({ error: "Drop not found" });
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

app.post('/api/drops/:id/reply', async (req, res) => {
  const { content, tempName, avatarIndex, roomId } = req.body;
  if (!content) return res.status(400).json({ error: "Write something first." });
  let isAdult = false;
  try {
    if (roomId) {
      const room = await Room.findById(roomId);
      if (room) isAdult = room.isAdult;
    } else {
      // Try to find room via drop
      const drop = await Drop.findById(req.params.id);
      if (drop) {
        const room = await Room.findById(drop.roomId);
        if (room) isAdult = room.isAdult;
      }
    }
  } catch {}
  const contentResult = moderateContent(content, isAdult);
  if (contentResult) return res.status(400).json({ error: contentResult.error, abusiveWord: contentResult.word });
  if (tempName) {
    const nameResult = moderateContent(tempName, false);
    if (nameResult) return res.status(400).json({ error: "Display name contains invalid words.", abusiveWord: nameResult.word });
  }
  try {
    const dropId = req.params.id.trim();
    if (!mongoose.Types.ObjectId.isValid(dropId)) {
      return res.status(400).json({ error: "Invalid Drop ID format" });
    }
    const drop = await Drop.findById(dropId);
    if (!drop) return res.status(404).json({ error: "Drop not found" });
    drop.replies.push({
      content,
      tempName: tempName || "Anonymous",
      avatarIndex: Number(avatarIndex) || 0,
      createdAt: new Date()
    });
    await drop.save();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(drop);
  } catch (err) {
    return res.status(500).json({ error: "Server error processing reply" });
  }
});

// ── POLL ROUTES ──────────────────────────────────────────

app.post('/api/polls', async (req, res) => {
  const { roomId, question, options, allowMultiple, tempName, avatarIndex } = req.body;
  if (!question || !question.trim()) return res.status(400).json({ error: "Poll question is required." });
  if (!options || options.length < 2) return res.status(400).json({ error: "At least 2 options required." });
  if (options.length > 4) return res.status(400).json({ error: "Maximum 4 options allowed." });

  let isAdult = false;
  try {
    const room = await Room.findById(roomId);
    if (room) isAdult = room.isAdult;
  } catch {}

  const qResult = moderateContent(question, isAdult);
  if (qResult) return res.status(400).json({ error: qResult.error, abusiveWord: qResult.word });

  for (const opt of options) {
    if (!opt.trim()) return res.status(400).json({ error: "Options cannot be empty." });
    const optResult = moderateContent(opt, isAdult);
    if (optResult) return res.status(400).json({ error: optResult.error, abusiveWord: optResult.word });
  }

  if (tempName) {
    const nameResult = moderateContent(tempName, false);
    if (nameResult) return res.status(400).json({ error: "Display name contains invalid words.", abusiveWord: nameResult.word });
  }

  try {
    const poll = await Poll.create({
      roomId,
      question,
      options: options.map(text => ({ text, voters: [] })),
      allowMultiple: !!allowMultiple,
      tempName: tempName || "Anonymous",
      avatarIndex: Number(avatarIndex) || 0
    });
    await Room.findByIdAndUpdate(roomId, { lastDropAt: Date.now() });
    res.json(poll);
  } catch (err) {
    res.status(500).json({ error: "Failed to create poll." });
  }
});

app.post('/api/polls/:id/vote', async (req, res) => {
  const { userId, optionIndex } = req.body;
  if (!userId || optionIndex === undefined) {
    return res.status(400).json({ error: "Invalid vote request" });
  }
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found" });

    if (!poll.allowMultiple) {
      poll.options.forEach(opt => {
        opt.voters = opt.voters.filter(id => id !== userId);
      });
    }

    const opt = poll.options[optionIndex];
    if (!opt) return res.status(400).json({ error: "Invalid option" });

    if (opt.voters.includes(userId)) {
      opt.voters = opt.voters.filter(id => id !== userId);
    } else {
      opt.voters.push(userId);
    }

    poll.markModified('options');
    await poll.save();
    res.json(poll);
  } catch (err) {
    res.status(500).json({ error: "Vote failed" });
  }
});

// ── TODAY'S BEST DROP & POLL ─────────────────────────────

app.get('/api/today/best-drop', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    // Only show best drop from public, non-private rooms
    const publicRooms = await Room.find({ isPrivate: { $ne: true } }).lean();
    const publicRoomIds = publicRooms.map(r => String(r._id));
    const drops = await Drop.find({
      createdAt: { $gte: startOfDay },
      roomId: { $in: publicRoomIds }
    }).lean();
    if (!drops.length) return res.json(null);
    const best = drops.reduce((a, b) => (b.likes.length > a.likes.length ? b : a));
    const room = await Room.findById(best.roomId).lean();
    res.json({ drop: { ...best, replies: best.replies || [] }, room });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch best drop" });
  }
});

app.get('/api/today/best-poll', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const publicRooms = await Room.find({ isPrivate: { $ne: true } }).lean();
    const publicRoomIds = publicRooms.map(r => String(r._id));
    const polls = await Poll.find({
      createdAt: { $gte: startOfDay },
      roomId: { $in: publicRoomIds }
    }).lean();
    if (!polls.length) return res.json(null);
    const best = polls.reduce((a, b) => {
      const aVotes = a.options.reduce((s, o) => s + o.voters.length, 0);
      const bVotes = b.options.reduce((s, o) => s + o.voters.length, 0);
      return bVotes > aVotes ? b : a;
    });
    const room = await Room.findById(best.roomId).lean();
    res.json({ poll: best, room });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch best poll" });
  }
});

mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(process.env.PORT || 5000, () => console.log("🚀 Server Live"));
});

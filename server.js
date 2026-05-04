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
   "hoe","hoes","h*e",
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
  "whore","wh0re","wh*re","w h o r e",
  "faggot","fag","f4g","f@g","f*g","fa**ot",
  "retard","ret4rd","ret@rd","re*ard","r e t a r d",
  "nigga","n1gga","nigg","n!gga","n*g","nigger","n1gger","n!gger","n*gger",
  "motherfucker","motherfuker","motherfcker","mofo","mo-fu","mofoe",
  "madarchod","madar chod","m@darchod","mad*rchod","m a d a r c h o d",
  "behenchod","behen chod","bhenchod","b*c","b c","bc","b.c","b-c",
  "chutiya","chut1ya","ch*tia","chut","chutiye","chutiy@",
  "bhosdike","bhosd!ke","bhosd1ke","bhosdikee","bhosd*k",
  "randi","rand1","r*ndi","r a n d i",
  "harami","har@mi","h*r*mi",
  "kamina","kamine","k@m1na",
  "saala","saale","sala","s@la","s*l@",
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
  "lust","l*st","lusst",
  "suck","suk","s*ck","su*k","sucking","suckin",
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
  "die","d1e","d!e","d*e","d i e",
  "rape","r@pe","r*pe","rap3","r a p e",
];

const normalize = (text) => {
  return text
    .toLowerCase()
    .replace(/[0-9]/g, (m) => ({ '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '6': 'g', '7': 't', '8': 'b' }[m] || m))
    .replace(/[@$]/g, (m) => ({ '@': 'a', '$': 's' }[m] || m))
    .replace(/\s+/g, ' ')
    .trim();
};

const isAbusive = (text) => {
  const norm = normalize(text);
  const original = text.toLowerCase().replace(/\s+/g, ' ').trim();
  return BLOCKED_WORDS.some(word => norm.includes(word) || original.includes(word));
};

const isEnglishOnly = (text) => {
  const withoutEmoji = text
    .replace(/\p{Emoji_Presentation}/gu, '')
    .replace(/[\u200d\ufe0f\u20e3]/g, '');
  return /^[a-zA-Z0-9\s.,!?'"()\-]*$/.test(withoutEmoji);
};

const moderateContent = (text) => {
  if (!isEnglishOnly(text)) return "Only English letters are allowed.";
  if (isAbusive(text)) return "Abusive language is not allowed.";
  return null;
};

const RoomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  color: { type: String, default: "#000000" },
  savedCount: { type: Number, default: 0, min: 0 }, // ✅ min:0 at schema level
  lastDropAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
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

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find().sort({ savedCount: -1 });
    res.json(rooms);
  } catch (err) {
    console.error("GET /api/rooms failed:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

app.post('/api/rooms', async (req, res) => {
  const { title, color } = req.body;
  const slug = title.toLowerCase().split(' ').filter(Boolean).join('-');
  try {
    const room = await Room.create({ title, slug, color });
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
    res.json({ room, drops });
  } catch (err) {
    console.error("GET /api/rooms/:slug failed:", err);
    res.status(500).json({ error: "Failed to fetch room" });
  }
});

app.post('/api/drops', async (req, res) => {
  const { content, tempName } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: "Write something first." });
  const contentError = moderateContent(content);
  if (contentError) return res.status(400).json({ error: contentError });
  if (tempName) {
    const nameError = moderateContent(tempName);
    if (nameError) return res.status(400).json({ error: "Display name contains invalid words." });
  }
  try {
    const drop = await Drop.create(req.body);
    await Room.findByIdAndUpdate(req.body.roomId, { lastDropAt: Date.now() });
    res.json(drop);
  } catch (e) {
    res.status(500).json({ error: "Post failed." });
  }
});

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

// ✅ Clamped save — never goes below 0 in the database
app.post('/api/rooms/:id/save', async (req, res) => {
  try {
    const { action } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (action === 'increment') {
      room.savedCount = (room.savedCount || 0) + 1;
    } else {
      room.savedCount = Math.max(0, (room.savedCount || 0) - 1); // ✅ clamp at 0
    }

    await room.save();
    res.json(room);
  } catch (err) {
    console.error("Save toggle failed:", err);
    res.status(500).json({ error: "Save failed" });
  }
});

app.post('/api/drops/:id/reply', async (req, res) => {
  const { content, tempName, avatarIndex } = req.body;
  if (!content) return res.status(400).json({ error: "Write something first." });
  const contentError = moderateContent(content);
  if (contentError) return res.status(400).json({ error: contentError });
  if (tempName) {
    const nameError = moderateContent(tempName);
    if (nameError) return res.status(400).json({ error: "Display name contains invalid words." });
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
    console.error("Reply error:", err);
    return res.status(500).json({ error: "Server error processing reply" });
  }
});

mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(process.env.PORT || 5000, () => console.log("🚀 Server Live"));
});

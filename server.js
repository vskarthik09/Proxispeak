require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Avatar = require('./src/models/Avatar');

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'proxispeak-week1', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  const userId = socket.id;
  const avatar = { id: userId, x: 100 + Math.random() * 300, y: 100 + Math.random() * 200, name: `Guest-${userId.slice(0, 4)}` };
  socket.data.avatar = avatar;
  socket.emit('session:init', avatar);
  socket.broadcast.emit('avatar:joined', avatar);

  socket.on('avatar:move', async (payload = {}) => {
    const x = Number(payload.x);
    const y = Number(payload.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    // Keep coordinates in a sensible virtual-world range.
    avatar.x = Math.max(0, Math.min(2000, x));
    avatar.y = Math.max(0, Math.min(1200, y));
    socket.data.avatar = avatar;
    socket.broadcast.emit('avatar:moved', avatar);

    if (mongoose.connection.readyState === 1) {
      try {
        await Avatar.findOneAndUpdate(
          { socketId: userId },
          { socketId: userId, name: avatar.name, location: { type: 'Point', coordinates: [avatar.x, avatar.y] }, updatedAt: new Date() },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('Could not save avatar location:', err.message);
      }
    }
  });

  socket.on('disconnect', async () => {
    socket.broadcast.emit('avatar:left', { id: userId });
    if (mongoose.connection.readyState === 1) {
      try { await Avatar.deleteOne({ socketId: userId }); } catch (err) { console.error(err.message); }
    }
  });
});

const port = Number(process.env.PORT || 4000);
async function start() {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    try {
      await mongoose.connect(uri);
      console.log('MongoDB connected');
    } catch (err) {
      console.error('MongoDB connection failed:', err.message);
      console.log('Starting server without database persistence; fix MONGODB_URI to enable MongoDB.');
    }
  }
  server.listen(port, () => console.log(`ProxiSpeak server running at http://localhost:${port}`));
}
start();

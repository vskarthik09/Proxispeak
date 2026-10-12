const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
  socketId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Guest' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [x, y] for the virtual 2D world
  },
  updatedAt: { type: Date, default: Date.now }
});

avatarSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Avatar', avatarSchema);

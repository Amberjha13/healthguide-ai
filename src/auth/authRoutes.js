const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { sign } = require('./jwt');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

function requireDb(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'Database not available. Start MongoDB and retry.' });
    return false;
  }
  return true;
}

router.post('/register', async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username: username.toLowerCase(), password: hashed });
    const token = sign({ userId: user._id.toString(), username: user.username });
    res.status(201).json({ token, username: user.username });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = sign({ userId: user._id.toString(), username: user.username });
    res.json({ token, username: user.username });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

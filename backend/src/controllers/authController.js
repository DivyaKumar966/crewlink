import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import crypto from 'crypto';
import { promisify } from 'util';
const scrypt = promisify(crypto.scrypt);
async function hashPassword(password) { const salt = crypto.randomBytes(16).toString('hex'); const key = await scrypt(password, salt, 64); return `${salt}:${key.toString('hex')}`; }
async function verifyPassword(password, stored) { const [salt, hash] = String(stored || '').split(':'); if (!salt || !hash) return false; const key = await scrypt(password, salt, 64); const expected = Buffer.from(hash, 'hex'); return expected.length === key.length && crypto.timingSafeEqual(expected, key); }

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleLogin(req, res) {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential is required' });
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const profile = ticket.getPayload();
    if (!profile?.email || !profile.email_verified) return res.status(401).json({ message: 'Google email could not be verified' });

    let user = await User.findOne({ googleId: profile.sub });
    if (!user) user = await User.findOne({ email: profile.email });
    if (!user) user = await User.create({ googleId: profile.sub, name: profile.name || 'CREWLINK User', email: profile.email, avatar: profile.picture || '' });
    else {
      user.googleId = profile.sub;
      user.name = profile.name || user.name;
      user.avatar = profile.picture || user.avatar;
      await user.save();
    }
    if (user.disabled) return res.status(403).json({ message: 'This account has been disabled' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: safeUser(user), needsProfile: !user.githubUsername || !user.knownSkills.length });
  } catch (error) {
    console.error(error.message);
    res.status(401).json({ message: 'Google sign-in verification failed' });
  }
}

export function safeUser(user) {
  return { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, githubUsername: user.githubUsername, githubUrl: user.githubUrl, linkedinUrl: user.linkedinUrl, portfolioUrl: user.portfolioUrl, bio: user.bio, knownSkills: user.knownSkills, role: user.role };
}


export async function registerWithEmail(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: 'An account already exists with this email. Please sign in.' });
    const passwordHash = await hashPassword(password);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: safeUser(user), needsProfile: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create your account' });
  }
}

export async function loginWithEmail(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    if (!email || !password) return res.status(400).json({ message: 'Enter your email and password' });
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.disabled) return res.status(403).json({ message: 'This account has been disabled' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: safeUser(user), needsProfile: !user.githubUsername || !user.knownSkills.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not sign in' });
  }
}

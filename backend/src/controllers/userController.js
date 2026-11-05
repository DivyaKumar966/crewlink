import User from '../models/User.js';
import Project from '../models/Project.js';
import { safeUser } from './authController.js';

export async function getProfile(req, res) { res.json(safeUser(req.user)); }

export async function updateProfile(req, res) {
  const { githubUsername, githubUrl, linkedinUrl, portfolioUrl, knownSkills, bio } = req.body;
  const cleanUrl = value => { const v = String(value || '').trim(); if (!v) return ''; try { const u = new URL(v); return ['http:', 'https:'].includes(u.protocol) ? u.toString() : ''; } catch { return ''; } };
  req.user.githubUsername = String(githubUsername || '').replace(/^@/, '').trim().slice(0, 50);
  req.user.githubUrl = cleanUrl(githubUrl) || (req.user.githubUsername ? `https://github.com/${req.user.githubUsername}` : '');
  req.user.linkedinUrl = cleanUrl(linkedinUrl);
  req.user.portfolioUrl = cleanUrl(portfolioUrl);
  req.user.knownSkills = Array.isArray(knownSkills) ? [...new Set(knownSkills.map(String).map(x => x.trim()).filter(Boolean))].slice(0, 50) : [];
  req.user.bio = String(bio || '').slice(0, 1000);
  await req.user.save();
  res.json(safeUser(req.user));
}

export async function getPublicProfile(req, res) {
  const user = await User.findOne({ _id: req.params.userId, disabled: false }).select('name email avatar githubUsername githubUrl linkedinUrl portfolioUrl bio knownSkills createdAt');
  if (!user) return res.status(404).json({ message: 'Developer profile not found' });
  const led = await Project.find({ leader: user._id, deleted: false }).select('name description category technologies status createdAt');
  const joined = await Project.find({ 'members.user': user._id, 'members.status': 'active', deleted: false }).select('name description category technologies status createdAt');
  const projects = [
    ...led.map(p => ({ ...p.toObject(), participation: 'Leader', projectStatus: p.status === 'completed' ? 'Completed' : 'Active' })),
    ...joined.map(p => ({ ...p.toObject(), participation: 'Member', projectStatus: p.status === 'completed' ? 'Completed' : 'Active' })),
  ];
  res.json({ user, stats: { total: projects.length, active: projects.filter(p => p.projectStatus === 'Active').length, completed: projects.filter(p => p.projectStatus === 'Completed').length, led: led.length }, projects });
}

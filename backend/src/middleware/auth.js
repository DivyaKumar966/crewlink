import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Please sign in' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId);
    if (!user || user.disabled) return res.status(401).json({ message: 'Account is unavailable' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
}

export async function projectLeader(req, res, next) {
  const Project = (await import('../models/Project.js')).default;
  const project = await Project.findOne({ _id: req.params.projectId, deleted: false });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (String(project.leader) !== String(req.user._id)) return res.status(403).json({ message: 'Only the project leader can do this' });
  req.project = project;
  next();
}

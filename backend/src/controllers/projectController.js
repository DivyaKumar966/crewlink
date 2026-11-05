import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import { io } from '../sockets/socket.js';

export async function listProjects(req, res) {
  const { q, technology, category } = req.query;
  const filter = { deleted: false };
  if (category) filter.category = category;
  if (technology) {
    filter.technologies = technology === 'MERN Stack'
      ? { $all: ['React', 'Node.js', 'Express', 'MongoDB'] }
      : { $regex: `^${escapeRegex(technology)}$`, $options: 'i' };
  }
  if (q) filter.$or = [
    { name: { $regex: escapeRegex(q), $options: 'i' } },
    { description: { $regex: escapeRegex(q), $options: 'i' } },
    { technologies: { $regex: escapeRegex(q), $options: 'i' } }
  ];
  const projects = await Project.find(filter).populate('leader', 'name avatar').sort({ createdAt: -1 });
  res.json(projects);
}
function escapeRegex(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export async function createProject(req, res) {
  const { name, description, category, technologies, githubRepo, roles } = req.body;
  if (!name?.trim() || !description?.trim() || !Array.isArray(technologies) || !technologies.length || !Array.isArray(roles) || !roles.length)
    return res.status(400).json({ message: 'Complete the project details, stack and roles' });
  const project = await Project.create({ name, description, category, technologies, githubRepo, roles: roles.map(r => ({ name: r.name, required: Number(r.required), filled: 0 })), leader: req.user._id });
  res.status(201).json(project);
}

export async function getProject(req, res) {
  const project = await Project.findOne({ _id: req.params.id, deleted: false })
    .populate('leader', 'name avatar githubUsername')
    .populate('members.user', 'name avatar githubUsername')
    .populate('joinRequests.user', 'name email avatar');
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const isLeader = String(project.leader._id) === String(req.user._id);
  const isMember = project.members.some(m => String(m.user?._id || m.user) === String(req.user._id) && m.status === 'active');
  const tasks = (isLeader || isMember)
    ? await Task.find(isLeader ? { project: project._id } : { project: project._id, assignedTo: req.user._id }).populate('assignedTo', 'name avatar').populate('createdBy', 'name avatar')
    : [];
  const appliedRoleIds = project.joinRequests
    .filter(r => String(r.user?._id || r.user) === String(req.user._id) && r.status === 'pending')
    .map(r => String(r.roleId));
  res.json({ ...project.toObject(), tasks, isLeader, isMember, appliedRoleIds });
}


export async function getWorkspace(req, res) {
  const project = await Project.findOne({ _id: req.params.id, deleted: false })
    .populate('leader', 'name avatar githubUsername')
    .populate('members.user', 'name avatar githubUsername')
    .populate('joinRequests.user', 'name email avatar githubUsername githubUrl linkedinUrl portfolioUrl bio knownSkills');
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const isLeader = String(project.leader._id) === String(req.user._id);
  const isMember = project.members.some(m => String(m.user?._id || m.user) === String(req.user._id) && m.status === 'active');
  if (!isLeader && !isMember) return res.status(403).json({ message: 'Only the project leader and active crew members can open this workspace' });
  const tasks = await Task.find(isLeader ? { project: project._id } : { project: project._id, assignedTo: req.user._id })
    .populate('assignedTo', 'name avatar').populate('createdBy', 'name avatar').sort({ createdAt: -1 });
  res.json({ ...project.toObject(), tasks, isLeader, isMember });
}

export async function applyToProject(req, res) {
  const project = await Project.findOne({ _id: req.params.id, deleted: false });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (project.status === 'completed') return res.status(409).json({ message: 'This project has been marked completed and is no longer accepting applications.' });
  if (String(project.leader) === String(req.user._id)) return res.status(403).json({ message: 'You are the project leader. You cannot apply to your own project.' });
  const role = project.roles.id(req.body.roleId);
  if (!role || role.filled >= role.required) return res.status(409).json({ message: 'This role is already full' });
  if (project.members.some(m => String(m.user) === String(req.user._id) && m.status === 'active')) return res.status(409).json({ message: 'You are already a member' });
  if (project.joinRequests.some(a => String(a.user) === String(req.user._id) && String(a.roleId) === String(role._id) && a.status === 'pending')) return res.status(409).json({ message: 'You already applied for this role' });
  project.joinRequests.push({ user: req.user._id, roleId: role._id });
  await project.save();
  const notification = await Notification.create({
    recipient: project.leader,
    sender: req.user._id,
    project: project._id,
    type: 'application',
    message: `${req.user.name} applied for ${role.name}.`
  });
  const populatedNotification = await Notification.findById(notification._id)
    .populate('sender', 'name avatar')
    .populate('project', 'name');
  io?.to(`user:${project.leader}`).emit('notification:new', populatedNotification);
  res.status(201).json({ message: 'Application sent to the project leader' });
}

export async function reviewApplication(req, res) {
  const project = await Project.findOne({ _id: req.params.id, leader: req.user._id, deleted: false });
  if (!project) return res.status(404).json({ message: 'Project not found or you are not the leader' });
  const request = project.joinRequests.id(req.params.requestId);
  if (!request || request.status !== 'pending') return res.status(404).json({ message: 'Pending request not found' });
  if (req.body.approve) {
    const role = project.roles.id(request.roleId);
    if (!role || role.filled >= role.required) return res.status(409).json({ message: 'No vacancy in this role' });
    role.filled += 1;
    project.members.push({ user: request.user, roleId: role._id, status: 'active' });
    request.status = 'approved';
  } else request.status = 'rejected';
  await project.save();
  await Notification.create({
    recipient: request.user,
    sender: req.user._id,
    project: project._id,
    type: req.body.approve ? 'approved' : 'rejected',
    message: req.body.approve ? `Your application to ${project.name} was approved.` : `Your application to ${project.name} was declined.`
  });
  const latestNotification = await Notification.findOne({ recipient: request.user, project: project._id }).sort({ createdAt: -1 })
    .populate('sender', 'name avatar').populate('project', 'name');
  io?.to(`user:${request.user}`).emit('notification:new', latestNotification);
  res.json({ message: `Application ${request.status}` });
}

export async function myProjects(req, res) {
  const projects = await Project.find({ deleted: false, $or: [{ leader: req.user._id }, { 'members.user': req.user._id, 'members.status': 'active' }] }).populate('leader', 'name avatar');
  res.json(projects);
}

export async function projectRequests(req, res) {
  const project = await Project.findOne({ _id: req.params.id, leader: req.user._id, deleted: false }).populate('joinRequests.user', 'name email avatar githubUsername githubUrl linkedinUrl portfolioUrl bio knownSkills');
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project.joinRequests.filter(r => r.status === 'pending'));
}

export async function leaveProject(req, res) {
  const project = await Project.findOne({ _id: req.params.id, deleted: false });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (String(project.leader) === String(req.user._id)) return res.status(403).json({ message: 'Project leaders cannot leave their own project. Transfer leadership or delete the project instead.' });
  const member = project.members.find(m => String(m.user) === String(req.user._id) && m.status === 'active');
  if (!member) return res.status(404).json({ message: 'You are not an active member of this project' });
  member.status = 'left';
  const role = project.roles.id(member.roleId);
  if (role) role.filled = Math.max(0, role.filled - 1);
  await project.save();
  await Task.updateMany({ project: project._id, assignedTo: req.user._id, status: { $ne: 'Completed' } }, { $set: { status: 'To do' } });
  const notification = await Notification.create({ recipient: project.leader, sender: req.user._id, project: project._id, type: 'member_left', message: `${req.user.name} left ${project.name}. The role is open again.` });
  const populated = await Notification.findById(notification._id).populate('sender', 'name avatar').populate('project', 'name');
  io?.to(`user:${project.leader}`).emit('notification:new', populated);
  io?.to(`project:${project._id}`).emit('member:left', { userId: String(req.user._id) });
  res.json({ message: 'You left the project. The role is now open.' });
}

export async function updateProjectStatus(req, res) {
  const project = await Project.findOne({ _id: req.params.id, leader: req.user._id, deleted: false });
  if (!project) return res.status(404).json({ message: 'Project not found or you are not the leader' });
  if (!['active', 'completed'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid project status' });
  project.status = req.body.status;
  await project.save();
  res.json({ message: `Project marked ${project.status}`, status: project.status });
}

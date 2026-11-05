import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { io } from '../sockets/socket.js';

async function notify(recipient, sender, project, type, message) {
  const item = await Notification.create({ recipient, sender, project, type, message });
  const populated = await Notification.findById(item._id).populate('sender', 'name avatar').populate('project', 'name');
  io?.to(`user:${recipient}`).emit('notification:new', populated);
  return populated;
}

export async function createTask(req, res) {
  const project = await Project.findOne({ _id: req.params.projectId, leader: req.user._id, deleted: false });
  if (!project) return res.status(403).json({ message: 'Only the project leader can assign targets' });
  const member = project.members.find(m => String(m.user) === String(req.body.assignedTo) && m.status === 'active');
  if (!member) return res.status(400).json({ message: 'Select an active crew member' });
  if (!req.body.title?.trim()) return res.status(400).json({ message: 'Enter a task description' });
  const task = await Task.create({ project: project._id, title: req.body.title.trim(), assignedTo: member.user, createdBy: req.user._id, dueDate: req.body.dueDate });
  const populated = await Task.findById(task._id).populate('assignedTo', 'name avatar').populate('createdBy', 'name avatar');
  io?.to(`project:${project._id}`).emit('task:created', populated);
  await notify(member.user, req.user._id, project._id, 'task_assigned', `A new task was assigned to you: ${task.title}`);
  res.status(201).json(populated);
}

export async function updateTaskStatus(req, res) {
  const task = await Task.findOne({ _id: req.params.taskId, project: req.params.projectId }).populate('project');
  if (!task || task.project.deleted) return res.status(404).json({ message: 'Task not found' });
  const isAssignee = String(task.assignedTo) === String(req.user._id);
  const isLeader = String(task.project.leader) === String(req.user._id);
  if (!isAssignee && !isLeader) return res.status(403).json({ message: 'This task is assigned to another member' });
  const allowed = ['To do', 'In progress', 'Completed'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid task status' });
  if (isLeader && !isAssignee) return res.status(403).json({ message: 'Only the assigned member can update task progress' });
  task.status = req.body.status;
  await task.save();
  const populated = await Task.findById(task._id).populate('assignedTo', 'name avatar').populate('createdBy', 'name avatar');
  io?.to(`project:${task.project._id}`).emit('task:updated', populated);
  const type = task.status === 'In progress' ? 'task_started' : task.status === 'Completed' ? 'task_completed' : null;
  if (type) await notify(task.project.leader, req.user._id, task.project._id, type, `${req.user.name} ${task.status === 'In progress' ? 'started' : 'completed'}: ${task.title}`);
  res.json(populated);
}

export async function warnMember(req, res) {
  const project = await Project.findOne({ _id: req.params.projectId, leader: req.user._id, deleted: false });
  if (!project) return res.status(403).json({ message: 'Only the project leader can issue warnings' });
  const member = project.members.id(req.params.memberId);
  if (!member || member.status !== 'active' || String(member.user) === String(req.user._id)) return res.status(404).json({ message: 'Active crew member not found' });
  const reason = String(req.body.reason || '').trim();
  if (reason.length < 5) return res.status(400).json({ message: 'Please enter a warning reason (at least 5 characters)' });
  member.warningCount += 1;
  member.warnings.push({ reason });
  await project.save();
  await notify(member.user, req.user._id, project._id, 'member_warning', `Project leader warning: ${reason}`);
  io?.to(`project:${project._id}`).emit('member:warned', { memberId: member._id, warningCount: member.warningCount });
  res.json({ message: 'Warning issued', warningCount: member.warningCount, warnings: member.warnings });
}

export async function removeMember(req, res) {
  const project = await Project.findOne({ _id: req.params.projectId, leader: req.user._id, deleted: false });
  if (!project) return res.status(403).json({ message: 'Only the project leader can remove members' });
  const member = project.members.id(req.params.memberId);
  if (!member || member.status !== 'active' || String(member.user) === String(req.user._id)) return res.status(404).json({ message: 'Active crew member not found' });
  if (member.warningCount < 1 || !member.warnings?.length) return res.status(409).json({ message: 'Issue and save a warning before removing this member' });
  member.status = 'removed';
  const role = project.roles.id(member.roleId);
  if (role) role.filled = Math.max(0, role.filled - 1);
  await project.save();
  await Task.updateMany({ project: project._id, assignedTo: member.user, status: { $ne: 'Completed' } }, { $set: { status: 'To do' } });
  await notify(member.user, req.user._id, project._id, 'member_removed', `You were removed from ${project.name}. Contact the project leader if you need clarification.`);
  io?.to(`project:${project._id}`).emit('member:removed', { memberId: member._id });
  res.json({ message: 'Crew member removed and role reopened' });
}

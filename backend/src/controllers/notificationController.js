import Notification from '../models/Notification.js';

export async function listNotifications(req, res) {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate('sender', 'name avatar')
    .populate('project', 'name')
    .sort({ createdAt: -1 })
    .limit(40);
  const unread = await Notification.countDocuments({ recipient: req.user._id, read: false });
  res.json({ notifications, unread });
}

export async function markNotificationRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json(notification);
}

export async function markAllNotificationsRead(req, res) {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ message: 'Notifications marked as read' });
}

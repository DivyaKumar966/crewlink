import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/notificationController.js';

const router = Router();
router.use(auth);
router.get('/', listNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

export default router;

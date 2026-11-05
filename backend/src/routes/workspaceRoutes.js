import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createTask, updateTaskStatus, warnMember, removeMember } from '../controllers/workspaceController.js';
const router = Router();
router.post('/:projectId/tasks', auth, createTask);
router.patch('/:projectId/tasks/:taskId/status', auth, updateTaskStatus);
router.post('/:projectId/members/:memberId/warn', auth, warnMember);
router.delete('/:projectId/members/:memberId', auth, removeMember);
export default router;

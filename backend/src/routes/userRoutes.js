import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getProfile, updateProfile, getPublicProfile } from '../controllers/userController.js';
const router=Router();
router.get('/profile',auth,getProfile);
router.put('/profile',auth,updateProfile);
router.get('/:userId/public',auth,getPublicProfile);
export default router;

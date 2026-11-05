import { Router } from 'express';
import { googleLogin, registerWithEmail, loginWithEmail } from '../controllers/authController.js';
const router = Router();
router.post('/google', googleLogin);
router.post('/register', registerWithEmail);
router.post('/login', loginWithEmail);
export default router;

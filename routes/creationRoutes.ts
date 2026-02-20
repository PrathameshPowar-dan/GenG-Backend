import express from 'express';
import { protect } from '../middlewares/auth.js';
import { createImageCreation, createVideoCreation, deleteCreation } from '../controllers/creations/creationsController.js';

const router = express.Router();

router.post('/image', protect, createImageCreation);
router.post('/video', protect, createVideoCreation);
router.delete('/delete/:id', protect, deleteCreation);

export default router;
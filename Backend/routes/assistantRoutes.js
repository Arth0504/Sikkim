import express from 'express';
const router = express.Router();

import { handleChatQuery } from '../controllers/assistantController.js';

router.post('/chat', handleChatQuery);

export default router;

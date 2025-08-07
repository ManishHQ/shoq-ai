import express from 'express';
import {
	processMessage,
	getCategories,
	getPopularProducts,
	getChatSuggestions
} from '../controllers/chat.controller.js';

const router = express.Router();

// Chat endpoints
router.post('/message', processMessage);
router.get('/categories', getCategories);
router.get('/popular', getPopularProducts);
router.get('/suggestions', getChatSuggestions);

export default router;
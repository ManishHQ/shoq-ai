import { Request, Response, RequestHandler } from 'express';
import GeminiService from '../services/geminiService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

const geminiService = new GeminiService();

// Hardcoded shop items data (matching shop.route.ts)
const SHOP_ITEMS = [
	{
		id: 1,
		name: 'T-Shirt',
		price: 20,
		category: 'Clothing',
		available: true,
		description: 'Comfortable cotton t-shirt',
		stock: 50,
		image: 'https://via.placeholder.com/300x300?text=T-Shirt',
	},
	{
		id: 2,
		name: 'Coffee Mug',
		price: 8,
		category: 'Home',
		available: true,
		description: 'Ceramic coffee mug',
		stock: 100,
		image: 'https://via.placeholder.com/300x300?text=Coffee+Mug',
	},
	{
		id: 3,
		name: 'Phone Case',
		price: 15,
		category: 'Electronics',
		available: true,
		description: 'Protective phone case',
		stock: 75,
		image: 'https://via.placeholder.com/300x300?text=Phone+Case',
	},
	{
		id: 4,
		name: 'Book - Programming Guide',
		price: 25,
		category: 'Books',
		available: false,
		description: 'Complete programming guide',
		stock: 0,
		image: 'https://via.placeholder.com/300x300?text=Book',
	},
	{
		id: 5,
		name: 'Headphones',
		price: 80,
		category: 'Electronics',
		available: true,
		description: 'Wireless Bluetooth headphones',
		stock: 30,
		image: 'https://via.placeholder.com/300x300?text=Headphones',
	},
	{
		id: 6,
		name: 'Laptop Stand',
		price: 35,
		category: 'Electronics',
		available: true,
		description: 'Adjustable laptop stand',
		stock: 25,
		image: 'https://via.placeholder.com/300x300?text=Laptop+Stand',
	},
	{
		id: 7,
		name: 'Water Bottle',
		price: 12,
		category: 'Home',
		available: true,
		description: 'Stainless steel water bottle',
		stock: 60,
		image: 'https://via.placeholder.com/300x300?text=Water+Bottle',
	},
	{
		id: 8,
		name: 'Notebook',
		price: 5,
		category: 'Office',
		available: true,
		description: 'Spiral-bound notebook',
		stock: 200,
		image: 'https://via.placeholder.com/300x300?text=Notebook',
	},
	{
		id: 9,
		name: 'Wireless Mouse',
		price: 25,
		category: 'Electronics',
		available: true,
		description: 'Ergonomic wireless mouse',
		stock: 40,
		image: 'https://via.placeholder.com/300x300?text=Mouse',
	},
	{
		id: 10,
		name: 'Desk Lamp',
		price: 45,
		category: 'Home',
		available: true,
		description: 'LED desk lamp with adjustable brightness',
		stock: 20,
		image: 'https://via.placeholder.com/300x300?text=Desk+Lamp',
	},
];

interface ChatMessage {
	id: string;
	type: 'user' | 'assistant';
	content: string;
	timestamp: Date;
	products?: any[];
}

// Process chat message and return AI response
const processMessage: RequestHandler = catchAsync(async (req: Request, res: Response) => {
	const { message, sessionId = 'default' } = req.body;

	if (!message || typeof message !== 'string') {
		return res.status(400).json({
			status: 'error',
			message: 'Message is required and must be a string',
		});
	}

	try {
		console.log(`💬 Processing message: "${message}"`);

		// Get AI response from Gemini
		const aiResponse = await geminiService.processMessage(message, 1);
		console.log('🤖 AI Response:', aiResponse);

		// Process any actions
		let products: any[] = [];
		let finalMessage = aiResponse.message;

		if (aiResponse.action) {
			const actionResult = await processAction(aiResponse.action, message);
			if (actionResult.products) {
				products = actionResult.products;
			}
			if (actionResult.message) {
				finalMessage = actionResult.message;
			}
		}

		// Create response message
		const response: ChatMessage = {
			id: Date.now().toString(),
			type: 'assistant',
			content: finalMessage,
			timestamp: new Date(),
			products: products.length > 0 ? products : undefined,
		};

		res.json({
			status: 'success',
			data: {
				message: response,
			},
		});

	} catch (error) {
		console.error('Chat processing error:', error);
		res.status(500).json({
			status: 'error',
			message: 'Failed to process message',
			data: {
				message: {
					id: Date.now().toString(),
					type: 'assistant',
					content: "I'm having trouble right now. Could you try asking me something else? 😊",
					timestamp: new Date(),
				}
			}
		});
	}
});

// Process AI actions (search, recommendations, etc.)
const processAction = async (action: any, originalMessage: string) => {
	const { action: actionType, parameters, confidence } = action;
	
	console.log(`🎯 Processing action: ${actionType}`, parameters);

	switch (actionType) {
		case 'SEARCH_ITEMS':
		case 'PURCHASE_ITEM':
			return searchProducts(parameters.query || parameters.item || originalMessage);
		
		case 'GET_RECOMMENDATIONS':
			return getRecommendations(parameters.category || parameters.preference);
		
		case 'SEARCH_TICKETS':
		case 'BOOK_TICKET':
			return {
				message: "🎫 I can help you with shopping right now! For tickets, please use our ticket booking system. Would you like to see our shop items instead?",
				products: []
			};
		
		default:
			return { message: null, products: [] };
	}
};

// Search products based on query
const searchProducts = (query: string) => {
	if (!query) {
		return {
			message: "Here are all our available products:",
			products: SHOP_ITEMS.filter(item => item.available)
		};
	}

	const searchTerms = query.toLowerCase().split(' ');
	const matchingProducts = SHOP_ITEMS.filter(product => {
		const searchableText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
		return searchTerms.some(term => searchableText.includes(term)) && product.available;
	});

	if (matchingProducts.length > 0) {
		return {
			message: `I found ${matchingProducts.length} product${matchingProducts.length > 1 ? 's' : ''} matching "${query}":`,
			products: matchingProducts.slice(0, 6)
		};
	} else {
		return {
			message: `I couldn't find any products matching "${query}". Here are some popular items you might like:`,
			products: SHOP_ITEMS.filter(item => item.available && item.stock > 30).slice(0, 4)
		};
	}
};

// Get product recommendations
const getRecommendations = (category?: string) => {
	let recommendedProducts;
	let message;

	if (category) {
		recommendedProducts = SHOP_ITEMS.filter(
			item => item.category.toLowerCase() === category.toLowerCase() && item.available
		);
		message = `Here are our ${category.toLowerCase()} products:`;
	} else {
		// Recommend popular items (high stock = popular)
		recommendedProducts = SHOP_ITEMS.filter(item => item.available && item.stock > 30);
		message = "Here are some popular items I'd recommend:";
	}

	return {
		message,
		products: recommendedProducts.slice(0, 6)
	};
};

// Get product categories
const getCategories: RequestHandler = catchAsync(async (req: Request, res: Response) => {
	const categories = [
		{ id: 1, name: 'Clothing', count: 1 },
		{ id: 2, name: 'Home', count: 3 },
		{ id: 3, name: 'Electronics', count: 4 },
		{ id: 4, name: 'Books', count: 1 },
		{ id: 5, name: 'Office', count: 1 },
	];

	res.json({
		status: 'success',
		data: { categories },
	});
});

// Get popular products for chat suggestions
const getPopularProducts: RequestHandler = catchAsync(async (req: Request, res: Response) => {
	const popularProducts = SHOP_ITEMS
		.filter(item => item.available && item.stock > 20)
		.sort((a, b) => b.stock - a.stock)
		.slice(0, 6);

	res.json({
		status: 'success',
		data: {
			products: popularProducts,
			total: popularProducts.length
		},
	});
});

// Get chat suggestions/quick responses
const getChatSuggestions: RequestHandler = catchAsync(async (req: Request, res: Response) => {
	const suggestions = [
		"Show me all products",
		"I'm looking for electronics",
		"What's affordable under $20?",
		"Show me headphones",
		"What home products do you have?",
		"I need office supplies",
		"Show me popular items",
		"What's new in clothing?"
	];

	res.json({
		status: 'success',
		data: { suggestions },
	});
});

export {
	processMessage,
	getCategories,
	getPopularProducts,
	getChatSuggestions
};
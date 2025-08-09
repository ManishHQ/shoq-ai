import express from 'express';
import { Request, Response } from 'express';
import connectDB from './utils/connectDB.js';
import globalError from './middlewares/globalError.middleware.js';
import notFound from './middlewares/notFound.middleware.js';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import TelegramBotService from './services/telegramBot.js';
import productService from './services/productService.js';

dotenv.config();

// route imports
import authRoutes from './routes/auth.route.js';
import ticketsRoutes from './routes/tickets.route.js';
import shopRoutes from './routes/shop.route.js';
import debugRoutes from './routes/debug.route.js';
import usdcRoutes from './routes/usdc.route.js';
import tokenRoutes from './routes/token.route.js';
import chatRoutes from './routes/chat.route.js';
import purchaseRoutes from './routes/purchase.route.js';
import depositRoutes from './routes/deposit.route.js';
import ordersRoutes from './routes/orders.route.js';

// init app
const app = express();

// constants
const PORT = process.env.PORT || 8000;

// connect to database
connectDB(
	(process.env.MONGO_URL as string) || 'mongodb://localhost:27017/shoq'
);

// middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// CORS configuration for production and development
const allowedOrigins =
	process.env.NODE_ENV === 'production'
		? ['https://shoq.live', 'https://www.shoq.live', 'https://api.shoq.live']
		: [
				'http://localhost:5173',
				'http://localhost:3000',
				'http://localhost:3001',
			];

app.use(
	cors({
		origin: function (origin, callback) {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);

			if (allowedOrigins.indexOf(origin) !== -1) {
				callback(null, true);
			} else {
				console.log('Blocked origin:', origin);
				callback(new Error('Not allowed by CORS'));
			}
		},
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
		exposedHeaders: ['Access-Control-Allow-Origin'],
		credentials: true,
		preflightContinue: false,
		optionsSuccessStatus: 204,
		maxAge: 86400, // Cache preflight results for 24 hours
	})
);

// routes
app.use('/auth', authRoutes);
app.use('/tickets', ticketsRoutes);
app.use('/shop', shopRoutes);
app.use('/debug', debugRoutes);
app.use('/usdc', usdcRoutes);
app.use('/token', tokenRoutes);
app.use('/chat', chatRoutes);
app.use('/purchase', purchaseRoutes);
app.use('/deposits', depositRoutes);
app.use('/api/orders', ordersRoutes);

// test route
app.use('/test', (req: Request, res: Response) => {
	res.json({ status: 'success', message: 'Test route' });
});

// not found
app.use('*', notFound);

// global error handler
app.use(globalError);

app.get('/', (req: Request, res: Response) => {
	res.json({ message: 'Hello World' });
});

// Initialize Telegram bot
const telegramBot = new TelegramBotService();

app.listen(PORT, async () => {
	console.log(`Server is running on http://localhost:${PORT}`);
	console.log(`🤖 Telegram bot is ready!`);

	// Initialize default products
	try {
		await productService.initializeDefaultProducts();
		console.log('✅ Products initialized successfully');
	} catch (error) {
		console.error('❌ Error initializing products:', error);
	}

	// Start the Telegram bot
	telegramBot.start();
});

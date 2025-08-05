import express from 'express';
import { Request, Response } from 'express';
import connectDB from './utils/connectDB.js';
import globalError from './middlewares/globalError.middleware.js';
import notFound from './middlewares/notFound.middleware.js';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import TelegramBotService from './services/telegramBot.js';

dotenv.config();

// route imports
import authRoutes from './routes/auth.route.js';
import ticketsRoutes from './routes/tickets.route.js';
import shopRoutes from './routes/shop.route.js';
import debugRoutes from './routes/debug.route.js';

// init app
const app = express();

// constants
const PORT = process.env.PORT || 8000;

// connect to database
// connectDB((process.env.MONGO_URL as string) || '');

// middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(
	cors({
		origin: function (origin, callback) {
			const allowedOrigins = [
				'https://superpa.ge',
				'https://www.superpa.ge',
				'https://api.superpa.ge',
				'http://localhost:5173',
				'http://localhost:3000',
				'chrome-extension://lgkfiojcgedoedeiopkeaemkhenogmhf',
				'https://github.com',
				'https://www.github.com',
				'https://www.youtube.com',
				'https://youtube.com',
				'https://x.com',
				'https://www.x.com',
			];

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

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
	console.log(`🤖 Telegram bot is ready!`);

	// Start the Telegram bot
	telegramBot.start();
});

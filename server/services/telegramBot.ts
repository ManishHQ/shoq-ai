import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import GeminiService from './geminiService.js';
import ActionHandler from './actionHandler.js';
import LoggingService from './loggingService.js';
import User from '../models/user.model.js';
import { depositService } from './depositService.js';
import { orderService } from './orderService.js';
import productService from './productService.js';
import emailService from './emailService.js';
import { HederaAIAgent } from '../ai-tools/hedera-agent.js';
import { hederaVerificationService } from './hederaVerificationService.js';

dotenv.config();

// Hardcoded data for demonstration
const TICKETS = [
	{ id: 1, name: 'Movie Ticket - Avengers', price: 15, available: true },
	{ id: 2, name: 'Concert - Rock Band', price: 50, available: true },
	{ id: 3, name: 'Theater - Hamlet', price: 30, available: false },
	{ id: 4, name: 'Sports - Football Match', price: 25, available: true },
];

class TelegramBotService {
	private bot: TelegramBot;
	private userStates: Map<number, any> = new Map();
	private geminiService: GeminiService | null;
	private actionHandler: ActionHandler;
	private conversationContext: Map<number, any> = new Map();
	private loggingService: LoggingService;
	private pendingDeposits: Map<number, { step: string; data?: any }> =
		new Map();
	private processedTransactions: Set<string> = new Set(); // Track processed transaction hashes
	private hederaAgent: HederaAIAgent;

	constructor() {
		const token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
		this.bot = new TelegramBot(token, { polling: true });

		// Initialize services
		this.loggingService = new LoggingService();

		// Initialize Gemini service with error handling
		try {
			this.geminiService = new GeminiService();
			console.log('🤖 Gemini AI Service initialized successfully');
		} catch (error: any) {
			console.error('❌ Failed to initialize Gemini AI:', error.message);
			this.geminiService = null;
		}

		// Initialize action handler
		this.actionHandler = new ActionHandler();

		// Initialize Hedera AI agent
		this.hederaAgent = new HederaAIAgent();

		this.setupHandlers();
	}

	private setupHandlers() {
		// Start command
		this.bot.onText(/\/start/, this.handleStart.bind(this));

		// Help command
		this.bot.onText(/\/help/, this.handleHelp.bind(this));

		// Book tickets command
		this.bot.onText(/\/tickets/, this.handleTickets.bind(this));

		// Shop command
		this.bot.onText(/\/shop/, this.handleShop.bind(this));

		// Chat command
		this.bot.onText(/\/chat/, this.handleChat.bind(this));

		// Clear conversation command
		this.bot.onText(/\/clear/, this.handleClearConversation.bind(this));

		// Conversation history command
		this.bot.onText(/\/history/, this.handleConversationHistory.bind(this));

		// Order summary command
		this.bot.onText(/\/summary/, this.handleOrderSummary.bind(this));

		// Hedera commands
		this.bot.onText(/\/verify (.+)/, this.handleVerifyTransaction.bind(this));
		this.bot.onText(/\/balance (.+)/, this.handleCheckBalance.bind(this));
		this.bot.onText(/\/hstatus (.+)/, this.handleTransactionStatus.bind(this));
		this.bot.onText(/\/hnetwork/, this.handleNetworkInfo.bind(this));

		// Handle callback queries (button clicks)
		this.bot.on('callback_query', this.handleCallbackQuery.bind(this));

		// Handle text messages
		this.bot.on('message', this.handleMessage.bind(this));

		// Handle bot errors
		this.bot.on('error', (error) => {
			console.error('🤖 Bot error:', error);
		});

		// Handle polling errors
		this.bot.on('polling_error', (error) => {
			console.error('🔄 Polling error:', error);
		});
	}

	private async handleStart(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;
		const username = msg.from?.username || '';
		const firstName = msg.from?.first_name || '';

		try {
			// Check if user exists in database
			let user = await User.findOne({ chatId });

			if (!user) {
				// Check if user exists by email (in case they used another onboarding method)
				const existingUserByEmail = await User.findOne({
					$or: [
						{ email: { $exists: true, $ne: null } },
						{ walletAddress: { $exists: true, $ne: null } },
					],
				});

				if (existingUserByEmail) {
					// User exists but doesn't have chatId - ask for email to link accounts
					await this.askForEmailToLinkAccount(chatId, firstName, username);
					return;
				}

				// New user - start onboarding flow
				await this.startOnboarding(chatId, firstName, username);
				return;
			} else {
				// Existing user - check if they have email
				if (!user.email) {
					await this.askForEmail(chatId, user);
					return;
				}

				console.log(`👋 Existing user: ${username} (${chatId})`);
				await this.showWelcomeMessage(chatId, user, false); // false = existing user
			}
		} catch (error) {
			console.error('Error in handleStart:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Sorry, there was an error processing your request. Please try again.'
			);
		}
	}

	private async startOnboarding(
		chatId: number,
		firstName: string,
		username: string
	) {
		const welcomeMessage = `
🎉 Welcome to Shoq Bot!

I'm your friendly shopping and ticket assistant! 🎊

To get started, I need your email address to:
📧 Send order confirmations and receipts
📱 Link your account across platforms
🔔 Keep you updated on your orders

Please send me your email address:
        `;

		// Store user state for email collection
		this.userStates.set(chatId, {
			step: 'collecting_email',
			data: {
				firstName,
				username,
				isNewUser: true,
			},
		});

		await this.bot.sendMessage(chatId, welcomeMessage, {
			parse_mode: 'Markdown',
		});
	}

	private async askForEmailToLinkAccount(
		chatId: number,
		firstName: string,
		username: string
	) {
		const message = `
👋 Welcome back!

I see you might have used our platform before. To link your Telegram account with your existing profile, please send me your email address.

This will help us:
📧 Connect your accounts
📱 Sync your order history
🔔 Send you updates

Please send me your email address:
        `;

		this.userStates.set(chatId, {
			step: 'linking_account',
			data: {
				firstName,
				username,
			},
		});

		await this.bot.sendMessage(chatId, message, {
			parse_mode: 'Markdown',
		});
	}

	private async askForEmail(chatId: number, user: any) {
		const message = `
📧 Email Required

Hi ${user.name}! I need your email address to:
📧 Send order confirmations and receipts
📱 Link your account across platforms
🔔 Keep you updated on your orders

Please send me your email address:
        `;

		this.userStates.set(chatId, {
			step: 'collecting_email',
			data: {
				existingUser: user,
			},
		});

		await this.bot.sendMessage(chatId, message, {
			parse_mode: 'Markdown',
		});
	}

	private async showWelcomeMessage(
		chatId: number,
		user: any,
		isNewUser: boolean = false
	) {
		// Send welcome email only to new users
		if (isNewUser && user.email) {
			try {
				console.log(`📧 Sending welcome email to new user: ${user.email}`);
				const welcomeEmailData = {
					user: {
						name: user.name,
						email: user.email,
						username: user.username,
						chatId: user.chatId,
					},
					onboardingMethod: 'telegram' as const,
				};

				const emailSent = await emailService.sendWelcomeEmail(welcomeEmailData);
				if (emailSent) {
					console.log(`📧 Welcome email sent to ${user.email}`);
				} else {
					console.log(`⚠️ Failed to send welcome email to ${user.email}`);
				}
			} catch (error) {
				console.error('Error sending welcome email:', error);
			}
		} else if (user.email) {
			console.log(`📧 Skipping welcome email for existing user: ${user.email}`);
		}

		const welcomeMessage = `
🎉 Welcome back to Shoq Bot!

I'm your friendly shopping and ticket assistant! 🎊

I can help you with:
🎫 **Booking tickets** for movies, concerts, sports, theater
🛍️ **Shopping for items** like electronics, clothing, home goods
💰 **Checking prices** and comparing options
✨ **Getting recommendations** based on your preferences

💰 **Your current balance: $${user.balance}**

To start shopping, you'll need to deposit USDC to your account.
Would you like to make a deposit?

Just chat with me naturally - I'll understand what you need! 😊
        `;

		const keyboard = {
			inline_keyboard: [
				[
					{ text: '💰 Make Deposit', callback_data: 'deposit' },
					{ text: '💳 Check Balance', callback_data: 'balance' },
				],
				[
					{ text: '🛍️ Start Shopping', callback_data: 'shop' },
					{ text: '❓ Help', callback_data: 'help' },
				],
			],
		};

		await this.bot.sendMessage(chatId, welcomeMessage, {
			parse_mode: 'Markdown',
			reply_markup: keyboard,
		});
	}

	private async handleHelp(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;
		const helpMessage = `
📖 **Help Guide**

**Available Commands:**
/start - Start the bot
/tickets - Browse and book tickets
/shop - Browse and buy items
/summary - View order summary and statistics
/history - View conversation history
/clear - Clear conversation history
/help - Show this help message

**🔧 Hedera Commands:**
/verify [tx-id] - Verify USDC transaction
/balance [account-id] - Check account balance
/hstatus [tx-id] - Get transaction status
/hnetwork - Show network info

**How to use:**
1. Use /tickets to see available tickets
2. Use /shop to browse items
3. Chat naturally - I understand requests like "buy me headphones"
4. Click on buttons to navigate and confirm purchases
5. Follow the prompts to complete your order

**Features:**
- Real-time ticket availability
- Secure booking process with confirmation
- Balance checking before purchases
- Order tracking and management
- Conversation history tracking
- Order summaries with spending statistics

Need more help? Contact support!
    `;

		await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
	}

	private async handleTickets(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;
		await this.showTickets(chatId);
	}

	private async handleShop(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;
		await this.showShopItems(chatId);
	}

	private async showTickets(chatId: number) {
		const availableTickets = TICKETS.filter((ticket) => ticket.available);

		if (availableTickets.length === 0) {
			await this.bot.sendMessage(
				chatId,
				'❌ No tickets available at the moment.'
			);
			return;
		}

		let message = '🎫 **Available Tickets:**\n\n';
		const keyboard = {
			inline_keyboard: availableTickets.map((ticket) => [
				{
					text: `${ticket.name} - $${ticket.price}`,
					callback_data: `ticket_${ticket.id}`,
				},
			]),
		};

		availableTickets.forEach((ticket) => {
			message += `🎫 **${ticket.name}**\n💰 Price: $${ticket.price}\n\n`;
		});

		message += 'Click on a ticket to book it!';

		await this.bot.sendMessage(chatId, message, {
			parse_mode: 'Markdown',
			reply_markup: keyboard,
		});
	}

	private async showShopItems(chatId: number) {
		try {
			// Check user balance first
			const user = await User.findOne({ chatId });
			if (!user) {
				await this.bot.sendMessage(
					chatId,
					'❌ Please use /start to register first.'
				);
				return;
			}

			// Get available products from database
			const productResult = await productService.getAvailableProducts();

			if (
				!productResult.success ||
				!productResult.products ||
				productResult.products.length === 0
			) {
				await this.bot.sendMessage(
					chatId,
					'❌ No items available at the moment.'
				);
				return;
			}

			const availableItems = productResult.products;

			let message = `🛍️ **Available Items**\n\n💰 **Your Balance:** $${user.balance} USDC\n\n`;
			const keyboard = {
				inline_keyboard: availableItems.map((item) => [
					{
						text: `${item.name} - $${item.price} ${user.balance >= item.price ? '✅' : '❌'}`,
						callback_data: `item_${item.productId}`,
					},
				]),
			};

			availableItems.forEach((item) => {
				const canAfford =
					user.balance >= item.price ? '✅ Affordable' : '❌ Need more funds';
				message += `🛍️ **${item.name}**\n💰 Price: $${item.price}\n📂 Category: ${item.category}\n📦 Stock: ${item.stockQuantity}\n${canAfford}\n\n`;
			});

			message +=
				user.balance === 0
					? '💡 **Make a deposit first to start shopping!**'
					: 'Click on an item to buy it!';

			const extraButtons =
				user.balance === 0
					? [[{ text: '💰 Make Deposit', callback_data: 'deposit' }]]
					: [[{ text: '💳 Check Balance', callback_data: 'balance' }]];

			keyboard.inline_keyboard.push(...extraButtons);

			await this.bot.sendMessage(chatId, message, {
				parse_mode: 'Markdown',
				reply_markup: keyboard,
			});
		} catch (error) {
			console.error('Error showing shop items:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error loading shop items. Please try again.'
			);
		}
	}

	private async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
		const chatId = query.message?.chat.id;
		const data = query.data;

		console.log('🔘 === CALLBACK QUERY DEBUG ===');
		console.log('🔘 Callback Data:', data);
		console.log('🔘 Chat ID:', chatId);

		if (!chatId || !data) return;

		// Answer the callback query with error handling
		try {
			await this.bot.answerCallbackQuery(query.id);
		} catch (error: any) {
			// Handle expired callback queries gracefully
			if (
				error.response?.body?.error_code === 400 &&
				error.response?.body?.description?.includes('query is too old')
			) {
				console.log('⚠️ Callback query expired, continuing with action');
			} else {
				console.error('Error answering callback query:', error);
			}
		}

		if (data === 'tickets') {
			await this.showTickets(chatId);
		} else if (data === 'shop') {
			await this.showShopItems(chatId);
		} else if (data === 'help') {
			await this.handleHelp({ chat: { id: chatId } } as TelegramBot.Message);
		} else if (data === 'deposit') {
			await this.handleDeposit(chatId);
		} else if (data === 'balance') {
			await this.handleBalance(chatId);
		} else if (data === 'submit_tx') {
			await this.handleSubmitTransaction(chatId);
		} else if (data === 'chat') {
			await this.handleChat({ chat: { id: chatId } } as TelegramBot.Message);
		} else if (data === 'chat_history') {
			await this.handleConversationHistory({
				chat: { id: chatId },
			} as TelegramBot.Message);
		} else if (data === 'pricing') {
			const pricingResponse = await this.actionHandler.executeAction(
				{
					action: 'GET_PRICES',
					parameters: {},
					confidence: 1,
				},
				chatId
			);
			await this.bot.sendMessage(chatId, pricingResponse.message, {
				parse_mode: 'Markdown',
			});
		} else if (data === 'recommendations') {
			const recommendationResponse = await this.actionHandler.executeAction(
				{
					action: 'GET_RECOMMENDATIONS',
					parameters: { preference: 'general' },
					confidence: 1,
				},
				chatId
			);
			await this.bot.sendMessage(chatId, recommendationResponse.message, {
				parse_mode: 'Markdown',
			});
		} else if (data.startsWith('ticket_')) {
			const ticketId = parseInt(data.split('_')[1]);
			await this.handleTicketSelection(chatId, ticketId);
		} else if (data.startsWith('item_')) {
			const productId = data.split('_')[1];
			await this.handleItemSelection(chatId, productId);
		} else if (data.startsWith('confirm_ticket_')) {
			const ticketId = parseInt(data.split('_')[2]);
			await this.confirmTicketBooking(chatId, ticketId);
		} else if (data.startsWith('confirm_item_')) {
			const productId = data.split('_')[2];
			await this.confirmItemPurchase(chatId, productId);
		} else if (data.startsWith('preview_item_')) {
			const productId = data.split('_')[2];
			await this.handleItemPreview(chatId, productId);
		} else if (data.startsWith('view_order_')) {
			const orderId = data.split('_')[2];
			await this.handleViewOrder(chatId, orderId);
		} else if (data.startsWith('cancel_order_')) {
			const orderId = data.split('_')[2];
			await this.handleCancelOrder(chatId, orderId);
		} else if (data.startsWith('ui_')) {
			console.log('🔘 UI Action detected:', data);
			await this.handleUIAction(chatId, data);
		} else {
			console.log('🔘 Unhandled callback data:', data);
		}
	}

	private async handleTicketSelection(chatId: number, ticketId: number) {
		const ticket = TICKETS.find((t) => t.id === ticketId);

		if (!ticket || !ticket.available) {
			await this.bot.sendMessage(
				chatId,
				'❌ This ticket is no longer available.'
			);
			return;
		}

		const message = `
🎫 **Ticket Details:**

**Event:** ${ticket.name}
**Price:** $${ticket.price}
**Status:** Available

Would you like to book this ticket?
    `;

		const keyboard = {
			inline_keyboard: [
				[
					{
						text: '✅ Confirm Booking',
						callback_data: `confirm_ticket_${ticketId}`,
					},
					{ text: '❌ Cancel', callback_data: 'tickets' },
				],
			],
		};

		await this.bot.sendMessage(chatId, message, {
			parse_mode: 'Markdown',
			reply_markup: keyboard,
		});
	}

	private async handleItemSelection(chatId: number, productId: string) {
		try {
			const user = await User.findOne({ chatId });
			if (!user) {
				await this.bot.sendMessage(
					chatId,
					'❌ Please use /start to register first.'
				);
				return;
			}

			const productResult = await productService.getProductById(productId);

			if (!productResult.success || !productResult.product) {
				await this.bot.sendMessage(
					chatId,
					'❌ This item is no longer available.'
				);
				return;
			}

			const item = productResult.product;

			if (!item.inStock || item.stockQuantity <= 0) {
				await this.bot.sendMessage(chatId, '❌ This item is out of stock.');
				return;
			}

			const canAfford = user.balance >= item.price;
			const message = `
🛍️ **Item Details:**

**Name:** ${item.name}
**Price:** $${item.price}
**Category:** ${item.category}
**Stock:** ${item.stockQuantity} available
**Status:** ${item.inStock ? 'In Stock' : 'Out of Stock'}

💰 **Your Balance:** $${user.balance}
${canAfford ? '✅ **You can afford this item!**' : '❌ **Insufficient balance**'}

${canAfford ? 'Would you like to buy this item?' : 'Please make a deposit to purchase this item.'}
    `;

			const keyboard = {
				inline_keyboard: canAfford
					? [
							[
								{
									text: '✅ Confirm Purchase',
									callback_data: `confirm_item_${productId}`,
								},
								{ text: '❌ Cancel', callback_data: 'shop' },
							],
							[
								{
									text: '🔍 View Order Preview',
									callback_data: `preview_item_${productId}`,
								},
							],
						]
					: [
							[
								{ text: '💰 Make Deposit', callback_data: 'deposit' },
								{ text: '🛍️ Back to Shop', callback_data: 'shop' },
							],
						],
			};

			await this.bot.sendMessage(chatId, message, {
				parse_mode: 'Markdown',
				reply_markup: keyboard,
			});
		} catch (error) {
			console.error('Error handling item selection:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error loading item details. Please try again.'
			);
		}
	}

	private async confirmTicketBooking(chatId: number, ticketId: number) {
		const ticket = TICKETS.find((t) => t.id === ticketId);

		if (!ticket) {
			await this.bot.sendMessage(chatId, '❌ Ticket not found.');
			return;
		}

		// Simulate booking process
		const bookingId = Math.floor(Math.random() * 1000000);

		const message = `
✅ **Booking Confirmed!**

**Booking ID:** #${bookingId}
**Event:** ${ticket.name}
**Price:** $${ticket.price}
**Status:** Confirmed

Your ticket has been booked successfully! You will receive a confirmation email shortly.

Thank you for using our service! 🎉
    `;

		const keyboard = {
			inline_keyboard: [
				[
					{ text: '🎫 Book Another Ticket', callback_data: 'tickets' },
					{ text: '🏠 Back to Menu', callback_data: 'start' },
				],
			],
		};

		await this.bot.sendMessage(chatId, message, {
			parse_mode: 'Markdown',
			reply_markup: keyboard,
		});
	}

	private async confirmItemPurchase(chatId: number, productId: string) {
		try {
			const productResult = await productService.getProductById(productId);

			if (!productResult.success || !productResult.product) {
				await this.bot.sendMessage(chatId, '❌ Item not found.');
				return;
			}

			const item = productResult.product;

			// Process the order
			const orderResult = await orderService.createOrder({
				chatId,
				productId: item.productId,
				quantity: 1,
				totalPrice: item.price,
			});

			if (orderResult.success) {
				const user = await User.findOne({ chatId });
				const message = `
✅ **Purchase Confirmed!**

**Order ID:** #${orderResult.order.orderId}
**Item:** ${item.name}
**Price:** $${item.price}
**Transaction Hash:** ${orderResult.transactionHash}
**Status:** Confirmed

💰 **Updated Balance:** $${user?.balance || 0} USDC

Your order has been placed successfully! You will receive a confirmation email shortly.

Thank you for your purchase! 🛍️
    `;

				const keyboard = {
					inline_keyboard: [
						[
							{
								text: '🔍 View Order',
								callback_data: `view_order_${orderResult.order.orderId}`,
							},
						],
						[
							{ text: '🛍️ Buy Another Item', callback_data: 'shop' },
							{ text: '💳 Check Balance', callback_data: 'balance' },
						],
						[{ text: '🏠 Back to Menu', callback_data: 'start' }],
					],
				};

				await this.bot.sendMessage(chatId, message, {
					parse_mode: 'Markdown',
					reply_markup: keyboard,
				});
			} else {
				// Order failed
				const message = `${orderResult.message}

Please try again or contact support if the issue persists.`;

				const keyboard = {
					inline_keyboard: [
						[
							{ text: '💰 Make Deposit', callback_data: 'deposit' },
							{ text: '🛍️ Back to Shop', callback_data: 'shop' },
						],
						[{ text: '🏠 Back to Menu', callback_data: 'start' }],
					],
				};

				await this.bot.sendMessage(chatId, message, {
					parse_mode: 'Markdown',
					reply_markup: keyboard,
				});
			}
		} catch (error) {
			console.error('Error confirming item purchase:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error processing purchase. Please try again.'
			);
		}
	}

	private async handleItemPreview(chatId: number, productId: string) {
		try {
			const user = await User.findOne({ chatId });
			const productResult = await productService.getProductById(productId);

			if (!user || !productResult.success || !productResult.product) {
				await this.bot.sendMessage(chatId, '❌ Preview not available.');
				return;
			}

			const item = productResult.product;

			const message = `
📋 **Order Preview**

**Item:** ${item.name}
**Price:** $${item.price}
**Quantity:** 1
**Total:** $${item.price}

**Your Balance:** $${user.balance}
**After Purchase:** $${user.balance - item.price}

Ready to confirm your purchase?
			`;

			const keyboard = {
				inline_keyboard: [
					[
						{
							text: '✅ Confirm Purchase',
							callback_data: `confirm_item_${productId}`,
						},
						{ text: '❌ Cancel', callback_data: 'shop' },
					],
				],
			};

			await this.bot.sendMessage(chatId, message, {
				parse_mode: 'Markdown',
				reply_markup: keyboard,
			});
		} catch (error) {
			console.error('Error showing item preview:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error loading preview. Please try again.'
			);
		}
	}

	private async handleViewOrder(chatId: number, orderId: string) {
		try {
			// Try to get order by MongoDB _id first, then by orderId
			let order = await orderService.getOrderById(orderId);
			if (!order) {
				order = await orderService.getOrder(orderId);
			}

			if (!order) {
				await this.bot.sendMessage(chatId, '❌ Order not found.');
				return;
			}

			const statusEmoji: Record<string, string> = {
				pending: '⏳',
				confirmed: '✅',
				cancelled: '❌',
				delivered: '📦',
			};

			const message = `
📋 **Order Details**

**Order ID:** #${order.orderId}
**Item:** ${order.items[0]?.name || 'N/A'}
**Quantity:** ${order.items[0]?.quantity || 1}
**Total:** $${order.totalPrice}
**Status:** ${statusEmoji[order.status]} ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
**Transaction Hash:** ${order.transactionHash || 'N/A'}
**Order Date:** ${order.createdAt.toLocaleDateString()}

${order.status === 'confirmed' ? '📦 Your order is being prepared for delivery!' : ''}
${order.status === 'delivered' ? '🎉 Your order has been delivered!' : ''}

🔗 **Order Link:** ${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order._id}
			`;

			const keyboard = {
				inline_keyboard: [
					...(order.status === 'confirmed' || order.status === 'pending'
						? [
								[
									{
										text: '❌ Cancel Order',
										callback_data: `cancel_order_${orderId}`,
									},
								],
							]
						: []),
					[
						{ text: '🛍️ Shop More', callback_data: 'shop' },
						{ text: '💳 Check Balance', callback_data: 'balance' },
					],
					[{ text: '🏠 Back to Menu', callback_data: 'start' }],
				],
			};

			await this.bot.sendMessage(chatId, message, {
				parse_mode: 'Markdown',
				reply_markup: keyboard,
			});
		} catch (error) {
			console.error('Error viewing order:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error loading order details. Please try again.'
			);
		}
	}

	private async handleCancelOrder(chatId: number, orderId: string) {
		try {
			const result = await orderService.cancelOrder(orderId, chatId);

			if (result.success) {
				const user = await User.findOne({ chatId });
				const message = `${result.message}

💰 **Updated Balance:** $${user?.balance || 0} USDC`;

				const keyboard = {
					inline_keyboard: [
						[
							{ text: '🛍️ Continue Shopping', callback_data: 'shop' },
							{ text: '💳 Check Balance', callback_data: 'balance' },
						],
						[{ text: '🏠 Back to Menu', callback_data: 'start' }],
					],
				};

				await this.bot.sendMessage(chatId, message, {
					parse_mode: 'Markdown',
					reply_markup: keyboard,
				});
			} else {
				await this.bot.sendMessage(chatId, result.message);
			}
		} catch (error) {
			console.error('Error cancelling order:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error cancelling order. Please try again.'
			);
		}
	}

	private async handleUIAction(chatId: number, callbackData: string) {
		const parts = callbackData.split('_');
		const action = parts[1];
		const identifier = parts[2];

		console.log('🔘 === UI ACTION HANDLER ===');
		console.log('🔘 Action:', action);
		console.log('🔘 Identifier:', identifier);

		try {
			// Handle compound actions like confirm_purchase
			if (action === 'confirm' && identifier === 'purchase') {
				const itemId = parts[3];
				const quantity = parts[4] || '1';

				console.log('🔘 === CONFIRM PURCHASE DEBUG ===');
				console.log('🔘 Callback Data:', callbackData);
				console.log('🔘 Parts:', parts);
				console.log('🔘 ItemId:', itemId, 'Quantity:', quantity);

				const purchaseResponse = await this.actionHandler.executeAction(
					{
						action: 'CONFIRM_PURCHASE',
						parameters: { itemId, quantity: parseInt(quantity) },
						confidence: 1,
					},
					chatId
				);

				if (purchaseResponse.success && purchaseResponse.data?.uiActions) {
					const keyboard = {
						inline_keyboard: purchaseResponse.data.uiActions.map(
							(uiAction: any) => [
								{
									text: uiAction.text,
									callback_data: `ui_${uiAction.action}_${uiAction.orderId || uiAction.category || 'default'}`,
								},
							]
						),
					};

					// Check if we have item details with an image for the confirmation
					if (purchaseResponse.data?.itemDetails?.imageUrl) {
						try {
							// Send photo with caption and buttons
							await this.bot.sendPhoto(
								chatId,
								purchaseResponse.data.itemDetails.imageUrl,
								{
									caption: purchaseResponse.message,
									parse_mode: 'Markdown',
									reply_markup: keyboard,
								}
							);
						} catch (imageError) {
							console.error('Error sending confirmation image:', imageError);
							// Fallback to text message if image fails
							await this.bot.sendMessage(chatId, purchaseResponse.message, {
								parse_mode: 'Markdown',
								reply_markup: keyboard,
							});
						}
					} else {
						await this.bot.sendMessage(chatId, purchaseResponse.message, {
							parse_mode: 'Markdown',
							reply_markup: keyboard,
						});
					}
				} else {
					await this.bot.sendMessage(chatId, purchaseResponse.message, {
						parse_mode: 'Markdown',
					});
				}
				return;
			}

			// Handle cancel_purchase
			if (action === 'cancel' && identifier === 'purchase') {
				await this.bot.sendMessage(
					chatId,
					'❌ Purchase cancelled. What else can I help you with?'
				);
				return;
			}

			// Handle view_order
			if (action === 'view' && identifier === 'order') {
				const orderId = parts[3];
				await this.handleViewOrder(chatId, orderId);
				return;
			}

			// Handle track_order
			if (action === 'track' && identifier === 'order') {
				const orderId = parts[3];
				await this.handleViewOrder(chatId, orderId);
				return;
			}

			// Handle recommend_similar
			if (action === 'recommend' && identifier === 'similar') {
				const category = parts[3];
				const recommendationResponse = await this.actionHandler.executeAction(
					{
						action: 'GET_RECOMMENDATIONS',
						parameters: { preference: category },
						confidence: 1,
					},
					chatId
				);
				await this.bot.sendMessage(chatId, recommendationResponse.message, {
					parse_mode: 'Markdown',
				});
				return;
			}

			switch (action) {
				case 'confirm_booking':
					const bookingParts = callbackData.split('_');
					const ticketId = bookingParts[2];
					const ticketQuantity = bookingParts[3] || '1';

					const bookingResponse = await this.actionHandler.executeAction(
						{
							action: 'CONFIRM_BOOKING',
							parameters: { ticketId, quantity: parseInt(ticketQuantity) },
							confidence: 1,
						},
						chatId
					);

					if (bookingResponse.success && bookingResponse.data?.uiActions) {
						const keyboard = {
							inline_keyboard: bookingResponse.data.uiActions.map(
								(uiAction: any) => [
									{
										text: uiAction.text,
										callback_data: `ui_${uiAction.action}_${uiAction.orderId || 'default'}`,
									},
								]
							),
						};
						await this.bot.sendMessage(chatId, bookingResponse.message, {
							parse_mode: 'Markdown',
							reply_markup: keyboard,
						});
					} else {
						await this.bot.sendMessage(chatId, bookingResponse.message, {
							parse_mode: 'Markdown',
						});
					}
					break;

				case 'cancel_booking':
					await this.bot.sendMessage(
						chatId,
						'❌ Booking cancelled. What else can I help you with?'
					);
					break;

				case 'deposit':
					await this.handleDeposit(chatId);
					break;

				case 'browse_items':
					await this.showShopItems(chatId);
					break;

				case 'browse_tickets':
					await this.showTickets(chatId);
					break;

				default:
					await this.bot.sendMessage(
						chatId,
						"🤔 I'm not sure what you'd like to do with that. How else can I help you? 😊"
					);
			}
		} catch (error) {
			console.error('Error in handleUIAction:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error processing your request. Please try again.'
			);
		}
	}

	private async handleChat(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;
		const message = `💬 Let's chat! I'm here to help you with:
  
🎫 **Ticket booking** - Ask about movies, concerts, sports
🛍️ **Shopping** - Browse items by category
💰 **Pricing** - Check costs and budgets
✨ **Recommendations** - Get personalized suggestions

Just type naturally and I'll understand what you need!`;

		const keyboard = {
			inline_keyboard: [
				[
					{ text: '🎫 Book Tickets', callback_data: 'tickets' },
					{ text: '🛍️ Shop Items', callback_data: 'shop' },
				],
				[
					{ text: '💰 Check Prices', callback_data: 'pricing' },
					{ text: '✨ Get Recommendations', callback_data: 'recommendations' },
				],
			],
		};

		await this.bot.sendMessage(chatId, message, {
			reply_markup: keyboard,
			parse_mode: 'Markdown',
		});
	}

	private async handleClearConversation(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;
		this.conversationContext.delete(chatId);
		await this.bot.sendMessage(
			chatId,
			"🧹 Conversation cleared! Let's start fresh."
		);
	}

	private async handleConversationHistory(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;
		const context = this.conversationContext.get(chatId);

		if (
			!context ||
			!context.conversationHistory ||
			context.conversationHistory.length === 0
		) {
			await this.bot.sendMessage(
				chatId,
				'📝 No conversation history found. Start chatting to build your history!'
			);
			return;
		}

		let historyMessage = `📝 **Conversation History** (Last ${context.conversationHistory.length} messages)\n\n`;

		context.conversationHistory.forEach((entry: any, index: number) => {
			const time = entry.timestamp.toLocaleTimeString();
			historyMessage += `**${index + 1}.** *(${time})*\n`;
			historyMessage += `👤 **You:** ${entry.userMessage}\n`;
			if (entry.botResponse) {
				// Truncate long responses
				const response =
					entry.botResponse.length > 100
						? entry.botResponse.substring(0, 100) + '...'
						: entry.botResponse;
				historyMessage += `🤖 **Shoq:** ${response.replace(/\*/g, '')}\n\n`;
			} else {
				historyMessage += `🤖 **Shoq:** *(Processing...)*\n\n`;
			}
		});

		historyMessage += `💡 **Tip:** Use /clear to clear your conversation history.`;

		await this.bot.sendMessage(chatId, historyMessage, {
			parse_mode: 'Markdown',
		});
	}

	private async handleOrderSummary(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;

		try {
			// Get user info
			const user = await User.findOne({ chatId });
			if (!user) {
				await this.bot.sendMessage(
					chatId,
					'❌ User not found. Please use /start to register.'
				);
				return;
			}

			// Get user's recent orders
			const { orderService } = await import('./orderService.js');
			const orders = await orderService.getUserOrders(chatId, 5); // Get last 5 orders

			if (orders.length === 0) {
				await this.bot.sendMessage(
					chatId,
					`📋 **Order Summary**\n\n💰 **Balance:** $${user.balance}\n👤 **Member Since:** ${user.registeredAt.toLocaleDateString()}\n\n📦 **No orders yet!** Start shopping to see your order history.`
				);
				return;
			}

			const statusEmoji: Record<string, string> = {
				pending: '⏳',
				confirmed: '✅',
				cancelled: '❌',
				delivered: '📦',
			};

			let summaryMessage = `📋 **Order Summary**\n\n💰 **Current Balance:** $${user.balance}\n👤 **Member Since:** ${user.registeredAt.toLocaleDateString()}\n\n📦 **Recent Orders (Last ${orders.length}):**\n\n`;

			let totalSpent = 0;
			orders.forEach((order: any, index: number) => {
				totalSpent += order.totalPrice;
				summaryMessage += `**${index + 1}.** ${statusEmoji[order.status]} #${order.orderId}\n`;
				summaryMessage += `📦 ${order.item} (x${order.quantity})\n`;
				summaryMessage += `💰 $${order.totalPrice} - ${order.createdAt.toLocaleDateString()}\n\n`;
			});

			summaryMessage += `💳 **Total Spent:** $${totalSpent}\n`;
			summaryMessage += `📊 **Average Order:** $${(totalSpent / orders.length).toFixed(2)}\n\n`;
			summaryMessage += `💡 **Tip:** Use /history to see your chat history or browse more items!`;

			const keyboard = {
				inline_keyboard: [
					[
						{ text: '🛍️ Continue Shopping', callback_data: 'shop' },
						{ text: '💰 Check Balance', callback_data: 'balance' },
					],
					[{ text: '📝 Conversation History', callback_data: 'chat_history' }],
				],
			};

			await this.bot.sendMessage(chatId, summaryMessage, {
				parse_mode: 'Markdown',
				reply_markup: keyboard,
			});
		} catch (error) {
			console.error('Error in handleOrderSummary:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error loading order summary. Please try again.'
			);
		}
	}

	private async handleDeposit(chatId: number) {
		const message = `
💰 **USDC Deposit Instructions**

To start using Shoq, please deposit USDC to our AI Wallet:

**Hedera Account:** 
${process.env.OPERATOR_ADDRESS}

**Steps:**
1. Send USDC from your Hedera wallet to the account above
2. Copy your transaction ID (format: 0.0.123@456.789)
3. Submit the transaction ID using the button below

⚠️ **Important:** 
- Use Hedera network (testnet/mainnet)
- Transaction ID automatically includes your account
- No need to provide wallet address separately

**Need USDC?** Get testnet USDC from Hedera faucet or exchanges.
		`;

		const keyboard = {
			inline_keyboard: [
				[{ text: '📋 Submit Transaction ID', callback_data: 'submit_tx' }],
				[{ text: '🏠 Back to Menu', callback_data: 'start' }],
			],
		};

		await this.bot.sendMessage(chatId, message, {
			parse_mode: 'Markdown',
			reply_markup: keyboard,
		});
	}

	private async handleBalance(chatId: number) {
		try {
			const user = await User.findOne({ chatId });

			if (!user) {
				await this.bot.sendMessage(
					chatId,
					'❌ User not found. Please use /start to register.'
				);
				return;
			}

			const message = `
💳 **Your Account Balance**

💰 **Current Balance:** $${user.balance} USDC
📅 **Member Since:** ${user.registeredAt.toLocaleDateString()}
👤 **Username:** @${user.username}

${user.balance === 0 ? '💡 **Tip:** Make a deposit to start shopping!' : '🎉 **Ready to shop!**'}
			`;

			const keyboard = {
				inline_keyboard: [
					[
						{ text: '💰 Make Deposit', callback_data: 'deposit' },
						{ text: '🛍️ Start Shopping', callback_data: 'shop' },
					],
					[{ text: '🏠 Back to Menu', callback_data: 'start' }],
				],
			};

			await this.bot.sendMessage(chatId, message, {
				parse_mode: 'Markdown',
				reply_markup: keyboard,
			});
		} catch (error) {
			console.error('Error in handleBalance:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error retrieving balance. Please try again.'
			);
		}
	}

	private async handleSubmitTransaction(chatId: number) {
		this.pendingDeposits.set(chatId, { step: 'waiting_tx_hash' });

		const message = `
📋 **Submit Transaction ID**

Please send me your Hedera transaction ID from the USDC transfer.

**Format:** 0.0.123456@1234567890.123456789

⚠️ **Make sure:**
- You sent USDC to the correct wallet address
- The transaction is confirmed on Hedera network
- The transaction ID includes your account (before @ symbol)

**Example:** 0.0.6494628@1754664574.369070408

Type your transaction ID below:
		`;

		await this.bot.sendMessage(chatId, message, {
			parse_mode: 'Markdown',
		});
	}

	private async handleEmailSubmission(
		chatId: number,
		email: string,
		userState: any
	): Promise<boolean> {
		try {
			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				await this.bot.sendMessage(
					chatId,
					'❌ Please provide a valid email address. For example: user@example.com'
				);
				return true;
			}

			// Check if email is already in use
			const existingUser = await User.findOne({ email });
			if (existingUser && existingUser.chatId !== chatId) {
				await this.bot.sendMessage(
					chatId,
					'❌ This email is already associated with another account. Please use a different email address.'
				);
				return true;
			}

			// Process based on user state
			if (userState.step === 'linking_account') {
				// Link existing account
				if (existingUser) {
					existingUser.chatId = chatId;
					existingUser.onboardingMethod = 'telegram';
					await existingUser.save();

					await this.bot.sendMessage(
						chatId,
						`✅ **Account Linked Successfully!**

Welcome back! Your Telegram account has been linked to your existing profile.

📧 **Email:** ${existingUser.email}
💰 **Balance:** $${existingUser.balance} USDC

You can now start shopping and managing your orders!`
					);

					// Clear user state and show welcome message
					this.userStates.delete(chatId);
					await this.showWelcomeMessage(chatId, existingUser, false); // false = existing user
				} else {
					await this.bot.sendMessage(
						chatId,
						'❌ No existing account found with this email. Please check your email address or start a new account.'
					);
				}
			} else if (userState.step === 'collecting_email') {
				// Create new user or update existing user
				let user: any;

				if (userState.data.existingUser) {
					// Update existing user with email
					user = userState.data.existingUser;
					user.email = email;
					await user.save();
				} else {
					// Create new user
					user = new User({
						chatId,
						username: userState.data.username,
						name: userState.data.firstName,
						email,
						balance: 0,
						onboardingMethod: 'telegram',
						emailNotifications: true,
						registeredAt: new Date(),
					});
					await user.save();
				}

				await this.bot.sendMessage(
					chatId,
					`✅ **Account Created Successfully!**

🎉 Welcome to Shoq! Your account has been set up.

📧 **Email:** ${email}
💰 **Balance:** $${user.balance} USDC

You can now start shopping and managing your orders!`
				);

				// Clear user state and show welcome message
				this.userStates.delete(chatId);
				await this.showWelcomeMessage(chatId, user, true); // true = new user
			}

			return true;
		} catch (error) {
			console.error('Error handling email submission:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error processing email. Please try again.'
			);
			return true;
		}
	}

	private async handleTransactionHashSubmission(
		chatId: number,
		txHash: string
	) {
		try {
			const pendingDeposit = this.pendingDeposits.get(chatId);
			if (!pendingDeposit || pendingDeposit.step !== 'waiting_tx_hash') {
				return false; // Not in transaction submission flow
			}

			// Extract account ID from Hedera transaction ID
			// Format: 0.0.123456@1234567890.123456789
			const cleanTxHash = txHash.trim();

			// Check if this transaction has already been processed
			if (this.processedTransactions.has(cleanTxHash)) {
				await this.bot.sendMessage(
					chatId,
					'⚠️ This transaction has already been processed. Please provide a different transaction hash.'
				);
				return true;
			}

			let senderAccountId = '';

			if (cleanTxHash.includes('@')) {
				senderAccountId = cleanTxHash.split('@')[0];
			} else if (cleanTxHash.includes('-')) {
				// Handle format: 0.0.123456-1234567890-123456789
				senderAccountId = cleanTxHash.split('-')[0];
			}

			if (!senderAccountId || !senderAccountId.match(/^0\.0\.\d+$/)) {
				await this.bot.sendMessage(
					chatId,
					'❌ Invalid transaction ID format. Please provide a Hedera transaction ID.\n\n**Format:** 0.0.123456@1234567890.123456789'
				);
				return false;
			}

			await this.bot.sendMessage(
				chatId,
				`✅ **Transaction Hash Received**

Transaction ID: \`${cleanTxHash}\`
Sender Account: \`${senderAccountId}\`

🔍 Verifying your deposit...
This may take a moment.`
			);

			// Mark transaction as being processed
			this.processedTransactions.add(cleanTxHash);

			// Verify the deposit directly
			const result = await depositService.verifyDeposit({
				chatId,
				txHash: cleanTxHash,
				walletAddress: senderAccountId, // Use extracted account ID
			});

			// Clear pending deposit
			this.pendingDeposits.delete(chatId);

			if (result.success) {
				// Success message with updated balance
				const user = await User.findOne({ chatId });
				const successMessage = `${result.message}

💰 **Updated Balance:** $${user?.balance || 0} USDC

🎉 **You're all set to start shopping!**`;

				const keyboard = {
					inline_keyboard: [
						[
							{ text: '🛍️ Start Shopping', callback_data: 'shop' },
							{ text: '💳 Check Balance', callback_data: 'balance' },
						],
						[{ text: '🏠 Back to Menu', callback_data: 'start' }],
					],
				};

				await this.bot.sendMessage(chatId, successMessage, {
					parse_mode: 'Markdown',
					reply_markup: keyboard,
				});
			} else {
				// Error message
				const errorMessage = `${result.message}

Please check your transaction details and try again.`;

				const keyboard = {
					inline_keyboard: [
						[{ text: '🔄 Try Again', callback_data: 'submit_tx' }],
						[{ text: '🏠 Back to Menu', callback_data: 'start' }],
					],
				};

				await this.bot.sendMessage(chatId, errorMessage, {
					parse_mode: 'Markdown',
					reply_markup: keyboard,
				});
			}

			return true;
		} catch (error) {
			console.error('Error handling transaction hash:', error);
			this.pendingDeposits.delete(chatId);
			await this.bot.sendMessage(
				chatId,
				'❌ Error processing transaction hash. Please try again.'
			);
			return false;
		}
	}

	private async handleMessage(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;
		const text = msg.text;

		// Comprehensive logging for learning and future features
		console.log('🔍 === INCOMING MESSAGE ===');
		console.log('📱 Message Object:', JSON.stringify(msg, null, 2));
		console.log('👤 User ID:', msg.from?.id);
		console.log('👤 Username:', msg.from?.username);
		console.log('👤 First Name:', msg.from?.first_name);
		console.log('💬 Chat ID:', chatId);
		console.log('📝 Message Type:', msg.entities ? 'Formatted' : 'Plain');
		console.log('📅 Date:', new Date(msg.date * 1000).toISOString());

		// Log voice message info if present
		if (msg.voice) {
			console.log('🎤 VOICE MESSAGE DETECTED:');
			console.log('🎤 Voice File ID:', msg.voice.file_id);
			console.log('🎤 Duration:', msg.voice.duration, 'seconds');
			console.log('🎤 MIME Type:', msg.voice.mime_type);
			console.log('🎤 File Size:', msg.voice.file_size, 'bytes');
		}

		// Log photo info if present
		if (msg.photo && msg.photo.length > 0) {
			console.log('📸 PHOTO DETECTED:');
			console.log('📸 Photo Array Length:', msg.photo.length);
			msg.photo.forEach((photo, index) => {
				console.log(`📸 Photo ${index}:`, {
					file_id: photo.file_id,
					file_unique_id: photo.file_unique_id,
					width: photo.width,
					height: photo.height,
					file_size: photo.file_size,
				});
			});
		}

		// Handle voice messages (future feature)
		if (msg.voice) {
			this.loggingService.analyzeVoiceMessage(
				msg.voice,
				msg.from?.id || 0,
				chatId
			);
			await this.bot.sendMessage(
				chatId,
				'🎤 I received your voice message! Voice transcription is coming soon. For now, please type your message. 😊'
			);
			return;
		}

		// Handle photos (future feature for image recognition)
		if (msg.photo && msg.photo.length > 0) {
			this.loggingService.analyzeImage(msg.photo, msg.from?.id || 0, chatId);
			await this.bot.sendMessage(
				chatId,
				"📸 I received your photo! Image recognition is coming soon. For now, please describe what you're looking for. 😊"
			);
			return;
		}

		if (!text || text.startsWith('/')) return;

		// Check if user is in a deposit submission flow
		const pendingDeposit = this.pendingDeposits.get(chatId);
		if (pendingDeposit && pendingDeposit.step === 'waiting_tx_hash') {
			const handled = await this.handleTransactionHashSubmission(chatId, text);
			if (handled) return;
		}

		// Check if user is in email collection flow
		const userState = this.userStates.get(chatId);
		if (
			userState &&
			(userState.step === 'collecting_email' ||
				userState.step === 'linking_account')
		) {
			const handled = await this.handleEmailSubmission(chatId, text, userState);
			if (handled) return;
		}

		// Get or create conversation context
		if (!this.conversationContext.has(chatId)) {
			this.conversationContext.set(chatId, {
				lastAction: null,
				lastItem: null,
				preferences: [],
				conversationCount: 0,
				conversationHistory: [],
			});
		}

		const context = this.conversationContext.get(chatId);
		context.conversationCount++;

		// Add message to conversation history (keep last 10)
		context.conversationHistory.push({
			timestamp: new Date(),
			user: text,
			userMessage: text,
		});

		// Keep only last 10 conversations
		if (context.conversationHistory.length > 10) {
			context.conversationHistory = context.conversationHistory.slice(-10);
		}

		console.log('🧠 === CONVERSATION CONTEXT ===');
		console.log('🧠 Context:', JSON.stringify(context, null, 2));
		console.log('🧠 Conversation Count:', context.conversationCount);

		// Start typing indicator
		let typingInterval: NodeJS.Timeout | null = null;
		const startTyping = () => {
			this.bot.sendChatAction(chatId, 'typing');
			// Keep typing indicator active every 4 seconds
			typingInterval = setInterval(() => {
				this.bot.sendChatAction(chatId, 'typing');
			}, 4000);
		};

		const stopTyping = () => {
			if (typingInterval) {
				clearInterval(typingInterval);
				typingInterval = null;
			}
		};

		try {
			// Start typing indicator
			startTyping();

			// Add natural delay for better UX
			await new Promise((resolve) =>
				setTimeout(resolve, 800 + Math.random() * 400)
			);

			// Check if Gemini service is available
			if (!this.geminiService) {
				// Enhanced fallback responses without Gemini
				const lowerText = text.toLowerCase();

				if (
					lowerText.includes('hi') ||
					lowerText.includes('hello') ||
					lowerText.includes('hey')
				) {
					await this.bot.sendMessage(
						chatId,
						"👋 Hey there! I'm Shoq, your friendly shopping and ticket assistant! 🎉\n\nI'm here to help you with tickets and shopping. Just chat with me naturally - I'll understand what you need! 😊\n\nWhat's on your mind today?"
					);
					return;
				}

				if (
					lowerText.includes('ticket') ||
					lowerText.includes('book') ||
					lowerText.includes('movie') ||
					lowerText.includes('concert')
				) {
					await this.bot.sendMessage(
						chatId,
						"🎫 Great! I'd love to help you with tickets! We have movies, concerts, sports events, and more. What kind of event are you looking for?"
					);
					// Only show options if they ask for them
					if (
						lowerText.includes('show') ||
						lowerText.includes('what') ||
						lowerText.includes('list')
					) {
						await this.showTickets(chatId);
					}
					return;
				}

				if (
					lowerText.includes('shop') ||
					lowerText.includes('buy') ||
					lowerText.includes('item') ||
					lowerText.includes('product')
				) {
					await this.bot.sendMessage(
						chatId,
						'🛍️ Awesome! I can help you find the perfect items. We have electronics, clothing, home goods, and more. What are you looking for?'
					);
					// Only show options if they ask for them
					if (
						lowerText.includes('show') ||
						lowerText.includes('what') ||
						lowerText.includes('list')
					) {
						await this.showShopItems(chatId);
					}
					return;
				}

				if (
					lowerText.includes('price') ||
					lowerText.includes('cost') ||
					lowerText.includes('how much')
				) {
					await this.bot.sendMessage(
						chatId,
						"💰 I'd be happy to help with pricing! What specifically would you like to know about? Tickets, shop items, or everything?"
					);
					return;
				}

				if (
					lowerText.includes('help') ||
					lowerText.includes('what can you do')
				) {
					await this.bot.sendMessage(
						chatId,
						"🤖 I'm your personal shopping and ticket assistant! Here's what I can do:\n\n🎫 **Book tickets** for movies, concerts, sports, theater\n🛍️ **Shop for items** like electronics, clothing, home goods\n💰 **Check prices** and compare options\n✨ **Get recommendations** based on your preferences\n\nJust tell me what you need in your own words!"
					);
					return;
				}

				// Default conversational response
				await this.bot.sendMessage(
					chatId,
					"That's interesting! 😊 I'm here to help with tickets and shopping. You can ask me about events, products, prices, or just chat! What would you like to explore?"
				);
				return;
			}

			// Check if message contains Hedera-related content
			const lowerText = text.toLowerCase();
			const hederaKeywords = [
				'verify',
				'transaction',
				'balance',
				'hedera',
				'usdc',
				'0.0.',
				'network',
			];
			const containsHedera = hederaKeywords.some((keyword) =>
				lowerText.includes(keyword)
			);

			if (containsHedera) {
				try {
					const hederaResult = await this.hederaAgent.processQuery(text);

					if (hederaResult.toolsUsed.length > 0) {
						// Hedera tools were used, show the result
						const keyboard = {
							inline_keyboard: [
								[
									{ text: '💰 Make Deposit', callback_data: 'deposit' },
									{ text: '🛍️ Start Shopping', callback_data: 'shop' },
								],
							],
						};

						await this.bot.sendMessage(chatId, hederaResult.response, {
							parse_mode: 'Markdown',
							reply_markup: keyboard,
						});
						return;
					}
				} catch (hederaError) {
					console.error('Hedera processing error:', hederaError);
					// Continue to regular AI processing
				}
			}

			// Get user context for AI
			const user = await User.findOne({ chatId });
			const userContext = user
				? {
						userId: user._id,
						chatId: user.chatId,
						email: user.email,
						name: user.name,
						balance: user.balance,
						onboardingMethod: user.onboardingMethod,
					}
				: undefined;

			// Process with Gemini AI
			console.log('🤖 === AI PROCESSING ===');
			console.log('🤖 Input Text:', text);
			console.log('🤖 User ID for AI:', chatId);
			console.log('🤖 User Context:', userContext);

			const geminiResponse = await this.geminiService.processMessage(
				text,
				chatId,
				userContext,
				context
			);

			console.log('🤖 AI Response:', JSON.stringify(geminiResponse, null, 2));

			// If there's an action to perform
			if (geminiResponse.action) {
				this.loggingService.trackAction(
					geminiResponse.action,
					msg.from?.id || 0,
					chatId
				);

				const actionResult = await this.actionHandler.executeAction(
					geminiResponse.action,
					chatId
				);

				this.loggingService.trackResponse(
					actionResult,
					msg.from?.id || 0,
					chatId
				);

				// Update context
				context.lastAction = geminiResponse.action.action;
				context.lastItem = geminiResponse.action.parameters.item;

				if (actionResult.success) {
					console.log('✅ === SUCCESS RESPONSE ===');
					console.log('✅ Response Message:', actionResult.message);
					console.log(
						'✅ Response Data:',
						JSON.stringify(actionResult.data, null, 2)
					);

					// Check if there are UI actions to display as buttons
					if (
						actionResult.data?.uiActions &&
						actionResult.data.uiActions.length > 0
					) {
						console.log('🔘 === UI ACTIONS DETECTED ===');
						console.log(
							'🔘 UI Actions:',
							JSON.stringify(actionResult.data.uiActions, null, 2)
						);

						// Create inline keyboard from UI actions
						const keyboard = {
							inline_keyboard: actionResult.data.uiActions.map(
								(uiAction: any) => [
									{
										text: uiAction.text,
										callback_data: `ui_${uiAction.action}_${uiAction.itemId || uiAction.ticketId || uiAction.orderId || uiAction.category || 'default'}_${uiAction.quantity || '1'}`,
									},
								]
							),
						};

						// Check if we have item details with an image
						if (actionResult.data?.itemDetails?.imageUrl) {
							try {
								// Send photo with caption and buttons
								await this.bot.sendPhoto(
									chatId,
									actionResult.data.itemDetails.imageUrl,
									{
										caption: actionResult.message,
										parse_mode: 'Markdown',
										reply_markup: keyboard,
									}
								);
							} catch (imageError) {
								console.error('Error sending image:', imageError);
								// Fallback to text message if image fails
								await this.bot.sendMessage(chatId, actionResult.message, {
									parse_mode: 'Markdown',
									reply_markup: keyboard,
								});
							}
						} else {
							// Send message with buttons (no image)
							await this.bot.sendMessage(chatId, actionResult.message, {
								parse_mode: 'Markdown',
								reply_markup: keyboard,
							});
						}
					} else {
						// Check if we have item details with an image (for messages without buttons)
						if (actionResult.data?.itemDetails?.imageUrl) {
							try {
								// Send photo with caption
								await this.bot.sendPhoto(
									chatId,
									actionResult.data.itemDetails.imageUrl,
									{
										caption: actionResult.message,
										parse_mode: 'Markdown',
									}
								);
							} catch (imageError) {
								console.error('Error sending image:', imageError);
								// Fallback to text message if image fails
								await this.bot.sendMessage(chatId, actionResult.message, {
									parse_mode: 'Markdown',
								});
							}
						} else {
							// Send message without buttons or image
							await this.bot.sendMessage(chatId, actionResult.message, {
								parse_mode: 'Markdown',
							});
						}
					}

					// Add bot response to conversation history
					const context = this.conversationContext.get(chatId);
					if (context && context.conversationHistory.length > 0) {
						context.conversationHistory[
							context.conversationHistory.length - 1
						].botResponse = actionResult.message;
					}

					// Only show follow-up options if they ask for more
					const followUpMessage =
						'Is there anything else I can help you with? 😊';
					console.log('✅ Follow-up Message:', followUpMessage);
					await this.bot.sendMessage(chatId, followUpMessage);
				} else {
					console.log('❌ === FAILURE RESPONSE ===');
					console.log('❌ Error Message:', actionResult.message);

					await this.bot.sendMessage(chatId, actionResult.message, {
						parse_mode: 'Markdown',
					});

					const fallbackMessage =
						'No worries! 😊 What else would you like to explore?';
					console.log('❌ Fallback Message:', fallbackMessage);
					await this.bot.sendMessage(chatId, fallbackMessage);
				}
			} else {
				// Just a chat response - no buttons unless they ask for options
				console.log('💬 === CHAT RESPONSE ===');
				console.log('💬 Chat Message:', geminiResponse.message);

				// Add bot response to conversation history
				const context = this.conversationContext.get(chatId);
				if (context && context.conversationHistory.length > 0) {
					context.conversationHistory[
						context.conversationHistory.length - 1
					].botResponse = geminiResponse.message;
				}

				await this.bot.sendMessage(chatId, geminiResponse.message, {
					parse_mode: 'Markdown',
				});
			}
		} catch (error) {
			console.error('Message processing error:', error);

			// Enhanced fallback response
			const lowerText = text.toLowerCase();
			if (
				lowerText.includes('hi') ||
				lowerText.includes('hello') ||
				lowerText.includes('hey')
			) {
				await this.bot.sendMessage(
					chatId,
					"👋 Hey there! I'm Shoq, your friendly shopping and ticket assistant! 🎉\n\nI'm here to help you with tickets and shopping. Just chat with me naturally - I'll understand what you need! 😊\n\nWhat's on your mind today?"
				);
			} else {
				await this.bot.sendMessage(
					chatId,
					"That's interesting! 😊 I'm here to help with tickets and shopping. You can ask me about events, products, prices, or just chat! What would you like to explore?"
				);
			}
		} finally {
			// Stop typing indicator
			stopTyping();
		}
	}

	// Hedera command handlers
	private async handleVerifyTransaction(
		msg: TelegramBot.Message,
		match: RegExpExecArray | null
	) {
		const chatId = msg.chat.id;
		const transactionId = match?.[1];

		if (!transactionId) {
			await this.bot.sendMessage(
				chatId,
				'❌ Please provide a transaction ID.\n\nFormat: /verify 0.0.123@456.789'
			);
			return;
		}

		const cleanTxHash = transactionId.trim();

		// Check if this transaction has already been processed
		if (this.processedTransactions.has(cleanTxHash)) {
			await this.bot.sendMessage(
				chatId,
				'⚠️ This transaction has already been processed. Please provide a different transaction hash.'
			);
			return;
		}

		await this.bot.sendChatAction(chatId, 'typing');
		await this.bot.sendMessage(
			chatId,
			'🔍 Verifying transaction... Please wait.'
		);

		// Mark transaction as being processed
		this.processedTransactions.add(cleanTxHash);

		try {
			const result = await this.hederaAgent.processQuery(
				`Verify transaction ${transactionId}`
			);

			const keyboard = {
				inline_keyboard: [
					[
						{ text: '💰 Make Deposit', callback_data: 'deposit' },
						{ text: '🛍️ Start Shopping', callback_data: 'shop' },
					],
				],
			};

			await this.bot.sendMessage(chatId, result.response, {
				parse_mode: 'Markdown',
				reply_markup: keyboard,
			});
		} catch (error) {
			console.error('Error verifying transaction:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error verifying transaction. Please try again.'
			);
		}
	}

	private async handleCheckBalance(
		msg: TelegramBot.Message,
		match: RegExpExecArray | null
	) {
		const chatId = msg.chat.id;
		const accountId = match?.[1];

		if (!accountId) {
			await this.bot.sendMessage(
				chatId,
				'❌ Please provide an account ID.\n\nFormat: /balance 0.0.123456'
			);
			return;
		}

		await this.bot.sendChatAction(chatId, 'typing');

		try {
			const result = await this.hederaAgent.processQuery(
				`Check balance of account ${accountId}`
			);

			await this.bot.sendMessage(chatId, result.response, {
				parse_mode: 'Markdown',
			});
		} catch (error) {
			console.error('Error checking balance:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error checking balance. Please try again.'
			);
		}
	}

	private async handleTransactionStatus(
		msg: TelegramBot.Message,
		match: RegExpExecArray | null
	) {
		const chatId = msg.chat.id;
		const transactionId = match?.[1];

		if (!transactionId) {
			await this.bot.sendMessage(
				chatId,
				'❌ Please provide a transaction ID.\n\nFormat: /hstatus 0.0.123@456.789'
			);
			return;
		}

		await this.bot.sendChatAction(chatId, 'typing');

		try {
			const result = await this.hederaAgent.processQuery(
				`What's the status of transaction ${transactionId}?`
			);

			await this.bot.sendMessage(chatId, result.response, {
				parse_mode: 'Markdown',
			});
		} catch (error) {
			console.error('Error getting transaction status:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error getting transaction status. Please try again.'
			);
		}
	}

	private async handleNetworkInfo(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;

		try {
			const result = await this.hederaAgent.processQuery(
				'Show network information'
			);

			await this.bot.sendMessage(chatId, result.response, {
				parse_mode: 'Markdown',
			});
		} catch (error) {
			console.error('Error getting network info:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error getting network information. Please try again.'
			);
		}
	}

	public start() {
		console.log('🤖 Telegram bot is running...');
	}

	public stop() {
		this.bot.stopPolling();
		console.log('🤖 Telegram bot stopped.');
	}

	/**
	 * Clean up old processed transactions to prevent memory leaks
	 * This should be called periodically (e.g., every hour)
	 */
	private cleanupProcessedTransactions() {
		// For now, we'll keep all transactions in memory
		// In a production environment, you might want to:
		// 1. Store processed transactions in a database
		// 2. Set up a cron job to clean old entries
		// 3. Use Redis with TTL for automatic cleanup

		const maxTransactions = 1000; // Keep last 1000 transactions
		if (this.processedTransactions.size > maxTransactions) {
			// Convert to array, take last maxTransactions, convert back to Set
			const transactionsArray = Array.from(this.processedTransactions);
			this.processedTransactions = new Set(
				transactionsArray.slice(-maxTransactions)
			);
			console.log(
				`🧹 Cleaned up processed transactions. Current count: ${this.processedTransactions.size}`
			);
		}
	}
}

export default TelegramBotService;

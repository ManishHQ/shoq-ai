import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import GeminiService from './geminiService.js';
import ActionHandler from './actionHandler.js';
import LoggingService from './loggingService.js';
import User from '../models/user.model.js';
import { depositService } from './depositService.js';
import { orderService } from './orderService.js';

dotenv.config();

// Hardcoded data for demonstration
const TICKETS = [
	{ id: 1, name: 'Movie Ticket - Avengers', price: 15, available: true },
	{ id: 2, name: 'Concert - Rock Band', price: 50, available: true },
	{ id: 3, name: 'Theater - Hamlet', price: 30, available: false },
	{ id: 4, name: 'Sports - Football Match', price: 25, available: true },
];

const SHOP_ITEMS = [
	{ id: 1, name: 'T-Shirt', price: 20, category: 'Clothing', available: true },
	{ id: 2, name: 'Coffee Mug', price: 8, category: 'Home', available: true },
	{
		id: 3,
		name: 'Phone Case',
		price: 15,
		category: 'Electronics',
		available: true,
	},
	{
		id: 4,
		name: 'Book - Programming Guide',
		price: 25,
		category: 'Books',
		available: false,
	},
	{
		id: 5,
		name: 'Headphones',
		price: 80,
		category: 'Electronics',
		available: true,
	},
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

		// Handle callback queries (button clicks)
		this.bot.on('callback_query', this.handleCallbackQuery.bind(this));

		// Handle text messages
		this.bot.on('message', this.handleMessage.bind(this));
	}

	private async handleStart(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;
		const username = msg.from?.username || '';
		const firstName = msg.from?.first_name || '';

		try {
			// Check if user exists in database
			let user = await User.findOne({ chatId });

			if (!user) {
				// Register new user
				user = new User({
					chatId,
					username,
					name: firstName,
					balance: 0,
					registeredAt: new Date(),
				});

				await user.save();
				console.log(`✅ New user registered: ${username} (${chatId})`);
			} else {
				console.log(`👋 Existing user: ${username} (${chatId})`);
			}

			const welcomeMessage = `
🎉 Welcome to Shoq Bot!

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
		} catch (error) {
			console.error('Error in handleStart:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Sorry, there was an error processing your request. Please try again.'
			);
		}
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

			const availableItems = SHOP_ITEMS.filter((item) => item.available);

			if (availableItems.length === 0) {
				await this.bot.sendMessage(
					chatId,
					'❌ No items available at the moment.'
				);
				return;
			}

			let message = `🛍️ **Available Items**\n\n💰 **Your Balance:** $${user.balance} USDC\n\n`;
			const keyboard = {
				inline_keyboard: availableItems.map((item) => [
					{
						text: `${item.name} - $${item.price} ${user.balance >= item.price ? '✅' : '❌'}`,
						callback_data: `item_${item.id}`,
					},
				]),
			};

			availableItems.forEach((item) => {
				const canAfford =
					user.balance >= item.price ? '✅ Affordable' : '❌ Need more funds';
				message += `🛍️ **${item.name}**\n💰 Price: $${item.price}\n📂 Category: ${item.category}\n${canAfford}\n\n`;
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

		// Answer the callback query
		await this.bot.answerCallbackQuery(query.id);

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
			const itemId = parseInt(data.split('_')[1]);
			await this.handleItemSelection(chatId, itemId);
		} else if (data.startsWith('confirm_ticket_')) {
			const ticketId = parseInt(data.split('_')[2]);
			await this.confirmTicketBooking(chatId, ticketId);
		} else if (data.startsWith('confirm_item_')) {
			const itemId = parseInt(data.split('_')[2]);
			await this.confirmItemPurchase(chatId, itemId);
		} else if (data.startsWith('preview_item_')) {
			const itemId = parseInt(data.split('_')[2]);
			await this.handleItemPreview(chatId, itemId);
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

	private async handleItemSelection(chatId: number, itemId: number) {
		try {
			const user = await User.findOne({ chatId });
			if (!user) {
				await this.bot.sendMessage(
					chatId,
					'❌ Please use /start to register first.'
				);
				return;
			}

			const item = SHOP_ITEMS.find((i) => i.id === itemId);

			if (!item || !item.available) {
				await this.bot.sendMessage(
					chatId,
					'❌ This item is no longer available.'
				);
				return;
			}

			const canAfford = user.balance >= item.price;
			const message = `
🛍️ **Item Details:**

**Name:** ${item.name}
**Price:** $${item.price}
**Category:** ${item.category}
**Status:** Available

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
									callback_data: `confirm_item_${itemId}`,
								},
								{ text: '❌ Cancel', callback_data: 'shop' },
							],
							[
								{
									text: '🔍 View Order Preview',
									callback_data: `preview_item_${itemId}`,
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

	private async confirmItemPurchase(chatId: number, itemId: number) {
		try {
			const item = SHOP_ITEMS.find((i) => i.id === itemId);

			if (!item) {
				await this.bot.sendMessage(chatId, '❌ Item not found.');
				return;
			}

			// Process the order
			const orderResult = await orderService.createOrder({
				chatId,
				item: item.name,
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

	private async handleItemPreview(chatId: number, itemId: number) {
		try {
			const user = await User.findOne({ chatId });
			const item = SHOP_ITEMS.find((i) => i.id === itemId);

			if (!user || !item) {
				await this.bot.sendMessage(chatId, '❌ Preview not available.');
				return;
			}

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
							callback_data: `confirm_item_${itemId}`,
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
			const order = await orderService.getOrder(orderId);

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
**Item:** ${order.item}
**Quantity:** ${order.quantity}
**Total:** $${order.totalPrice}
**Status:** ${statusEmoji[order.status]} ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
**Order Date:** ${order.createdAt.toLocaleDateString()}

${order.status === 'confirmed' ? '📦 Your order is being prepared for delivery!' : ''}
${order.status === 'delivered' ? '🎉 Your order has been delivered!' : ''}

🔗 **Order Link:** ${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${order.orderId}
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
			switch (action) {
				case 'view_order':
					await this.handleViewOrder(chatId, identifier);
					break;

				case 'track_order':
					await this.handleViewOrder(chatId, identifier);
					break;

				case 'confirm_purchase':
					const parts = callbackData.split('_');
					const itemId = parts[2];
					const quantity = parts[3] || '1';

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
					break;

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

				case 'cancel_purchase':
				case 'cancel_booking':
					await this.bot.sendMessage(
						chatId,
						'❌ Purchase cancelled. What else can I help you with?'
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

				case 'recommend_similar':
					const recommendationResponse = await this.actionHandler.executeAction(
						{
							action: 'GET_RECOMMENDATIONS',
							parameters: { preference: identifier },
							confidence: 1,
						},
						chatId
					);
					await this.bot.sendMessage(chatId, recommendationResponse.message, {
						parse_mode: 'Markdown',
					});
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

**Wallet Address:** 
${process.env.AI_WALLET_ADDRESS}

**Steps:**
1. Send USDC from your wallet to the address above
2. Copy your transaction hash
3. Submit the transaction hash using the button below

⚠️ **Important:** Make sure to send from a wallet you control and save your wallet address for verification.
		`;

		const keyboard = {
			inline_keyboard: [
				[{ text: '📋 Submit Transaction Hash', callback_data: 'submit_tx' }],
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
📋 **Submit Transaction Hash**

Please send me your transaction hash from the USDC transfer.

**Format:** Just paste the transaction hash (e.g., 0xabc123...)

⚠️ **Make sure:**
- You sent USDC to the correct wallet address
- The transaction is confirmed on the blockchain
- You have the wallet address you sent from ready

Type your transaction hash below:
		`;

		await this.bot.sendMessage(chatId, message, {
			parse_mode: 'Markdown',
		});
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

			// Store tx hash and ask for wallet address
			this.pendingDeposits.set(chatId, {
				step: 'waiting_wallet_address',
				data: { txHash: txHash.trim() },
			});

			const message = `
✅ **Transaction Hash Received**

Transaction Hash: \`${txHash}\`

Now, please provide the wallet address you sent the USDC from.

**Format:** 0x... (your wallet address)

This helps us verify that you own the transaction.
			`;

			await this.bot.sendMessage(chatId, message, {
				parse_mode: 'Markdown',
			});

			return true;
		} catch (error) {
			console.error('Error handling transaction hash:', error);
			await this.bot.sendMessage(
				chatId,
				'❌ Error processing transaction hash. Please try again.'
			);
			return false;
		}
	}

	private async handleWalletAddressSubmission(
		chatId: number,
		walletAddress: string
	) {
		try {
			const pendingDeposit = this.pendingDeposits.get(chatId);
			if (!pendingDeposit || pendingDeposit.step !== 'waiting_wallet_address') {
				return false;
			}

			await this.bot.sendMessage(
				chatId,
				'🔍 Verifying your deposit...\nThis may take a moment.'
			);

			// Verify the deposit
			const result = await depositService.verifyDeposit({
				chatId,
				txHash: pendingDeposit.data.txHash,
				walletAddress: walletAddress.trim(),
			});

			// Clear pending deposit
			this.pendingDeposits.delete(chatId);

			if (result.success) {
				// Success message with updated balance
				const user = await User.findOne({ chatId });
				const successMessage = `
${result.message}

💰 **Updated Balance:** $${user?.balance || 0} USDC

🎉 **You're all set to start shopping!**
				`;

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
			console.error('Error handling wallet address:', error);
			this.pendingDeposits.delete(chatId);
			await this.bot.sendMessage(
				chatId,
				'❌ Error processing wallet address. Please try again.'
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
		if (pendingDeposit) {
			if (pendingDeposit.step === 'waiting_tx_hash') {
				const handled = await this.handleTransactionHashSubmission(
					chatId,
					text
				);
				if (handled) return;
			} else if (pendingDeposit.step === 'waiting_wallet_address') {
				const handled = await this.handleWalletAddressSubmission(chatId, text);
				if (handled) return;
			}
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

		try {
			// Show typing indicator
			await this.bot.sendChatAction(chatId, 'typing');

			// Add natural delay
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

			// Process with Gemini AI
			console.log('🤖 === AI PROCESSING ===');
			console.log('🤖 Input Text:', text);
			console.log('🤖 User ID for AI:', chatId);

			const geminiResponse = await this.geminiService.processMessage(
				text,
				chatId
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
		}
	}

	public start() {
		console.log('🤖 Telegram bot is running...');
	}

	public stop() {
		this.bot.stopPolling();
		console.log('🤖 Telegram bot stopped.');
	}
}

export default TelegramBotService;

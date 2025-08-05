import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import GeminiService from './geminiService.js';
import ActionHandler from './actionHandler.js';
import LoggingService from './loggingService.js';

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

		// Handle callback queries (button clicks)
		this.bot.on('callback_query', this.handleCallbackQuery.bind(this));

		// Handle text messages
		this.bot.on('message', this.handleMessage.bind(this));
	}

	private async handleStart(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;
		const welcomeMessage = `
🎉 Welcome to Shoq Bot!

I'm your friendly shopping and ticket assistant! 🎊

I can help you with:
🎫 **Booking tickets** for movies, concerts, sports, theater
🛍️ **Shopping for items** like electronics, clothing, home goods
💰 **Checking prices** and comparing options
✨ **Getting recommendations** based on your preferences

Just chat with me naturally - I'll understand what you need! 😊

What's on your mind today?
    `;

		await this.bot.sendMessage(chatId, welcomeMessage, {
			parse_mode: 'Markdown',
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
/help - Show this help message

**How to use:**
1. Use /tickets to see available tickets
2. Use /shop to browse items
3. Click on buttons to navigate
4. Follow the prompts to complete your order

**Features:**
- Real-time ticket availability
- Secure booking process
- Multiple payment options
- Order tracking

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
		const availableItems = SHOP_ITEMS.filter((item) => item.available);

		if (availableItems.length === 0) {
			await this.bot.sendMessage(
				chatId,
				'❌ No items available at the moment.'
			);
			return;
		}

		let message = '🛍️ **Available Items:**\n\n';
		const keyboard = {
			inline_keyboard: availableItems.map((item) => [
				{
					text: `${item.name} - $${item.price}`,
					callback_data: `item_${item.id}`,
				},
			]),
		};

		availableItems.forEach((item) => {
			message += `🛍️ **${item.name}**\n💰 Price: $${item.price}\n📂 Category: ${item.category}\n\n`;
		});

		message += 'Click on an item to buy it!';

		await this.bot.sendMessage(chatId, message, {
			parse_mode: 'Markdown',
			reply_markup: keyboard,
		});
	}

	private async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
		const chatId = query.message?.chat.id;
		const data = query.data;

		if (!chatId || !data) return;

		// Answer the callback query
		await this.bot.answerCallbackQuery(query.id);

		if (data === 'tickets') {
			await this.showTickets(chatId);
		} else if (data === 'shop') {
			await this.showShopItems(chatId);
		} else if (data === 'help') {
			await this.handleHelp({ chat: { id: chatId } } as TelegramBot.Message);
		} else if (data === 'chat') {
			await this.handleChat({ chat: { id: chatId } } as TelegramBot.Message);
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
		} else if (data.startsWith('ui_')) {
			await this.handleUIAction(chatId, data);
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
		const item = SHOP_ITEMS.find((i) => i.id === itemId);

		if (!item || !item.available) {
			await this.bot.sendMessage(
				chatId,
				'❌ This item is no longer available.'
			);
			return;
		}

		const message = `
🛍️ **Item Details:**

**Name:** ${item.name}
**Price:** $${item.price}
**Category:** ${item.category}
**Status:** Available

Would you like to buy this item?
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
		const item = SHOP_ITEMS.find((i) => i.id === itemId);

		if (!item) {
			await this.bot.sendMessage(chatId, '❌ Item not found.');
			return;
		}

		// Simulate purchase process
		const orderId = Math.floor(Math.random() * 1000000);

		const message = `
✅ **Purchase Confirmed!**

**Order ID:** #${orderId}
**Item:** ${item.name}
**Price:** $${item.price}
**Status:** Confirmed

Your order has been placed successfully! You will receive a confirmation email shortly.

Thank you for your purchase! 🛍️
    `;

		const keyboard = {
			inline_keyboard: [
				[
					{ text: '🛍️ Buy Another Item', callback_data: 'shop' },
					{ text: '🏠 Back to Menu', callback_data: 'start' },
				],
			],
		};

		await this.bot.sendMessage(chatId, message, {
			parse_mode: 'Markdown',
			reply_markup: keyboard,
		});
	}

	private async handleUIAction(chatId: number, callbackData: string) {
		const parts = callbackData.split('_');
		const action = parts[1];
		const identifier = parts[2];

		console.log('🔘 === UI ACTION HANDLER ===');
		console.log('🔘 Action:', action);
		console.log('🔘 Identifier:', identifier);

		switch (action) {
			case 'view_order':
				await this.bot.sendMessage(
					chatId,
					`📋 **Order Details**\n\nOrder ID: #${identifier}\nStatus: Processing\nEstimated Delivery: 3-5 business days\n\nTrack your order or contact support if needed! 📦`,
					{ parse_mode: 'Markdown' }
				);
				break;

			case 'track_order':
				await this.bot.sendMessage(
					chatId,
					`🚚 **Order Tracking**\n\nOrder ID: #${identifier}\nStatus: 📦 Package picked up\nLocation: Distribution Center\nNext Update: Tomorrow\n\nYour order is on its way! 🎉`,
					{ parse_mode: 'Markdown' }
				);
				break;

			case 'recommend_similar':
				await this.bot.sendMessage(
					chatId,
					`✨ **Similar Items in ${identifier} Category**\n\n• Coffee Cup Set (4 pieces) - $25\n• Travel Mug - $15\n• Ceramic Teapot - $35\n• Insulated Water Bottle - $20\n\nWould you like to see more options? 🛍️`,
					{ parse_mode: 'Markdown' }
				);
				break;

			default:
				await this.bot.sendMessage(
					chatId,
					"🤔 I'm not sure what you'd like to do with that. How else can I help you? 😊"
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

		// Get or create conversation context
		if (!this.conversationContext.has(chatId)) {
			this.conversationContext.set(chatId, {
				lastAction: null,
				lastItem: null,
				preferences: [],
				conversationCount: 0,
			});
		}

		const context = this.conversationContext.get(chatId);
		context.conversationCount++;

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
										callback_data: `ui_${uiAction.action}_${uiAction.orderId || uiAction.category || 'default'}`,
									},
								]
							),
						};

						// Send message with buttons
						await this.bot.sendMessage(chatId, actionResult.message, {
							parse_mode: 'Markdown',
							reply_markup: keyboard,
						});
					} else {
						// Send message without buttons
						await this.bot.sendMessage(chatId, actionResult.message, {
							parse_mode: 'Markdown',
						});
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

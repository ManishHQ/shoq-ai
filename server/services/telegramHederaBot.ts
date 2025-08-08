import TelegramBot from 'node-telegram-bot-api';
import { HederaAIAgent } from '../ai-tools/hedera-agent.js';
import { hederaVerificationService } from './hederaVerificationService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Enhanced Telegram Bot with Hedera Integration
 * Extends the basic bot with transaction verification capabilities
 */
class TelegramHederaBotService {
	private bot: TelegramBot;
	private hederaAgent: HederaAIAgent;
	private userStates: Map<number, any> = new Map();

	constructor() {
		const token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
		this.bot = new TelegramBot(token, { polling: true });
		this.hederaAgent = new HederaAIAgent();
		this.setupHandlers();
	}

	private setupHandlers() {
		// Start command
		this.bot.onText(/\/start/, this.handleStart.bind(this));
		
		// Hedera commands
		this.bot.onText(/\/verify (.+)/, this.handleVerifyTransaction.bind(this));
		this.bot.onText(/\/balance (.+)/, this.handleCheckBalance.bind(this));
		this.bot.onText(/\/status (.+)/, this.handleTransactionStatus.bind(this));
		this.bot.onText(/\/network/, this.handleNetworkInfo.bind(this));
		this.bot.onText(/\/hedera/, this.handleHederaHelp.bind(this));

		// Handle callback queries
		this.bot.on('callback_query', this.handleCallbackQuery.bind(this));

		// Handle text messages
		this.bot.on('message', this.handleMessage.bind(this));
	}

	private async handleStart(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;
		const welcomeMessage = `
🚀 **Welcome to Shoq Hedera Bot!**

I'm your AI assistant for Hedera blockchain operations and shopping!

**🔧 Hedera Commands:**
/verify [tx-id] - Verify USDC transaction
/balance [account-id] - Check account balance  
/status [tx-id] - Get transaction status
/network - Show network info
/hedera - Hedera help guide

**💬 AI Chat:**
Just talk to me naturally! I can help with:
- Transaction verification
- Balance checking  
- Network status
- Shopping and payments

Try: "Check my balance 0.0.6494628" or "Verify transaction 0.0.123@456.789"
		`;

		const keyboard = {
			inline_keyboard: [
				[
					{ text: '🔍 Verify Transaction', callback_data: 'verify_tx' },
					{ text: '💰 Check Balance', callback_data: 'check_balance' }
				],
				[
					{ text: '🌐 Network Info', callback_data: 'network_info' },
					{ text: '❓ Help', callback_data: 'hedera_help' }
				]
			]
		};

		await this.bot.sendMessage(chatId, welcomeMessage, {
			parse_mode: 'Markdown',
			reply_markup: keyboard
		});
	}

	private async handleVerifyTransaction(msg: TelegramBot.Message, match: RegExpExecArray | null) {
		const chatId = msg.chat.id;
		const transactionId = match?.[1];

		if (!transactionId) {
			await this.bot.sendMessage(chatId, '❌ Please provide a transaction ID.\n\nFormat: /verify 0.0.123@456.789');
			return;
		}

		await this.bot.sendChatAction(chatId, 'typing');
		await this.bot.sendMessage(chatId, '🔍 Verifying transaction... Please wait.');

		try {
			const result = await this.hederaAgent.processQuery(`Verify transaction ${transactionId}`);
			
			// Create action buttons based on result
			const keyboard = result.toolsUsed.length > 0 ? {
				inline_keyboard: [
					[
						{ text: '🔍 Check Status', callback_data: `status_${transactionId}` },
						{ text: '💰 Check Balance', callback_data: 'check_balance' }
					],
					[
						{ text: '🌐 Network Info', callback_data: 'network_info' },
						{ text: '❓ Help', callback_data: 'hedera_help' }
					]
				]
			} : undefined;

			await this.bot.sendMessage(chatId, result.response, {
				parse_mode: 'Markdown',
				reply_markup: keyboard
			});

		} catch (error) {
			console.error('Error verifying transaction:', error);
			await this.bot.sendMessage(chatId, '❌ Error verifying transaction. Please try again.');
		}
	}

	private async handleCheckBalance(msg: TelegramBot.Message, match: RegExpExecArray | null) {
		const chatId = msg.chat.id;
		const accountId = match?.[1];

		if (!accountId) {
			await this.bot.sendMessage(chatId, '❌ Please provide an account ID.\n\nFormat: /balance 0.0.123456');
			return;
		}

		await this.bot.sendChatAction(chatId, 'typing');
		await this.bot.sendMessage(chatId, '💰 Checking balance... Please wait.');

		try {
			const result = await this.hederaAgent.processQuery(`Check balance of account ${accountId}`);
			
			const keyboard = {
				inline_keyboard: [
					[
						{ text: '🔍 Verify Transaction', callback_data: 'verify_tx' },
						{ text: '🔄 Refresh Balance', callback_data: `balance_${accountId}` }
					],
					[
						{ text: '🌐 Network Info', callback_data: 'network_info' },
						{ text: '❓ Help', callback_data: 'hedera_help' }
					]
				]
			};

			await this.bot.sendMessage(chatId, result.response, {
				parse_mode: 'Markdown',
				reply_markup: keyboard
			});

		} catch (error) {
			console.error('Error checking balance:', error);
			await this.bot.sendMessage(chatId, '❌ Error checking balance. Please try again.');
		}
	}

	private async handleTransactionStatus(msg: TelegramBot.Message, match: RegExpExecArray | null) {
		const chatId = msg.chat.id;
		const transactionId = match?.[1];

		if (!transactionId) {
			await this.bot.sendMessage(chatId, '❌ Please provide a transaction ID.\n\nFormat: /status 0.0.123@456.789');
			return;
		}

		await this.bot.sendChatAction(chatId, 'typing');

		try {
			const result = await this.hederaAgent.processQuery(`What's the status of transaction ${transactionId}?`);
			
			const keyboard = {
				inline_keyboard: [
					[
						{ text: '🔍 Verify Transaction', callback_data: `verify_${transactionId}` },
						{ text: '💰 Check Balance', callback_data: 'check_balance' }
					]
				]
			};

			await this.bot.sendMessage(chatId, result.response, {
				parse_mode: 'Markdown',
				reply_markup: keyboard
			});

		} catch (error) {
			console.error('Error getting transaction status:', error);
			await this.bot.sendMessage(chatId, '❌ Error getting transaction status. Please try again.');
		}
	}

	private async handleNetworkInfo(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;
		
		try {
			const result = await this.hederaAgent.processQuery('Show network information');
			
			const keyboard = {
				inline_keyboard: [
					[
						{ text: '🔍 Verify Transaction', callback_data: 'verify_tx' },
						{ text: '💰 Check Balance', callback_data: 'check_balance' }
					]
				]
			};

			await this.bot.sendMessage(chatId, result.response, {
				parse_mode: 'Markdown',
				reply_markup: keyboard
			});

		} catch (error) {
			console.error('Error getting network info:', error);
			await this.bot.sendMessage(chatId, '❌ Error getting network information. Please try again.');
		}
	}

	private async handleHederaHelp(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;
		
		const helpMessage = `
🔧 **Hedera Bot Help Guide**

**📋 Available Commands:**
/verify [tx-id] - Verify USDC transaction
/balance [account-id] - Check account balance
/status [tx-id] - Get transaction status  
/network - Show network configuration
/hedera - This help guide

**💡 Natural Language:**
You can also chat naturally:
- "Check my balance 0.0.123456"
- "Verify transaction 0.0.123@456.789" 
- "What's the status of 0.0.123@456.789?"
- "Show network info"

**📝 Format Examples:**
- Transaction ID: \`0.0.6494628@1754664574.369070408\`
- Account ID: \`0.0.6494628\`

**🌐 Network:** ${hederaVerificationService.getNetworkInfo().network}
**🪙 USDC Token:** ${hederaVerificationService.getNetworkInfo().expectedTokenId}
**🏛️ Treasury:** ${hederaVerificationService.getNetworkInfo().treasuryAccount}
		`;

		const keyboard = {
			inline_keyboard: [
				[
					{ text: '🔍 Verify Transaction', callback_data: 'verify_tx' },
					{ text: '💰 Check Balance', callback_data: 'check_balance' }
				],
				[
					{ text: '🌐 Network Info', callback_data: 'network_info' },
					{ text: '🏠 Main Menu', callback_data: 'start' }
				]
			]
		};

		await this.bot.sendMessage(chatId, helpMessage, {
			parse_mode: 'Markdown',
			reply_markup: keyboard
		});
	}

	private async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
		const chatId = query.message?.chat.id;
		const data = query.data;

		if (!chatId || !data) return;

		await this.bot.answerCallbackQuery(query.id);

		try {
			if (data === 'verify_tx') {
				await this.promptForTransaction(chatId);
			} else if (data === 'check_balance') {
				await this.promptForAccount(chatId);
			} else if (data === 'network_info') {
				await this.handleNetworkInfo({ chat: { id: chatId } } as TelegramBot.Message);
			} else if (data === 'hedera_help') {
				await this.handleHederaHelp({ chat: { id: chatId } } as TelegramBot.Message);
			} else if (data === 'start') {
				await this.handleStart({ chat: { id: chatId } } as TelegramBot.Message);
			} else if (data.startsWith('verify_')) {
				const txId = data.substring(7);
				await this.handleVerifyTransaction(
					{ chat: { id: chatId } } as TelegramBot.Message,
					[data, txId] as RegExpExecArray
				);
			} else if (data.startsWith('status_')) {
				const txId = data.substring(7);
				await this.handleTransactionStatus(
					{ chat: { id: chatId } } as TelegramBot.Message,
					[data, txId] as RegExpExecArray
				);
			} else if (data.startsWith('balance_')) {
				const accountId = data.substring(8);
				await this.handleCheckBalance(
					{ chat: { id: chatId } } as TelegramBot.Message,
					[data, accountId] as RegExpExecArray
				);
			}
		} catch (error) {
			console.error('Error handling callback query:', error);
			await this.bot.sendMessage(chatId, '❌ Error processing request. Please try again.');
		}
	}

	private async promptForTransaction(chatId: number) {
		this.userStates.set(chatId, { waiting: 'transaction_id' });
		
		await this.bot.sendMessage(chatId, 
			'🔍 **Transaction Verification**\n\nPlease send me the transaction ID you want to verify.\n\n**Format:** 0.0.6494628@1754664574.369070408', 
			{ parse_mode: 'Markdown' }
		);
	}

	private async promptForAccount(chatId: number) {
		this.userStates.set(chatId, { waiting: 'account_id' });
		
		await this.bot.sendMessage(chatId, 
			'💰 **Balance Check**\n\nPlease send me the account ID you want to check.\n\n**Format:** 0.0.6494628', 
			{ parse_mode: 'Markdown' }
		);
	}

	private async handleMessage(msg: TelegramBot.Message) {
		const chatId = msg.chat.id;
		const text = msg.text;

		if (!text || text.startsWith('/')) return;

		// Check if user is in a prompt state
		const userState = this.userStates.get(chatId);
		if (userState) {
			if (userState.waiting === 'transaction_id') {
				this.userStates.delete(chatId);
				await this.handleVerifyTransaction(msg, [text, text] as RegExpExecArray);
				return;
			} else if (userState.waiting === 'account_id') {
				this.userStates.delete(chatId);
				await this.handleCheckBalance(msg, [text, text] as RegExpExecArray);
				return;
			}
		}

		// Process with AI agent for natural language
		try {
			await this.bot.sendChatAction(chatId, 'typing');
			
			const result = await this.hederaAgent.processQuery(text);
			
			// Create smart reply keyboard based on what tools were used
			let keyboard;
			if (result.toolsUsed.includes('verify_hedera_transaction')) {
				keyboard = {
					inline_keyboard: [
						[
							{ text: '🔍 Verify Another', callback_data: 'verify_tx' },
							{ text: '💰 Check Balance', callback_data: 'check_balance' }
						]
					]
				};
			} else if (result.toolsUsed.includes('check_hedera_balance')) {
				keyboard = {
					inline_keyboard: [
						[
							{ text: '🔍 Verify Transaction', callback_data: 'verify_tx' },
							{ text: '💰 Check Another Balance', callback_data: 'check_balance' }
						]
					]
				};
			} else if (result.suggestions && result.suggestions.length > 0) {
				keyboard = {
					inline_keyboard: [
						[
							{ text: '🔍 Verify Transaction', callback_data: 'verify_tx' },
							{ text: '💰 Check Balance', callback_data: 'check_balance' }
						],
						[
							{ text: '🌐 Network Info', callback_data: 'network_info' },
							{ text: '❓ Help', callback_data: 'hedera_help' }
						]
					]
				};
			}

			await this.bot.sendMessage(chatId, result.response, {
				parse_mode: 'Markdown',
				reply_markup: keyboard
			});

			// Show suggestions if available
			if (result.suggestions && result.suggestions.length > 0) {
				const suggestionText = `💡 **Try these:**\n${result.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
				setTimeout(async () => {
					await this.bot.sendMessage(chatId, suggestionText, { parse_mode: 'Markdown' });
				}, 1000);
			}

		} catch (error) {
			console.error('Error processing message:', error);
			await this.bot.sendMessage(chatId, 
				'❌ Sorry, I had trouble processing that. Please try again or use /hedera for help.'
			);
		}
	}

	public start() {
		console.log('🚀 Hedera Telegram Bot is running...');
		console.log('🌐 Network:', hederaVerificationService.getNetworkInfo().network);
		console.log('🪙 USDC Token:', hederaVerificationService.getNetworkInfo().expectedTokenId);
		console.log('🏛️ Treasury:', hederaVerificationService.getNetworkInfo().treasuryAccount);
	}

	public stop() {
		this.bot.stopPolling();
		console.log('🛑 Hedera Telegram Bot stopped.');
	}
}

export default TelegramHederaBotService;
import { HederaAITools } from './hedera-tools.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Hedera AI Agent - Dynamic tool-calling AI for Hedera operations
 */
export class HederaAIAgent {
	private tools = HederaAITools.getTools();
	private conversationHistory: Array<{
		role: 'user' | 'assistant' | 'tool';
		content: string;
		toolCall?: any;
		toolResult?: any;
		timestamp: Date;
	}> = [];

	/**
	 * Process a user query and determine which tools to use
	 */
	async processQuery(query: string): Promise<{
		response: string;
		toolsUsed: string[];
		results: any[];
		suggestions?: string[];
	}> {
		console.log(`🤖 Processing query: "${query}"`);
		
		// Add user query to history
		this.conversationHistory.push({
			role: 'user',
			content: query,
			timestamp: new Date()
		});

		// Analyze query and determine tools needed
		const toolCalls = this.analyzeQueryForTools(query);
		
		if (toolCalls.length === 0) {
			const response = this.generateHelpResponse(query);
			this.conversationHistory.push({
				role: 'assistant',
				content: response,
				timestamp: new Date()
			});
			
			return {
				response,
				toolsUsed: [],
				results: [],
				suggestions: this.getSuggestions()
			};
		}

		// Execute tools
		const toolResults = await HederaAITools.executeBatch(toolCalls);
		const toolsUsed = toolCalls.map(call => call.name);

		// Generate response based on results
		const response = this.generateResponse(query, toolResults);
		
		// Add to history
		this.conversationHistory.push({
			role: 'assistant',
			content: response,
			toolCall: toolCalls,
			toolResult: toolResults,
			timestamp: new Date()
		});

		return {
			response,
			toolsUsed,
			results: toolResults,
			suggestions: this.getSuggestions()
		};
	}

	/**
	 * Analyze user query to determine which tools to call
	 */
	private analyzeQueryForTools(query: string): Array<{
		id: string;
		name: string;
		parameters: any;
	}> {
		const tools: Array<{
			id: string;
			name: string;
			parameters: any;
		}> = [];

		const lowerQuery = query.toLowerCase();

		// Transaction verification patterns
		const txIdPattern = /0\.0\.\d+[@-]\d+[\.~-]\d+/g;
		const txMatches = query.match(txIdPattern);
		if (txMatches || lowerQuery.includes('verify') || lowerQuery.includes('transaction')) {
			if (txMatches) {
				txMatches.forEach((txId, index) => {
					tools.push({
						id: `verify_${index}`,
						name: 'verify_hedera_transaction',
						parameters: { transactionId: txId }
					});
				});
			}
		}

		// Status check patterns
		if (txMatches && (lowerQuery.includes('status') || lowerQuery.includes('check'))) {
			txMatches.forEach((txId, index) => {
				tools.push({
					id: `status_${index}`,
					name: 'get_hedera_transaction_status',
					parameters: { transactionId: txId }
				});
			});
		}

		// Account balance patterns
		const accountPattern = /0\.0\.\d+/g;
		const accountMatches = query.match(accountPattern);
		if ((accountMatches || lowerQuery.includes('balance')) && 
			(lowerQuery.includes('balance') || lowerQuery.includes('account'))) {
			if (accountMatches) {
				// Remove transaction IDs from account matches
				const accountIds = accountMatches.filter(id => !txMatches?.includes(id));
				accountIds.forEach((accountId, index) => {
					tools.push({
						id: `balance_${index}`,
						name: 'check_hedera_balance',
						parameters: { accountId }
					});
				});
			}
		}

		// Network info patterns
		if (lowerQuery.includes('network') || lowerQuery.includes('config') || lowerQuery.includes('info')) {
			tools.push({
				id: 'network_info',
				name: 'get_hedera_network_info',
				parameters: {}
			});
		}

		// Validation patterns
		if (lowerQuery.includes('valid') && accountMatches) {
			accountMatches.forEach((accountId, index) => {
				tools.push({
					id: `validate_${index}`,
					name: 'validate_hedera_account',
					parameters: { accountId }
				});
			});
		}

		// Amount formatting patterns
		const amountPattern = /(\d+(?:\.\d+)?)\s*(?:usdc|tokens?)/gi;
		const amountMatches = query.match(amountPattern);
		if (amountMatches && (lowerQuery.includes('format') || lowerQuery.includes('convert'))) {
			amountMatches.forEach((match, index) => {
				const amount = parseFloat(match.replace(/[^\d.]/g, ''));
				if (!isNaN(amount)) {
					tools.push({
						id: `format_${index}`,
						name: 'format_hedera_amount',
						parameters: { amount: amount * 1000000, decimals: 6 } // Convert to micro-units
					});
				}
			});
		}

		return tools;
	}

	/**
	 * Generate response based on tool results
	 */
	private generateResponse(query: string, toolResults: any[]): string {
		if (toolResults.length === 0) {
			return "I couldn't find any specific Hedera operations to perform based on your query.";
		}

		let response = "🔍 **Hedera Analysis Results:**\n\n";

		toolResults.forEach((result, index) => {
			response += `**${result.toolName.replace(/_/g, ' ').toUpperCase()}:**\n`;
			response += `${result.message}\n`;

			if (result.success && result.data) {
				// Add specific details based on tool type
				if (result.toolName === 'verify_hedera_transaction') {
					response += `   💰 Amount: ${result.data.amount} USDC\n`;
					response += `   👤 From: ${result.data.sender}\n`;
					response += `   🏛️ To: ${result.data.receiver}\n`;
					response += `   🔗 [View on Hashscan](${result.data.hashscanUrl})\n`;
				} else if (result.toolName === 'check_hedera_balance') {
					response += `   💎 HBAR: ${result.data.hbarBalance} tinybars\n`;
					response += `   💰 USDC: ${result.data.usdcBalance} USDC\n`;
					response += `   🪙 Total Tokens: ${result.data.totalTokens}\n`;
				} else if (result.toolName === 'get_hedera_transaction_status') {
					response += `   📊 Status: ${result.data.status}\n`;
					response += `   ⏰ Timestamp: ${result.data.timestamp}\n`;
					response += `   🔗 [View on Hashscan](${result.data.hashscanUrl})\n`;
				} else if (result.toolName === 'get_hedera_network_info') {
					response += `   🌐 Network: ${result.data.network}\n`;
					response += `   🪙 USDC Token: ${result.data.expectedTokenId}\n`;
					response += `   🏛️ Treasury: ${result.data.treasuryAccount}\n`;
				}
			}

			response += "\n";
		});

		// Add summary if multiple operations
		if (toolResults.length > 1) {
			const successCount = toolResults.filter(r => r.success).length;
			response += `\n📋 **Summary:** ${successCount}/${toolResults.length} operations completed successfully.\n`;
		}

		return response;
	}

	/**
	 * Generate help response for unclear queries
	 */
	private generateHelpResponse(query: string): string {
		return `🤖 **Hedera AI Assistant**

I can help you with Hedera operations! Here's what I can do:

**🔍 Transaction Operations:**
- Verify transactions: "Verify transaction 0.0.123@1234567890.123456789"
- Check status: "What's the status of 0.0.123@1234567890.123456789?"

**💰 Account Operations:**
- Check balances: "Check balance of 0.0.123456"
- Validate accounts: "Is 0.0.123456 a valid account?"

**📊 Network Information:**
- Get network info: "Show network configuration"
- Format amounts: "Format 1000000 USDC tokens"

**💡 Try asking:**
- "Verify this transaction: [transaction-id]"
- "Check my account balance: [account-id]"
- "What's the network status?"

Your query: "${query}" - I couldn't identify specific operations to perform.`;
	}

	/**
	 * Get contextual suggestions
	 */
	private getSuggestions(): string[] {
		const suggestions = [
			"Check account balance: 0.0.6494628",
			"Show network information",
			"Verify a transaction with ID",
			"Check transaction status",
			"Validate account format"
		];

		// Add context-specific suggestions based on history
		const recentTools = this.conversationHistory
			.slice(-3)
			.filter(h => h.toolCall)
			.flatMap(h => h.toolCall?.map((t: any) => t.name) || []);

		if (recentTools.includes('verify_hedera_transaction')) {
			suggestions.unshift("Check the transaction status");
		}

		if (recentTools.includes('check_hedera_balance')) {
			suggestions.unshift("Verify a recent transaction");
		}

		return suggestions.slice(0, 3);
	}

	/**
	 * Get conversation history
	 */
	getHistory() {
		return this.conversationHistory;
	}

	/**
	 * Clear conversation history
	 */
	clearHistory() {
		this.conversationHistory = [];
	}

	/**
	 * Get available tools
	 */
	getAvailableTools() {
		return this.tools.map(tool => ({
			name: tool.name,
			description: tool.description,
			parameters: Object.keys(tool.parameters.properties)
		}));
	}
}
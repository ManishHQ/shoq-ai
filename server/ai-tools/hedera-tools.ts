import { hederaVerificationService } from '../services/hederaVerificationService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Tool definitions for AI agents
 */
export const hederaTools = [
	{
		name: 'verify_hedera_transaction',
		description:
			'Verify a Hedera USDC transaction by transaction ID. Checks if the transaction is valid, successful, and transfers USDC to the treasury account.',
		parameters: {
			type: 'object',
			properties: {
				transactionId: {
					type: 'string',
					description:
						"Hedera transaction ID in format '0.0.XXXXX@TIMESTAMP.NANOSECONDS' or '0.0.XXXXX-TIMESTAMP-NANOSECONDS'",
					pattern: '^0\\.0\\.\\d+[@-]\\d+[\\.-]\\d+$',
				},
			},
			required: ['transactionId'],
		},
	},
	{
		name: 'check_hedera_balance',
		description:
			'Check the HBAR and token balances of a Hedera account, including USDC balance.',
		parameters: {
			type: 'object',
			properties: {
				accountId: {
					type: 'string',
					description: "Hedera account ID in format '0.0.XXXXX'",
					pattern: '^0\\.0\\.\\d+$',
				},
			},
			required: ['accountId'],
		},
	},
	{
		name: 'get_hedera_transaction_status',
		description:
			'Get the status and details of a Hedera transaction. Useful for checking if a transaction exists and was successful.',
		parameters: {
			type: 'object',
			properties: {
				transactionId: {
					type: 'string',
					description:
						"Hedera transaction ID in format '0.0.XXXXX@TIMESTAMP.NANOSECONDS' or '0.0.XXXXX-TIMESTAMP-NANOSECONDS'",
					pattern: '^0\\.0\\.\\d+[@-]\\d+[\\.-]\\d+$',
				},
			},
			required: ['transactionId'],
		},
	},
	{
		name: 'get_hedera_network_info',
		description:
			'Get current Hedera network configuration including network type, mirror node URL, expected USDC token ID, and treasury account.',
		parameters: {
			type: 'object',
			properties: {},
		},
	},
	{
		name: 'validate_hedera_account',
		description:
			'Validate if an account ID follows the correct Hedera format (0.0.XXXXX).',
		parameters: {
			type: 'object',
			properties: {
				accountId: {
					type: 'string',
					description: 'Account ID to validate',
				},
			},
			required: ['accountId'],
		},
	},
	{
		name: 'format_hedera_amount',
		description:
			'Format a Hedera token amount with proper decimals for display (useful for USDC with 6 decimals).',
		parameters: {
			type: 'object',
			properties: {
				amount: {
					type: 'number',
					description: 'Raw token amount (in smallest units)',
				},
				decimals: {
					type: 'number',
					description: 'Number of decimal places (default: 6 for USDC)',
					default: 6,
				},
			},
			required: ['amount'],
		},
	},
];

/**
 * Tool execution handler
 */
export async function executeHederaTool(
	toolName: string,
	parameters: any
): Promise<{
	success: boolean;
	data?: any;
	message: string;
	error?: string;
}> {
	try {
		console.log(`🔧 Executing tool: ${toolName} with parameters:`, parameters);

		switch (toolName) {
			case 'verify_hedera_transaction':
				return await verifyTransaction(parameters.transactionId);

			case 'check_hedera_balance':
				return await checkBalance(parameters.accountId);

			case 'get_hedera_transaction_status':
				return await getTransactionStatus(parameters.transactionId);

			case 'get_hedera_network_info':
				return getNetworkInfo();

			case 'validate_hedera_account':
				return validateAccount(parameters.accountId);

			case 'format_hedera_amount':
				return formatAmount(parameters.amount, parameters.decimals || 6);

			default:
				return {
					success: false,
					message: `Unknown tool: ${toolName}`,
					error: 'Tool not found',
				};
		}
	} catch (error) {
		console.error(`Tool execution error for ${toolName}:`, error);
		return {
			success: false,
			message: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// Tool implementation functions
async function verifyTransaction(transactionId: string) {
	const verification =
		await hederaVerificationService.verifyTransaction(transactionId);

	if (!verification.isValid) {
		return {
			success: false,
			message: `❌ Transaction verification failed: ${verification.error}`,
			error: verification.error,
			data: { isValid: false },
		};
	}

	const isRecent = verification.timestamp
		? hederaVerificationService.isTransactionRecent(verification.timestamp)
		: false;

	return {
		success: true,
		message: `✅ Transaction verified! ${verification.amount} USDC received from ${verification.sender}`,
		data: {
			isValid: true,
			amount: verification.amount,
			tokenId: verification.tokenId,
			sender: verification.sender,
			receiver: verification.receiver,
			timestamp: verification.timestamp,
			isRecent,
			hashscanUrl: `https://hashscan.io/testnet/transaction/${transactionId}`,
		},
	};
}

async function checkBalance(accountId: string) {
	const balanceInfo =
		await hederaVerificationService.getAccountBalance(accountId);

	if (!balanceInfo.success) {
		return {
			success: false,
			message: `❌ Failed to get balance: ${balanceInfo.error}`,
			error: balanceInfo.error,
		};
	}

	const networkInfo = hederaVerificationService.getNetworkInfo();
	const usdcTokenId = networkInfo.expectedTokenId;
	const usdcBalance = balanceInfo.tokenBalances?.[usdcTokenId] || 0;
	const usdcFormatted = hederaVerificationService.formatAmount(usdcBalance, 6);

	return {
		success: true,
		message: `✅ Account ${accountId}: ${balanceInfo.balance} tinybars, ${usdcFormatted} USDC`,
		data: {
			accountId,
			hbarBalance: balanceInfo.balance,
			usdcBalance: parseFloat(usdcFormatted),
			tokenBalances: balanceInfo.tokenBalances,
			totalTokens: Object.keys(balanceInfo.tokenBalances || {}).length,
		},
	};
}

async function getTransactionStatus(transactionId: string) {
	const statusInfo =
		await hederaVerificationService.getTransactionStatus(transactionId);
	const networkInfo = hederaVerificationService.getNetworkInfo();

	const hashscanUrl = `https://hashscan.io/${networkInfo.network}/transaction/${transactionId}`;

	if (!statusInfo.exists) {
		return {
			success: false,
			message: `❌ Transaction not found: ${statusInfo.error}`,
			error: statusInfo.error,
			data: {
				exists: false,
				hashscanUrl,
			},
		};
	}

	return {
		success: true,
		message: `✅ Transaction exists with status: ${statusInfo.status}`,
		data: {
			exists: true,
			status: statusInfo.status,
			timestamp: statusInfo.timestamp,
			hashscanUrl,
			isSuccess: statusInfo.status === 'SUCCESS',
		},
	};
}

function getNetworkInfo() {
	const networkInfo = hederaVerificationService.getNetworkInfo();

	return {
		success: true,
		message: `✅ Connected to Hedera ${networkInfo.network}`,
		data: {
			...networkInfo,
			mirrorNodeActive: true,
			supportedTokens: ['USDC'],
			features: [
				'transaction_verification',
				'balance_checking',
				'status_lookup',
			],
		},
	};
}

function validateAccount(accountId: string) {
	const isValid = hederaVerificationService.isValidAccountId(accountId);

	return {
		success: true,
		message: `${isValid ? '✅' : '❌'} Account ID ${accountId} is ${isValid ? 'valid' : 'invalid'}`,
		data: {
			accountId,
			isValid,
			format: isValid ? 'correct' : 'invalid',
			expectedFormat: '0.0.XXXXX',
		},
	};
}

function formatAmount(amount: number, decimals: number = 6) {
	const formatted = hederaVerificationService.formatAmount(amount, decimals);

	return {
		success: true,
		message: `✅ Formatted: ${amount} → ${formatted}`,
		data: {
			rawAmount: amount,
			formattedAmount: formatted,
			decimals,
			unit: decimals === 6 ? 'USDC' : 'tokens',
		},
	};
}

/**
 * AI Tool Calling Interface
 */
export class HederaAITools {
	/**
	 * Get available tools for AI
	 */
	static getTools() {
		return hederaTools;
	}

	/**
	 * Execute a tool call
	 */
	static async execute(toolCall: { name: string; parameters: any }) {
		return await executeHederaTool(toolCall.name, toolCall.parameters);
	}

	/**
	 * Batch execute multiple tool calls
	 */
	static async executeBatch(
		toolCalls: Array<{
			id?: string;
			name: string;
			parameters: any;
		}>
	) {
		const results = [];

		for (const call of toolCalls) {
			const result = await this.execute(call);
			results.push({
				id: call.id,
				toolName: call.name,
				...result,
			});
		}

		return results;
	}

	/**
	 * Get tool by name
	 */
	static getTool(name: string) {
		return hederaTools.find((tool) => tool.name === name);
	}

	/**
	 * Validate tool parameters
	 */
	static validateParameters(
		toolName: string,
		parameters: any
	): {
		valid: boolean;
		errors?: string[];
	} {
		const tool = this.getTool(toolName);
		if (!tool) {
			return { valid: false, errors: ['Tool not found'] };
		}

		const errors: string[] = [];
		const required = tool.parameters.required || [];

		// Check required parameters
		for (const param of required) {
			if (!(param in parameters)) {
				errors.push(`Missing required parameter: ${param}`);
			}
		}

		// Basic type checking
		for (const [key, value] of Object.entries(parameters)) {
			const paramDef = (tool.parameters.properties as any)[key];
			if (paramDef && paramDef.pattern && typeof value === 'string') {
				const regex = new RegExp(paramDef.pattern);
				if (!regex.test(value)) {
					errors.push(`Parameter ${key} doesn't match required pattern`);
				}
			}
		}

		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : undefined,
		};
	}
}

import { Router, Request, Response } from 'express';
import LoggingService from '../services/loggingService.js';
import express from 'express';
import { usdcService } from '../services/usdcService.js';

const router = Router();
const loggingService = new LoggingService();

// Get all logs
router.get('/logs', (req: Request, res: Response) => {
	try {
		const limit = parseInt(req.query.limit as string) || 100;
		const logs = loggingService.getAllLogs(limit);

		res.json({
			success: true,
			count: logs.length,
			logs: logs,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to retrieve logs',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Get logs by type
router.get('/logs/:type', (req: Request, res: Response) => {
	try {
		const type = req.params.type as
			| 'message'
			| 'voice'
			| 'image'
			| 'action'
			| 'response'
			| 'error';
		const limit = parseInt(req.query.limit as string) || 50;
		const logs = loggingService.getLogsByType(type, limit);

		res.json({
			success: true,
			type: type,
			count: logs.length,
			logs: logs,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to retrieve logs by type',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Get logs for a specific user
router.get('/logs/user/:userId', (req: Request, res: Response) => {
	try {
		const userId = parseInt(req.params.userId);
		const limit = parseInt(req.query.limit as string) || 50;
		const logs = loggingService.getUserLogs(userId, limit);

		res.json({
			success: true,
			userId: userId,
			count: logs.length,
			logs: logs,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to retrieve user logs',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Get logs for a specific chat
router.get('/logs/chat/:chatId', (req: Request, res: Response) => {
	try {
		const chatId = parseInt(req.params.chatId);
		const limit = parseInt(req.query.limit as string) || 50;
		const logs = loggingService.getChatLogs(chatId, limit);

		res.json({
			success: true,
			chatId: chatId,
			count: logs.length,
			logs: logs,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to retrieve chat logs',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Export logs as JSON
router.get('/logs/export/json', (req: Request, res: Response) => {
	try {
		const logs = loggingService.exportLogs();

		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Disposition', 'attachment; filename=bot-logs.json');
		res.send(logs);
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to export logs',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Clear logs
router.delete('/logs', (req: Request, res: Response) => {
	try {
		loggingService.clearLogs();

		res.json({
			success: true,
			message: 'Logs cleared successfully',
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to clear logs',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Get system status
router.get('/status', (req: Request, res: Response) => {
	try {
		const allLogs = loggingService.getAllLogs();
		const messageLogs = loggingService.getLogsByType('message', 10);
		const voiceLogs = loggingService.getLogsByType('voice', 10);
		const imageLogs = loggingService.getLogsByType('image', 10);
		const actionLogs = loggingService.getLogsByType('action', 10);
		const responseLogs = loggingService.getLogsByType('response', 10);
		const errorLogs = loggingService.getLogsByType('error', 10);

		res.json({
			success: true,
			status: 'running',
			timestamp: new Date().toISOString(),
			statistics: {
				total_logs: allLogs.length,
				message_logs: messageLogs.length,
				voice_logs: voiceLogs.length,
				image_logs: imageLogs.length,
				action_logs: actionLogs.length,
				response_logs: responseLogs.length,
				error_logs: errorLogs.length,
			},
			recent_activity: {
				messages: messageLogs.slice(-5),
				voices: voiceLogs.slice(-5),
				images: imageLogs.slice(-5),
				actions: actionLogs.slice(-5),
				responses: responseLogs.slice(-5),
				errors: errorLogs.slice(-5),
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to get system status',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Debug endpoint to check addresses and token associations
router.get('/check-addresses', async (req, res) => {
	try {
		console.log('🔍 Checking addresses involved in the transaction...\n');

		// Get addresses from environment
		const operatorAddress = process.env.OPERATOR_ADDRESS;
		const shopOwnerAddress = process.env.SHOP_OWNER_ADDRESS;
		const defaultTokenId = process.env.HEDERA_USDC_TOKEN_ID || '0.0.6528760'; // USDC token ID

		const result = {
			addresses: {
				operatorAddress,
				shopOwnerAddress,
				defaultTokenId,
			},
			balances: {},
			associations: {},
		};

		console.log('📋 Addresses Configuration:');
		console.log(`Operator Address: ${operatorAddress}`);
		console.log(`Shop Owner Address: ${shopOwnerAddress}`);
		console.log(`USDC Token ID: ${defaultTokenId}\n`);

		// Check operator account balance
		console.log('💰 Checking Operator Account Balance:');
		const operatorBalance = await usdcService.getBalance(
			operatorAddress,
			defaultTokenId
		);
		if (operatorBalance) {
			console.log(`✅ Operator has ${operatorBalance.balance} USDC tokens`);
			result.balances.operator = operatorBalance;
		} else {
			console.log('❌ Operator has no USDC tokens or token not associated');
			result.balances.operator = null;
		}

		// Check shop owner account balance
		console.log('\n💰 Checking Shop Owner Account Balance:');
		const shopOwnerBalance = await usdcService.getBalance(
			shopOwnerAddress,
			defaultTokenId
		);
		if (shopOwnerBalance) {
			console.log(`✅ Shop Owner has ${shopOwnerBalance.balance} USDC tokens`);
			result.balances.shopOwner = shopOwnerBalance;
		} else {
			console.log('❌ Shop Owner has no USDC tokens or token not associated');
			result.balances.shopOwner = null;
		}

		// Check if accounts have token association
		console.log('\n🔗 Checking Token Associations:');

		// For operator account
		try {
			const operatorBalanceCheck = await usdcService.getBalance(
				operatorAddress,
				defaultTokenId
			);
			if (operatorBalanceCheck && operatorBalanceCheck.balance >= 0) {
				console.log('✅ Operator account has USDC token associated');
				result.associations.operator = true;
			} else {
				console.log('❌ Operator account does NOT have USDC token associated');
				result.associations.operator = false;
			}
		} catch (error) {
			console.log('❌ Operator account does NOT have USDC token associated');
			result.associations.operator = false;
		}

		// For shop owner account
		try {
			const shopOwnerBalanceCheck = await usdcService.getBalance(
				shopOwnerAddress,
				defaultTokenId
			);
			if (shopOwnerBalanceCheck && shopOwnerBalanceCheck.balance >= 0) {
				console.log('✅ Shop Owner account has USDC token associated');
				result.associations.shopOwner = true;
			} else {
				console.log(
					'❌ Shop Owner account does NOT have USDC token associated'
				);
				result.associations.shopOwner = false;
			}
		} catch (error) {
			console.log('❌ Shop Owner account does NOT have USDC token associated');
			result.associations.shopOwner = false;
		}

		console.log('\n📝 Summary:');
		console.log(
			'The error "TOKENNOTASSOCIATEDTOACCOUNT" means the sender account'
		);
		console.log('does not have the USDC token associated with their account.');

		res.json({
			success: true,
			message: 'Address check completed',
			data: result,
			error:
				'TOKENNOTASSOCIATEDTOACCOUNT means the sender account does not have the USDC token associated',
		});
	} catch (error) {
		console.error('❌ Error checking addresses:', error);
		res.status(500).json({
			success: false,
			message: 'Error checking addresses',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Debug endpoint to associate operator account with USDC token
router.post('/associate-token', async (req, res) => {
	try {
		const operatorAddress = process.env.OPERATOR_ADDRESS;
		const defaultTokenId = process.env.HEDERA_USDC_TOKEN_ID || '0.0.6528760'; // USDC token ID

		console.log('🔗 Associating operator account with USDC token...');
		console.log(`Operator Address: ${operatorAddress}`);
		console.log(`USDC Token ID: ${defaultTokenId}`);

		const result = await usdcService.associateToken(
			operatorAddress,
			defaultTokenId
		);

		if (result.success) {
			console.log('✅ Token association successful!');
			console.log(`Transaction ID: ${result.transactionId}`);

			res.json({
				success: true,
				message: 'Token association successful',
				data: {
					operatorAddress,
					tokenId: defaultTokenId,
					transactionId: result.transactionId,
				},
			});
		} else {
			console.log('❌ Token association failed:', result.error);

			res.status(400).json({
				success: false,
				message: 'Token association failed',
				error: result.error,
			});
		}
	} catch (error) {
		console.error('❌ Error associating token:', error);
		res.status(500).json({
			success: false,
			message: 'Error associating token',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Debug endpoint to get detailed account information
router.get('/account-details/:accountId', async (req, res) => {
	try {
		const accountId = req.params.accountId;
		const defaultTokenId = process.env.HEDERA_USDC_TOKEN_ID || '0.0.6528760'; // USDC token ID

		console.log(`🔍 Getting detailed account information for: ${accountId}`);

		// Try to get balance
		let balance = null;
		let balanceError = null;
		try {
			balance = await usdcService.getBalance(accountId, defaultTokenId);
		} catch (error) {
			balanceError = error instanceof Error ? error.message : 'Unknown error';
		}

		// Try to associate token (this will fail if already associated, but gives us info)
		let associationResult = null;
		try {
			associationResult = await usdcService.associateToken(
				accountId,
				defaultTokenId
			);
		} catch (error) {
			// This is expected to fail if already associated
		}

		const result = {
			accountId,
			tokenId: defaultTokenId,
			balance,
			balanceError,
			associationResult,
			isAssociated: balance !== null && balance.balance !== null,
			hasBalance: balance !== null && balance.balance > 0,
		};

		console.log('📋 Account Details:', result);

		res.json({
			success: true,
			message: 'Account details retrieved',
			data: result,
		});
	} catch (error) {
		console.error('❌ Error getting account details:', error);
		res.status(500).json({
			success: false,
			message: 'Error getting account details',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

export default router;

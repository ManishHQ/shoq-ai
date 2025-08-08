import Deposit from '../models/deposit.model.js';
import User from '../models/user.model.js';
import { usdcService } from './usdcService.js';
import { hederaVerificationService } from './hederaVerificationService.js';

export interface DepositVerificationRequest {
	chatId?: number;
	walletAddress?: string;
	email?: string;
	txHash: string;
	expectedAmount?: number; // Optional - for additional validation
}

export interface DepositVerificationResult {
	success: boolean;
	message: string;
	deposit?: any;
	error?: string;
}

class DepositService {
	private readonly SHOQ_TREASURY_ACCOUNT = process.env.SHOQ_TREASURY_ACCOUNT || '0.0.654321';
	private readonly MIN_DEPOSIT_AMOUNT = 1; // 1 USDC minimum for Hedera testnet

	/**
	 * Verify a deposit transaction on Hedera blockchain
	 */
	async verifyDeposit(request: DepositVerificationRequest): Promise<DepositVerificationResult> {
		try {
			// Validate request
			if (!request.txHash) {
				return {
					success: false,
					message: '❌ Transaction hash is required.',
					error: 'Missing transaction hash'
				};
			}

			// Check if transaction hash already exists
			const existingDeposit = await Deposit.findOne({ txHash: request.txHash });
			if (existingDeposit) {
				return {
					success: false,
					message: '❌ This transaction has already been processed.',
					error: 'Duplicate transaction hash'
				};
			}

			// Find user by available identifier
			const user = await this.findUserByIdentifier(request);
			if (!user) {
				return {
					success: false,
					message: '❌ User not found. Please ensure you have an account with us.',
					error: 'User not found'
				};
			}

			// Verify transaction on Hedera blockchain
			console.log('🔍 Verifying transaction on Hedera:', request.txHash);
			const verification = await hederaVerificationService.verifyTransaction(request.txHash);

			if (!verification.isValid) {
				return {
					success: false,
					message: `❌ Transaction verification failed: ${verification.error}`,
					error: verification.error
				};
			}

			// Additional amount validation if expected amount is provided
			if (request.expectedAmount && verification.amount) {
				const tolerance = 0.01; // Allow 0.01 USDC tolerance
				if (Math.abs(verification.amount - request.expectedAmount) > tolerance) {
					return {
						success: false,
						message: `❌ Amount mismatch. Expected: ${request.expectedAmount} USDC, Found: ${verification.amount} USDC`,
						error: 'Amount mismatch'
					};
				}
			}

			// Check minimum deposit amount
			if (verification.amount! < this.MIN_DEPOSIT_AMOUNT) {
				return {
					success: false,
					message: `❌ Minimum deposit amount is ${this.MIN_DEPOSIT_AMOUNT} USDC. Found: ${verification.amount} USDC`,
					error: 'Below minimum deposit'
				};
			}

			// Check if transaction is recent (within 24 hours)
			if (verification.timestamp && !hederaVerificationService.isTransactionRecent(verification.timestamp)) {
				return {
					success: false,
					message: '❌ Transaction is too old. Please use a transaction from the last 24 hours.',
					error: 'Transaction too old'
				};
			}

			// Create deposit record
			const deposit = new Deposit({
				userId: user._id,
				txHash: request.txHash,
				amount: verification.amount!,
				confirmed: true,
				walletAddress: verification.sender || 'unknown',
			});

			await deposit.save();

			// Update user balance
			user.balance += verification.amount!;
			await user.save();

			// Log successful verification
			console.log('✅ Deposit verified and processed:', {
				userId: user._id,
				txHash: request.txHash,
				amount: verification.amount,
				userBalance: user.balance
			});

			return {
				success: true,
				message: `✅ Deposit verified! Added ${verification.amount} USDC to your balance.\n\n` +
						`Transaction: ${request.txHash}\n` +
						`Amount: ${verification.amount} USDC\n` +
						`New Balance: ${user.balance.toFixed(2)} USDC\n` +
						`Verified on: ${verification.timestamp ? new Date(parseFloat(verification.timestamp) * 1000).toLocaleString() : 'Unknown'}`,
				deposit: {
					id: deposit._id,
					txHash: deposit.txHash,
					amount: deposit.amount,
					confirmed: deposit.confirmed,
					createdAt: deposit.createdAt,
					blockchain: {
						network: hederaVerificationService.getNetworkInfo().network,
						tokenId: verification.tokenId,
						sender: verification.sender,
						receiver: verification.receiver,
						timestamp: verification.timestamp
					}
				}
			};

		} catch (error) {
			console.error('Error verifying deposit:', error);
			return {
				success: false,
				message: '❌ Error processing deposit. Please try again or contact support.',
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Find user by available identifier
	 */
	private async findUserByIdentifier(request: DepositVerificationRequest): Promise<any | null> {
		if (request.chatId) {
			return await User.findOne({ chatId: request.chatId });
		}
		
		if (request.walletAddress) {
			return await User.findOne({ walletAddress: request.walletAddress });
		}
		
		if (request.email) {
			return await User.findOne({ email: request.email });
		}
		
		return null;
	}


	/**
	 * Get deposit history for a user
	 */
	async getDepositHistory(chatId: number): Promise<any[]> {
		try {
			const user = await User.findOne({ chatId });
			if (!user) {
				return [];
			}

			const deposits = await Deposit.find({ userId: user._id })
				.sort({ createdAt: -1 })
				.limit(10);

			return deposits;
		} catch (error) {
			console.error('Error getting deposit history:', error);
			return [];
		}
	}

	/**
	 * Get total deposits for a user
	 */
	async getTotalDeposits(chatId: number): Promise<number> {
		try {
			const user = await User.findOne({ chatId });
			if (!user) {
				return 0;
			}

			const result = await Deposit.aggregate([
				{ $match: { userId: user._id, confirmed: true } },
				{ $group: { _id: null, total: { $sum: '$amount' } } }
			]);

			return result.length > 0 ? result[0].total : 0;
		} catch (error) {
			console.error('Error calculating total deposits:', error);
			return 0;
		}
	}
}

export const depositService = new DepositService();
export default depositService;
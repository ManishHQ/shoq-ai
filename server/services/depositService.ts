import Deposit from '../models/deposit.model.js';
import User from '../models/user.model.js';
import { usdcService } from './usdcService.js';

export interface DepositVerificationRequest {
	chatId: number;
	txHash: string;
	walletAddress: string;
}

export interface DepositVerificationResult {
	success: boolean;
	message: string;
	deposit?: any;
	error?: string;
}

class DepositService {
	private readonly AI_WALLET_ADDRESS = process.env.AI_WALLET_ADDRESS || '0xABC123DEF456789...';
	private readonly MIN_DEPOSIT_AMOUNT = 100; // 100 USDC minimum

	/**
	 * Verify a deposit transaction
	 */
	async verifyDeposit(request: DepositVerificationRequest): Promise<DepositVerificationResult> {
		try {
			// Check if transaction hash already exists
			const existingDeposit = await Deposit.findOne({ txHash: request.txHash });
			if (existingDeposit) {
				return {
					success: false,
					message: '❌ This transaction hash has already been used.',
					error: 'Duplicate transaction hash'
				};
			}

			// Get user
			const user = await User.findOne({ chatId: request.chatId });
			if (!user) {
				return {
					success: false,
					message: '❌ User not found. Please use /start to register.',
					error: 'User not found'
				};
			}

			// For now, we'll simulate transaction verification
			// In production, you would verify the transaction on-chain
			const isValidTransaction = await this.simulateTransactionVerification(
				request.txHash,
				request.walletAddress,
				this.AI_WALLET_ADDRESS
			);

			if (!isValidTransaction.success) {
				return {
					success: false,
					message: isValidTransaction.message,
					error: isValidTransaction.error
				};
			}

			// Create deposit record
			const deposit = new Deposit({
				userId: user._id,
				txHash: request.txHash,
				amount: isValidTransaction.amount,
				confirmed: true,
				walletAddress: request.walletAddress,
			});

			await deposit.save();

			// Update user balance
			user.balance += isValidTransaction.amount!;
			await user.save();

			return {
				success: true,
				message: `✅ Deposit confirmed! Added $${isValidTransaction.amount} USDC to your balance.`,
				deposit: deposit
			};

		} catch (error) {
			console.error('Error verifying deposit:', error);
			return {
				success: false,
				message: '❌ Error processing deposit. Please try again.',
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Simulate transaction verification (replace with real on-chain verification)
	 */
	private async simulateTransactionVerification(
		txHash: string,
		fromAddress: string,
		toAddress: string
	): Promise<{ success: boolean; amount?: number; message: string; error?: string }> {
		// Simulate basic validation
		if (txHash.length < 10) {
			return {
				success: false,
				message: '❌ Invalid transaction hash format.',
				error: 'Invalid tx hash format'
			};
		}

		// Simulate checking if transaction exists and is valid
		// In production, you would:
		// 1. Query the blockchain for the transaction
		// 2. Verify sender address matches walletAddress
		// 3. Verify receiver address matches AI_WALLET_ADDRESS
		// 4. Verify token type is USDC
		// 5. Get the actual transfer amount
		
		// For demo purposes, simulate a successful transaction
		const randomAmount = Math.floor(Math.random() * 500) + this.MIN_DEPOSIT_AMOUNT;
		
		return {
			success: true,
			amount: randomAmount,
			message: 'Transaction verified successfully'
		};
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
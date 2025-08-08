import { Client, AccountId, TransactionId } from '@hashgraph/sdk';
import axios from 'axios';

export interface HederaTransactionVerification {
	isValid: boolean;
	amount?: number;
	tokenId?: string;
	sender?: string;
	receiver?: string;
	timestamp?: string;
	error?: string;
}

export interface MirrorNodeTransaction {
	transactions: Array<{
		transaction_id: string;
		valid_start_timestamp: string;
		result: string;
		payer_account_id: string;
		transfers?: Array<{
			account: string;
			amount: number;
			token_id?: string;
		}>;
		token_transfers?: Array<{
			token_id: string;
			account: string;
			amount: number;
		}>;
	}>;
}

class HederaVerificationService {
	private readonly HEDERA_TESTNET_MIRROR_URL = 'https://testnet.mirrornode.hedera.com/api/v1';
	private readonly HEDERA_MAINNET_MIRROR_URL = 'https://mainnet-public.mirrornode.hedera.com/api/v1';
	private readonly EXPECTED_USDC_TOKEN_ID = process.env.HEDERA_USDC_TOKEN_ID || '0.0.123456'; // Set this to your USDC token ID
	private readonly SHOQ_TREASURY_ACCOUNT = process.env.SHOQ_TREASURY_ACCOUNT || '0.0.654321'; // Your treasury account
	private readonly NETWORK = process.env.HEDERA_NETWORK || 'testnet'; // 'testnet' or 'mainnet'
	
	private get mirrorNodeUrl(): string {
		return this.NETWORK === 'mainnet' 
			? this.HEDERA_MAINNET_MIRROR_URL 
			: this.HEDERA_TESTNET_MIRROR_URL;
	}

	/**
	 * Verify a Hedera transaction for USDC deposit
	 */
	async verifyTransaction(transactionId: string): Promise<HederaTransactionVerification> {
		try {
			// Validate transaction ID format
			if (!this.isValidTransactionId(transactionId)) {
				return {
					isValid: false,
					error: 'Invalid transaction ID format'
				};
			}

			// Query Hedera Mirror Node
			const transaction = await this.fetchTransactionFromMirror(transactionId);
			
			if (!transaction) {
				return {
					isValid: false,
					error: 'Transaction not found on Hedera network'
				};
			}

			// Verify transaction success
			if (transaction.result !== 'SUCCESS') {
				return {
					isValid: false,
					error: `Transaction failed with result: ${transaction.result}`
				};
			}

			// Extract and verify token transfer details
			const tokenTransfer = this.extractUSDCTransfer(transaction);
			
			if (!tokenTransfer) {
				return {
					isValid: false,
					error: 'No USDC token transfer found in transaction'
				};
			}

			// Verify the transfer is to our treasury account
			if (!this.isTransferToTreasury(tokenTransfer)) {
				return {
					isValid: false,
					error: 'Transfer is not to Shoq treasury account'
				};
			}

			// Calculate actual USDC amount (considering 6 decimals)
			const usdcAmount = Math.abs(tokenTransfer.amount) / Math.pow(10, 6);

			// Minimum deposit validation
			if (usdcAmount < 1) { // Minimum 1 USDC
				return {
					isValid: false,
					error: `Deposit amount too small. Minimum: 1 USDC, received: ${usdcAmount} USDC`
				};
			}

			return {
				isValid: true,
				amount: usdcAmount,
				tokenId: tokenTransfer.token_id,
				sender: this.findSender(transaction),
				receiver: this.SHOQ_TREASURY_ACCOUNT,
				timestamp: transaction.valid_start_timestamp
			};

		} catch (error) {
			console.error('Error verifying Hedera transaction:', error);
			return {
				isValid: false,
				error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}

	/**
	 * Validate Hedera transaction ID format
	 */
	private isValidTransactionId(transactionId: string): boolean {
		// Hedera transaction ID format: 0.0.XXXXX-SSSSSSSSSS-NNNNNNNNN
		// or 0.0.XXXXX@SSSSSSSSSS.NNNNNNNNN
		const hederaIdPattern = /^0\.0\.\d+[-@]\d+\.\d+$/;
		return hederaIdPattern.test(transactionId);
	}

	/**
	 * Fetch transaction details from Hedera Mirror Node
	 */
	private async fetchTransactionFromMirror(transactionId: string): Promise<any | null> {
		try {
			// Convert transaction ID format for Mirror Node API
			// Input: "0.0.5789379@1754584444.553560679"
			// Output: "0.0.5789379-1754584444-553560679"
			let normalizedTxId = transactionId;
			if (transactionId.includes('@')) {
				const parts = transactionId.split('@');
				const accountPart = parts[0];
				const timestampPart = parts[1];
				if (timestampPart.includes('.')) {
					const timestampParts = timestampPart.split('.');
					normalizedTxId = `${accountPart}-${timestampParts[0]}-${timestampParts[1]}`;
				}
			}
			
			console.log(`🔍 Fetching transaction from Mirror Node: ${normalizedTxId}`);
			
			const response = await axios.get(
				`${this.mirrorNodeUrl}/transactions/${normalizedTxId}`,
				{
					timeout: 10000,
					headers: {
						'Accept': 'application/json'
					}
				}
			);

			if (response.data && response.data.transactions && response.data.transactions.length > 0) {
				return response.data.transactions[0];
			}

			return null;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 404) {
					throw new Error('Transaction not found');
				}
				throw new Error(`Mirror node request failed: ${error.response?.statusText || error.message}`);
			}
			throw error;
		}
	}

	/**
	 * Extract USDC token transfer from transaction
	 */
	private extractUSDCTransfer(transaction: any): any | null {
		if (!transaction.token_transfers || !Array.isArray(transaction.token_transfers)) {
			return null;
		}

		// Find USDC token transfers
		const usdcTransfers = transaction.token_transfers.filter((transfer: any) => 
			transfer.token_id === this.EXPECTED_USDC_TOKEN_ID
		);

		if (usdcTransfers.length === 0) {
			return null;
		}

		// Find the positive transfer (receiver)
		const positiveTransfer = usdcTransfers.find((transfer: any) => 
			transfer.amount > 0 && transfer.account === this.SHOQ_TREASURY_ACCOUNT
		);

		return positiveTransfer || usdcTransfers[0];
	}

	/**
	 * Check if transfer is to our treasury account
	 */
	private isTransferToTreasury(transfer: any): boolean {
		return transfer.account === this.SHOQ_TREASURY_ACCOUNT && transfer.amount > 0;
	}

	/**
	 * Find the sender account from transaction
	 */
	private findSender(transaction: any): string | undefined {
		// The payer account is typically the sender
		if (transaction.payer_account_id) {
			return transaction.payer_account_id;
		}

		// Look for negative token transfer (sender)
		if (transaction.token_transfers) {
			const negativeTransfer = transaction.token_transfers.find((transfer: any) =>
				transfer.token_id === this.EXPECTED_USDC_TOKEN_ID && transfer.amount < 0
			);
			
			if (negativeTransfer) {
				return negativeTransfer.account;
			}
		}

		return undefined;
	}

	/**
	 * Get transaction status from Hedera Mirror Node
	 */
	async getTransactionStatus(transactionId: string): Promise<{
		exists: boolean;
		status?: string;
		timestamp?: string;
		error?: string;
	}> {
		try {
			const transaction = await this.fetchTransactionFromMirror(transactionId);
			
			if (!transaction) {
				return {
					exists: false,
					error: 'Transaction not found'
				};
			}

			return {
				exists: true,
				status: transaction.result,
				timestamp: transaction.valid_start_timestamp
			};
		} catch (error) {
			return {
				exists: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Validate account ID format
	 */
	isValidAccountId(accountId: string): boolean {
		// Hedera account ID format: 0.0.XXXXX
		const accountPattern = /^0\.0\.\d+$/;
		return accountPattern.test(accountId);
	}

	/**
	 * Get account balance from Mirror Node
	 */
	async getAccountBalance(accountId: string): Promise<{
		success: boolean;
		balance?: number;
		tokenBalances?: Record<string, number>;
		error?: string;
	}> {
		try {
			if (!this.isValidAccountId(accountId)) {
				return {
					success: false,
					error: 'Invalid account ID format'
				};
			}

			const response = await axios.get(
				`${this.mirrorNodeUrl}/accounts/${accountId}`,
				{ timeout: 10000 }
			);

			const account = response.data;
			const tokenBalances: Record<string, number> = {};

			// Extract token balances
			if (account.balance && account.balance.tokens) {
				for (const token of account.balance.tokens) {
					tokenBalances[token.token_id] = token.balance;
				}
			}

			return {
				success: true,
				balance: account.balance?.balance || 0,
				tokenBalances
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Check if transaction is recent (within last 24 hours)
	 */
	isTransactionRecent(timestamp: string): boolean {
		try {
			// Hedera timestamps are in seconds with nanosecond precision
			const timestampSeconds = parseFloat(timestamp);
			const transactionDate = new Date(timestampSeconds * 1000);
			const now = new Date();
			const hoursDiff = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);
			
			return hoursDiff <= 24; // Allow transactions up to 24 hours old
		} catch (error) {
			return false;
		}
	}

	/**
	 * Format amount for display
	 */
	formatAmount(amount: number, decimals: number = 6): string {
		return (amount / Math.pow(10, decimals)).toFixed(decimals);
	}

	/**
	 * Get network status
	 */
	getNetworkInfo(): {
		network: string;
		mirrorNodeUrl: string;
		expectedTokenId: string;
		treasuryAccount: string;
	} {
		return {
			network: this.NETWORK,
			mirrorNodeUrl: this.mirrorNodeUrl,
			expectedTokenId: this.EXPECTED_USDC_TOKEN_ID,
			treasuryAccount: this.SHOQ_TREASURY_ACCOUNT
		};
	}
}

export const hederaVerificationService = new HederaVerificationService();
export default hederaVerificationService;
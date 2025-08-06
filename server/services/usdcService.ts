import {
	Client,
	AccountId,
	PrivateKey,
	TokenId,
	TransferTransaction,
	AccountBalanceQuery,
	Status,
	TransactionReceiptQuery,
	TransactionResponse,
} from '@hashgraph/sdk';

export interface TransferRequest {
	fromAccountId: string;
	toAccountId: string;
	amount: number;
	tokenId?: string; // Optional, defaults to USDC testnet token
	memo?: string;
}

export interface TransferResult {
	success: boolean;
	transactionId?: string;
	receipt?: any;
	error?: string;
}

export interface AccountBalance {
	accountId: string;
	balance: number;
	tokenId: string;
}

class USDCService {
	private client: Client | null = null;
	private readonly defaultUSDCTokenId = '0.0.1234567'; // Replace with actual USDC testnet token ID or use createMockUSDC to create one

	/**
	 * Initialize the Hedera client
	 */
	private async initializeClient(): Promise<Client> {
		if (this.client) {
			return this.client;
		}

		if (!process.env.OPERATOR_ADDRESS || !process.env.OPERATOR_KEY) {
			throw new Error(
				'OPERATOR_ADDRESS and OPERATOR_KEY must be set in environment variables'
			);
		}

		// Create client for testnet (change to mainnet for production)
		this.client = Client.forTestnet();

		const accountId = await AccountId.fromEvmAddress(
			0,
			0,
			process.env.OPERATOR_ADDRESS
		).populateAccountNum(this.client);
		const privateKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

		this.client.setOperator(accountId, privateKey);

		return this.client;
	}

	/**
	 * Transfer USDC tokens from one account to another
	 */
	async transferTokens(request: TransferRequest): Promise<TransferResult> {
		try {
			const client = await this.initializeClient();

			const fromAccount = AccountId.fromString(request.fromAccountId);
			const toAccount = AccountId.fromString(request.toAccountId);
			const tokenId = TokenId.fromString(
				request.tokenId || this.defaultUSDCTokenId
			);

			// Create transfer transaction
			const transferTx = new TransferTransaction()
				.addTokenTransfer(tokenId, fromAccount, -request.amount)
				.addTokenTransfer(tokenId, toAccount, request.amount)
				.setTransactionMemo(request.memo || 'USDC Transfer')
				.freezeWith(client);

			// Sign the transaction with the sender's private key
			// Note: In a real application, you'd need the sender's private key
			// For now, we'll use the operator key (you'll need to modify this)
			const signedTx = await transferTx.sign(
				PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY!)
			);

			// Submit the transaction
			const response: TransactionResponse = await signedTx.execute(client);

			// Get the receipt
			const receipt = await new TransactionReceiptQuery()
				.setTransactionId(response.transactionId)
				.execute(client);

			if (receipt.status === Status.Success) {
				return {
					success: true,
					transactionId: response.transactionId.toString(),
					receipt: receipt,
				};
			} else {
				return {
					success: false,
					error: `Transaction failed with status: ${receipt.status}`,
				};
			}
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Unknown error occurred',
			};
		}
	}

	/**
	 * Get USDC balance for a specific account
	 */
	async getBalance(
		accountId: string,
		tokenId?: string
	): Promise<AccountBalance | null> {
		try {
			const client = await this.initializeClient();
			const account = AccountId.fromString(accountId);
			const token = TokenId.fromString(tokenId || this.defaultUSDCTokenId);

			const balanceQuery = new AccountBalanceQuery().setAccountId(account);

			const balance = await balanceQuery.execute(client);

			// Find the specific token balance
			const tokenBalance = balance.tokens?.get(token.toString());

			if (tokenBalance) {
				return {
					accountId: accountId,
					balance: Number(tokenBalance.balance),
					tokenId: tokenId || this.defaultUSDCTokenId,
				};
			}

			return {
				accountId: accountId,
				balance: 0,
				tokenId: tokenId || this.defaultUSDCTokenId,
			};
		} catch (error) {
			console.error('Error getting balance:', error);
			return null;
		}
	}

	/**
	 * Get multiple account balances
	 */
	async getMultipleBalances(
		accountIds: string[],
		tokenId?: string
	): Promise<AccountBalance[]> {
		const balances: AccountBalance[] = [];

		for (const accountId of accountIds) {
			const balance = await this.getBalance(accountId, tokenId);
			if (balance) {
				balances.push(balance);
			}
		}

		return balances;
	}

	/**
	 * Validate if an account has sufficient USDC balance
	 */
	async hasSufficientBalance(
		accountId: string,
		requiredAmount: number,
		tokenId?: string
	): Promise<boolean> {
		const balance = await this.getBalance(accountId, tokenId);
		return balance ? balance.balance >= requiredAmount : false;
	}

	/**
	 * Get transaction details by transaction ID
	 */
	async getTransactionDetails(transactionId: string): Promise<any> {
		try {
			const client = await this.initializeClient();

			const receipt = await new TransactionReceiptQuery()
				.setTransactionId(transactionId)
				.execute(client);

			return receipt;
		} catch (error) {
			throw new Error(
				`Failed to get transaction details: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
}

// Export singleton instance
export const usdcService = new USDCService();
export default usdcService;

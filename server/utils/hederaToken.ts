import {
	TokenCreateTransaction,
	Client,
	TokenId,
	TransferTransaction,
	AccountId,
	PrivateKey,
	TokenType,
	TokenSupplyType,
	Hbar,
} from '@hashgraph/sdk';

/**
 * Creates a mock USDC token using the provided Hedera client.
 *
 * @param {Client} client - The Hedera Client instance used to execute the transaction.
 * @returns {Promise<TokenId>} The newly created Token
 */
const createMockUSDC = async (client: Client): Promise<TokenId> => {
	const tokenCreateTx = new TokenCreateTransaction()
		.setTokenName('Mock USDC')
		.setTokenSymbol('USDC')
		.setTreasuryAccountId(client.operatorAccountId!)
		.setInitialSupply(1000000) // 1 million tokens
		.setDecimals(6) // USDC has 6 decimals
		.setTokenType(TokenType.FungibleCommon)
		.setSupplyType(TokenSupplyType.Infinite)
		.setMaxTransactionFee(new Hbar(30));

	const executeTx = await tokenCreateTx.execute(client);
	const txReceipt = await executeTx.getReceipt(client);
	return txReceipt.tokenId!;
};

/**
 * Transfers tokens from one account to another
 *
 * @param {Client} client - The Hedera Client instance used to execute the transaction
 * @param {TokenId} tokenId - The ID of the token to transfer
 * @param {AccountId} fromAccountId - The account ID to transfer tokens from
 * @param {AccountId} toAccountId - The account ID to transfer tokens to
 * @param {number} amount - The amount of tokens to transfer
 * @returns {Promise<void>}
 */
const transferTokens = async (
	client: Client,
	tokenId: TokenId,
	fromAccountId: AccountId,
	toAccountId: AccountId,
	amount: number
): Promise<void> => {
	const transferTx = new TransferTransaction()
		.addTokenTransfer(tokenId, fromAccountId, -amount)
		.addTokenTransfer(tokenId, toAccountId, amount);

	const executeTx = await transferTx.execute(client);
	await executeTx.getReceipt(client);
};

/**
 * Creates a custom token with specified parameters
 *
 * @param {Client} client - The Hedera Client instance
 * @param {string} name - Token name
 * @param {string} symbol - Token symbol
 * @param {number} initialSupply - Initial token supply
 * @param {number} decimals - Number of decimal places
 * @param {string} memo - Optional memo for the transaction
 * @returns {Promise<TokenId>} The newly created Token ID
 */
const createCustomToken = async (
	client: Client,
	name: string,
	symbol: string,
	initialSupply: number,
	decimals: number = 0,
	memo?: string
): Promise<TokenId> => {
	const tokenCreateTx = new TokenCreateTransaction()
		.setTokenName(name)
		.setTokenSymbol(symbol)
		.setTreasuryAccountId(client.operatorAccountId!)
		.setInitialSupply(initialSupply)
		.setDecimals(decimals)
		.setTokenType(TokenType.FungibleCommon)
		.setSupplyType(TokenSupplyType.Infinite)
		.setMaxTransactionFee(new Hbar(30));

	if (memo) {
		tokenCreateTx.setTransactionMemo(memo);
	}

	const executeTx = await tokenCreateTx.execute(client);
	const txReceipt = await executeTx.getReceipt(client);
	return txReceipt.tokenId!;
};

/**
 * Creates a non-fungible token (NFT)
 *
 * @param {Client} client - The Hedera Client instance
 * @param {string} name - Token name
 * @param {string} symbol - Token symbol
 * @param {string} memo - Optional memo for the transaction
 * @returns {Promise<TokenId>} The newly created NFT Token ID
 */
const createNFT = async (
	client: Client,
	name: string,
	symbol: string,
	memo?: string
): Promise<TokenId> => {
	const tokenCreateTx = new TokenCreateTransaction()
		.setTokenName(name)
		.setTokenSymbol(symbol)
		.setTreasuryAccountId(client.operatorAccountId!)
		.setTokenType(TokenType.NonFungibleUnique)
		.setSupplyType(TokenSupplyType.Infinite)
		.setMaxTransactionFee(new Hbar(30));

	if (memo) {
		tokenCreateTx.setTransactionMemo(memo);
	}

	const executeTx = await tokenCreateTx.execute(client);
	const txReceipt = await executeTx.getReceipt(client);
	return txReceipt.tokenId!;
};

/**
 * Associates a token with an account
 *
 * @param {Client} client - The Hedera Client instance
 * @param {TokenId} tokenId - The token ID to associate
 * @param {AccountId} accountId - The account ID to associate with
 * @returns {Promise<void>}
 */
const associateToken = async (
	client: Client,
	tokenId: TokenId,
	accountId: AccountId
): Promise<void> => {
	const { TokenAssociateTransaction } = await import('@hashgraph/sdk');

	const associateTx = new TokenAssociateTransaction()
		.setAccountId(accountId)
		.setTokenIds([tokenId]);

	const executeTx = await associateTx.execute(client);
	await executeTx.getReceipt(client);
};

/**
 * Dissociates a token from an account
 *
 * @param {Client} client - The Hedera Client instance
 * @param {TokenId} tokenId - The token ID to dissociate
 * @param {AccountId} accountId - The account ID to dissociate from
 * @returns {Promise<void>}
 */
const dissociateToken = async (
	client: Client,
	tokenId: TokenId,
	accountId: AccountId
): Promise<void> => {
	const { TokenDissociateTransaction } = await import('@hashgraph/sdk');

	const dissociateTx = new TokenDissociateTransaction()
		.setAccountId(accountId)
		.setTokenIds([tokenId]);

	const executeTx = await dissociateTx.execute(client);
	await executeTx.getReceipt(client);
};

export {
	createMockUSDC,
	transferTokens,
	createCustomToken,
	createNFT,
	associateToken,
	dissociateToken,
};

import {
	AccountId,
	PrivateKey,
	Client,
	TokenCreateTransaction,
	TokenType,
} from '@hashgraph/sdk';
import dotenv from 'dotenv';

dotenv.config();

async function demonstrateTokenCreation() {
	console.log('🚀 Token Creation Demonstration\n');
	let client;

	try {
		// Use environment variables for account credentials
		if (!process.env.OPERATOR_ADDRESS || !process.env.OPERATOR_KEY) {
			throw new Error('Set OPERATOR_ADDRESS and OPERATOR_KEY in .env');
		}

		// Pre-configured client for test network (testnet)
		client = Client.forTestnet();

		// Convert from EVM address to Hedera account ID and set operator
		const accountId = AccountId.fromString(process.env.OPERATOR_ADDRESS);
		const privateKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
		client.setOperator(accountId, privateKey);

		console.log('🔧 Using account:', accountId.toString());

		// Create USDC Token (exactly like working new.ts)
		console.log('Creating USDC Token...');
		const txTokenCreate = await new TokenCreateTransaction()
			.setTokenName('USD Coin')
			.setTokenSymbol('USDC')
			.setTokenType(TokenType.FungibleCommon)
			.setDecimals(6)
			.setTreasuryAccountId(accountId)
			.setInitialSupply(1000000) // 1M USDC
			.setSupplyKey(privateKey.publicKey)
			.setAdminKey(privateKey.publicKey)
			.freezeWith(client);

		console.log('Signing the transaction...');
		const signTxTokenCreate = await txTokenCreate.sign(privateKey);
		const txTokenCreateResponse = await signTxTokenCreate.execute(client);
		const receiptTokenCreateTx = await txTokenCreateResponse.getReceipt(client);

		const tokenId = receiptTokenCreateTx.tokenId;
		const statusTokenCreateTx = receiptTokenCreateTx.status;
		const txTokenCreateId = txTokenCreateResponse.transactionId.toString();

		console.log(
			'--------------------------------- USDC Token Creation ---------------------------------'
		);
		console.log('Receipt status           :', statusTokenCreateTx.toString());
		console.log('Transaction ID           :', txTokenCreateId);
		console.log(
			'Hashscan URL             :',
			'https://hashscan.io/testnet/transaction/' + txTokenCreateId
		);
		console.log('USDC Token ID            :', tokenId?.toString());

		// Create NFT Collection
		console.log('\nCreating NFT Collection...');
		const nftTxCreate = await new TokenCreateTransaction()
			.setTokenName('Shoq NFT Collection')
			.setTokenSymbol('SHOQ')
			.setTokenType(TokenType.NonFungibleUnique)
			.setTreasuryAccountId(accountId)
			.setInitialSupply(0) // NFTs start with 0 supply
			.setSupplyKey(privateKey.publicKey)
			.setAdminKey(privateKey.publicKey)
			.freezeWith(client);

		const signNftTx = await nftTxCreate.sign(privateKey);
		const nftTxResponse = await signNftTx.execute(client);
		const nftReceipt = await nftTxResponse.getReceipt(client);

		const nftTokenId = nftReceipt.tokenId;
		const nftStatus = nftReceipt.status;
		const nftTxId = nftTxResponse.transactionId.toString();

		console.log(
			'--------------------------------- NFT Collection Creation ---------------------------------'
		);
		console.log('Receipt status           :', nftStatus.toString());
		console.log('Transaction ID           :', nftTxId);
		console.log(
			'Hashscan URL             :',
			'https://hashscan.io/testnet/transaction/' + nftTxId
		);
		console.log('NFT Token ID             :', nftTokenId?.toString());

		// Transfer USDC tokens to the specified address
		const RECIPIENT_ACCOUNT = AccountId.fromString('0.0.6520387');
		const TRANSFER_AMOUNT = 100000; // 100 USDC (with 6 decimals = 100,000,000 micro USDC)

		console.log('\n💸 Transferring USDC to recipient...');
		console.log('Recipient Address:', RECIPIENT_ACCOUNT.toString());
		console.log('Transfer Amount  :', TRANSFER_AMOUNT / 1000000, 'USDC');

		// Note: Token association requires the recipient's signature
		// For this demo, we'll skip association and try direct transfer
		// In production, the recipient should associate the token first
		console.log(
			'\n📝 Note: Recipient must associate token before receiving transfers'
		);
		console.log(
			'   In production: recipient calls TokenAssociateTransaction themselves'
		);
		console.log(
			'   For demo: attempting transfer (may fail if not associated)...'
		);
	} catch (error) {
		console.error('❌ Error:', error);
	}
}

demonstrateTokenCreation();

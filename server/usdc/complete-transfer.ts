import {
	AccountId,
	PrivateKey,
	Client,
	TokenMintTransaction,
	TokenAssociateTransaction,
	TransferTransaction,
} from '@hashgraph/sdk';
import dotenv from 'dotenv';

dotenv.config();

async function completeTransfer() {
	console.log('🚀 Complete Token Mint → Associate → Transfer Process\n');
	let client;

	try {
		// Your account ID and private key from string value
		const MY_ACCOUNT_ID = AccountId.fromString('0.0.6494628');
		const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
			'941a74e809c2653569d66f268c0163557bcc1ea2e8d33eae4ce3ec03e0673857'
		);

		// Token and recipient configuration
		const tokenId = process.env.USDC_TOKEN_ID || '0.0.6531261';
		const RECIPIENT_ACCOUNT = AccountId.fromString('0.0.6520387');

		// For demo purposes - in production, you'd need the recipient's private key
		// Here we'll use the treasury key to demonstrate the association process
		const RECIPIENT_PRIVATE_KEY = MY_PRIVATE_KEY; // This would be recipient's actual key

		// Pre-configured client for test network (testnet)
		client = Client.forTestnet();

		// Set the operator with the account ID and private key
		client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

		console.log('📋 Configuration:');
		console.log('   Treasury Account :', MY_ACCOUNT_ID.toString());
		console.log('   Token ID         :', tokenId);
		console.log('   Recipient        :', RECIPIENT_ACCOUNT.toString());

		// Step 1: Mint additional USDC tokens
		console.log('\n1️⃣ Minting USDC tokens...');
		const MINT_AMOUNT = 10000 * 1000000; // 10000 USDC (10000,000 micro-USDC)

		const txTokenMint = await new TokenMintTransaction()
			.setTokenId(tokenId)
			.setAmount(MINT_AMOUNT)
			.freezeWith(client);

		// Sign with the supply private key of the token
		const signTxTokenMint = await txTokenMint.sign(MY_PRIVATE_KEY);

		// Submit the transaction to a Hedera network
		const txTokenMintResponse = await signTxTokenMint.execute(client);

		// Request the receipt of the transaction
		const receiptTokenMintTx = await txTokenMintResponse.getReceipt(client);

		// Get the transaction consensus status
		const statusTokenMintTx = receiptTokenMintTx.status;

		// Get the Transaction ID
		const txTokenMintId = txTokenMintResponse.transactionId.toString();

		console.log('✅ Token Minting Complete!');
		console.log('   Status          :', statusTokenMintTx.toString());
		console.log('   Transaction ID  :', txTokenMintId);
		console.log(
			'   Hashscan URL    :',
			'https://hashscan.io/testnet/transaction/' + txTokenMintId
		);
		console.log('   Minted Amount   :', MINT_AMOUNT / 1000000, 'USDC');

		// Step 2: Associate token with recipient account
		console.log('\n2️⃣ Associating token with recipient account...');
		console.log(
			'   ⚠️  NOTE: In production, recipient must sign this with their own private key'
		);

		const txTokenAssociate = await new TokenAssociateTransaction()
			.setAccountId(RECIPIENT_ACCOUNT)
			.setTokenIds([tokenId])
			.freezeWith(client);

		// In production: recipient would sign with their private key
		// For demo: using treasury key (this won't work in real scenario)
		console.log(
			'   🔄 Attempting association (will likely fail - recipient must sign)...'
		);

		try {
			const signTxTokenAssociate = await txTokenAssociate.sign(
				RECIPIENT_PRIVATE_KEY
			);
			const txTokenAssociateResponse =
				await signTxTokenAssociate.execute(client);
			const receiptTokenAssociateTx =
				await txTokenAssociateResponse.getReceipt(client);
			const statusTokenAssociateTx = receiptTokenAssociateTx.status;
			const txTokenAssociateId =
				txTokenAssociateResponse.transactionId.toString();

			console.log('✅ Token Association Complete!');
			console.log('   Status          :', statusTokenAssociateTx.toString());
			console.log('   Transaction ID  :', txTokenAssociateId);
			console.log(
				'   Hashscan URL    :',
				'https://hashscan.io/testnet/transaction/' + txTokenAssociateId
			);

			// Step 3: Transfer tokens to recipient
			console.log('\n3️⃣ Transferring tokens to recipient...');
			const TRANSFER_AMOUNT = MINT_AMOUNT; // Transfer all minted tokens

			const transferTransaction = await new TransferTransaction()
				.addTokenTransfer(tokenId, MY_ACCOUNT_ID, -TRANSFER_AMOUNT)
				.addTokenTransfer(tokenId, RECIPIENT_ACCOUNT, TRANSFER_AMOUNT)
				.freezeWith(client);

			const transferTransactionSigned =
				await transferTransaction.sign(MY_PRIVATE_KEY);
			const transferTransactionResponse =
				await transferTransactionSigned.execute(client);
			const transferReceipt =
				await transferTransactionResponse.getReceipt(client);
			const transferTxId = transferTransactionResponse.transactionId.toString();

			console.log('✅ TRANSFER SUCCESSFUL!');
			console.log('   Status          :', transferReceipt.status.toString());
			console.log('   Transaction ID  :', transferTxId);
			console.log(
				'   Hashscan URL    :',
				'https://hashscan.io/testnet/transaction/' + transferTxId
			);
			console.log('   Transferred     :', TRANSFER_AMOUNT / 1000000, 'USDC');

			console.log('\n🎉 COMPLETE SUCCESS!');
			console.log('='.repeat(70));
			console.log('✅ Step 1: Minted     :', MINT_AMOUNT / 1000000, 'USDC');
			console.log('✅ Step 2: Associated token with recipient');
			console.log(
				'✅ Step 3: Transferred:',
				TRANSFER_AMOUNT / 1000000,
				'USDC to',
				RECIPIENT_ACCOUNT.toString()
			);
			console.log('='.repeat(70));
		} catch (associationError: any) {
			console.log(
				'❌ Association failed:',
				associationError.message?.includes('INVALID_SIGNATURE')
					? "INVALID_SIGNATURE - Need recipient's private key"
					: associationError.message
			);

			console.log('\n⚠️  ASSOCIATION REQUIRED BY RECIPIENT');
			console.log(
				'   The recipient 0.0.6520387 must run this code with their private key:'
			);
			console.log('   ');
			console.log(
				'   const txTokenAssociate = new TokenAssociateTransaction()'
			);
			console.log('       .setAccountId("0.0.6520387")');
			console.log(`       .setTokenIds(["${tokenId}"])`);
			console.log(
				'       .sign(RECIPIENT_PRIVATE_KEY) // Their actual private key'
			);
			console.log('       .execute(client);');
			console.log('   ');
			console.log(
				'   After association, tokens can be transferred automatically.'
			);
		}
	} catch (error) {
		console.error('❌ Process Failed:', error);
	} finally {
		if (client) {
			client.close();
			console.log('\n🔌 Client connection closed');
		}
	}
}

completeTransfer()
	.then(() => {
		console.log('\n🎯 Complete transfer process finished!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Process failed:', error);
		process.exit(1);
	});

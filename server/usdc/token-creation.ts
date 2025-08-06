import {
	createMockUSDC,
	createCustomToken,
	createNFT,
	associateToken,
} from '../utils/hederaToken.js';
import dotenv from 'dotenv';

dotenv.config();

async function demonstrateTokenCreation() {
	console.log('🚀 Token Creation Demonstration\n');

	try {
		// Initialize Hedera client
		if (!process.env.OPERATOR_ADDRESS || !process.env.OPERATOR_KEY) {
			throw new Error(
				'OPERATOR_ADDRESS and OPERATOR_KEY must be set in environment variables'
			);
		}

		const { Client, AccountId, PrivateKey } = await import('@hashgraph/sdk');

		const client = Client.forTestnet();
		const accountId = await AccountId.fromEvmAddress(
			0,
			0,
			process.env.OPERATOR_ADDRESS
		).populateAccountNum(client);
		const privateKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

		client.setOperator(accountId, privateKey);

		console.log('1. Creating Mock USDC Token...');
		const usdcTokenId = await createMockUSDC(client);
		console.log('✅ Mock USDC Token created:', usdcTokenId.toString());

		console.log('\n2. Creating Custom Token...');
		const customTokenId = await createCustomToken(
			client,
			'USDC',
			'USDC',
			1000000,
			6,
			'USDC token for demonstration'
		);
		console.log('✅ Custom Token created:', customTokenId.toString());

		console.log('\n3. Creating NFT Token...');
		const nftTokenId = await createNFT(
			client,
			'My NFT Collection',
			'MNFT',
			'NFT collection for demonstration'
		);
		console.log('✅ NFT Token created:', nftTokenId.toString());

		console.log('\n4. Creating another account for association...');
		// Create a new account for demonstration
		const { AccountCreateTransaction, Hbar } = await import('@hashgraph/sdk');

		const newAccountTx = new AccountCreateTransaction()
			.setInitialBalance(new Hbar(1))
			.setMaxAutomaticTokenAssociations(10);

		const newAccountResponse = await newAccountTx.execute(client);
		const newAccountReceipt = await newAccountResponse.getReceipt(client);
		const newAccountId = newAccountReceipt.accountId!;

		console.log('✅ New account created:', newAccountId.toString());

		console.log('\n5. Associating tokens with new account...');
		await associateToken(client, usdcTokenId, newAccountId);
		console.log('✅ USDC token associated with new account');

		await associateToken(client, customTokenId, newAccountId);
		console.log('✅ Custom token associated with new account');

		await associateToken(client, nftTokenId, newAccountId);
		console.log('✅ NFT token associated with new account');

		console.log('\n📋 Summary of Created Tokens:');
		console.log('┌─────────────────┬─────────────────────┬─────────────────┐');
		console.log('│ Token Type      │ Token ID            │ Symbol          │');
		console.log('├─────────────────┼─────────────────────┼─────────────────┤');
		console.log(
			`│ Mock USDC       │ ${usdcTokenId.toString().padEnd(19)} │ USDC             │`
		);
		console.log(
			`│ Custom Token    │ ${customTokenId.toString().padEnd(19)} │ MCT              │`
		);
		console.log(
			`│ NFT Token       │ ${nftTokenId.toString().padEnd(19)} │ MNFT             │`
		);
		console.log('└─────────────────┴─────────────────────┴─────────────────┘');

		console.log('\n🎉 Token creation demonstration completed successfully!');
		console.log('\n💡 Next steps:');
		console.log('   - Use these token IDs in your USDC service');
		console.log('   - Transfer tokens between accounts');
		console.log('   - Mint additional tokens if needed');
	} catch (error) {
		console.error('❌ Error during token creation demonstration:', error);
	}
}

// Run the demonstration
demonstrateTokenCreation()
	.then(() => {
		console.log('\n🎉 Demonstration completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Demonstration failed:', error);
		process.exit(1);
	});

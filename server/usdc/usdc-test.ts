import { usdcService } from '../services/usdcService.js';
import dotenv from 'dotenv';

dotenv.config();

async function demonstrateUSDCService() {
	console.log('🚀 USDC Service Demonstration\n');

	try {
		// Example account IDs (replace with real ones)
		const senderAccountId = '0.0.1234567';
		const receiverAccountId = '0.0.7654321';
		const amount = 100; // USDC amount

		console.log('1. Checking sender balance...');
		const senderBalance = await usdcService.getBalance(senderAccountId);
		console.log('Sender balance:', senderBalance);

		console.log('\n2. Checking receiver balance...');
		const receiverBalance = await usdcService.getBalance(receiverAccountId);
		console.log('Receiver balance:', receiverBalance);

		console.log('\n3. Checking if sender has sufficient balance...');
		const hasSufficient = await usdcService.hasSufficientBalance(
			senderAccountId,
			amount
		);
		console.log('Has sufficient balance:', hasSufficient);

		if (hasSufficient) {
			console.log('\n4. Transferring USDC...');
			const transferResult = await usdcService.transferTokens({
				fromAccountId: senderAccountId,
				toAccountId: receiverAccountId,
				amount: amount,
				memo: 'Example transfer from USDC service',
			});

			if (transferResult.success) {
				console.log('✅ Transfer successful!');
				console.log('Transaction ID:', transferResult.transactionId);

				console.log('\n5. Getting transaction details...');
				const transactionDetails = await usdcService.getTransactionDetails(
					transferResult.transactionId!
				);
				console.log('Transaction details:', transactionDetails);

				console.log('\n6. Checking updated balances...');
				const newSenderBalance = await usdcService.getBalance(senderAccountId);
				const newReceiverBalance =
					await usdcService.getBalance(receiverAccountId);

				console.log('New sender balance:', newSenderBalance);
				console.log('New receiver balance:', newReceiverBalance);
			} else {
				console.log('❌ Transfer failed:', transferResult.error);
			}
		} else {
			console.log('❌ Insufficient balance for transfer');
		}

		console.log('\n7. Getting multiple account balances...');
		const multipleBalances = await usdcService.getMultipleBalances([
			senderAccountId,
			receiverAccountId,
		]);
		console.log('Multiple balances:', multipleBalances);
	} catch (error) {
		console.error('❌ Error during demonstration:', error);
	}
}

// Run the demonstration
demonstrateUSDCService()
	.then(() => {
		console.log('\n🎉 Demonstration completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Demonstration failed:', error);
		process.exit(1);
	});

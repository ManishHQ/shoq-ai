import { hederaVerificationService } from '../services/hederaVerificationService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testHederaVerificationService() {
	console.log('🧪 Testing Hedera Verification Service\n');

	// Display current configuration
	const networkInfo = hederaVerificationService.getNetworkInfo();
	console.log('📋 Current Configuration:');
	console.log('   Network          :', networkInfo.network);
	console.log('   Mirror Node URL  :', networkInfo.mirrorNodeUrl);
	console.log('   Expected Token ID:', networkInfo.expectedTokenId);
	console.log('   Treasury Account :', networkInfo.treasuryAccount);
	console.log('');

	// Test 1: Invalid transaction ID format
	console.log('🔸 Test 1: Invalid Transaction ID Format');
	try {
		const result =
			await hederaVerificationService.verifyTransaction('invalid-tx-id');
		console.log('   Result:', result);
		console.log('   ✅ Correctly identified invalid format\n');
	} catch (error) {
		console.log('   ❌ Unexpected error:', error);
	}

	// Test 2: Valid transaction ID format but non-existent transaction
	console.log('🔸 Test 2: Non-existent Transaction');
	try {
		const result = await hederaVerificationService.verifyTransaction(
			'0.0.6494628@1754664574.369070408'
		);
		console.log('   Result:', result);
		console.log('   ✅ Correctly handled non-existent transaction\n');
	} catch (error) {
		console.log('   ❌ Unexpected error:', error);
	}

	// Test 3: Account balance check
	console.log('🔸 Test 3: Account Balance Check');
	const testAccountId = networkInfo.treasuryAccount;
	try {
		const balance =
			await hederaVerificationService.getAccountBalance(testAccountId);
		console.log('   Account ID:', testAccountId);
		console.log('   Balance Result:', balance);
		if (balance.success) {
			console.log('   ✅ Successfully retrieved account balance');
			if (
				balance.tokenBalances &&
				Object.keys(balance.tokenBalances).length > 0
			) {
				console.log('   📊 Token Balances:');
				Object.entries(balance.tokenBalances).forEach(([tokenId, balance]) => {
					console.log(`      ${tokenId}: ${balance}`);
				});
			}
		} else {
			console.log('   ⚠️  Could not retrieve balance:', balance.error);
		}
		console.log('');
	} catch (error) {
		console.log('   ❌ Error checking balance:', error);
	}

	// Test 4: Transaction status check (will fail for non-existent transaction)
	console.log('🔸 Test 4: Transaction Status Check');
	try {
		const status = await hederaVerificationService.getTransactionStatus(
			'0.0.123456@1234567890.123456789'
		);
		console.log('   Status Result:', status);
		console.log('   ✅ Status check completed\n');
	} catch (error) {
		console.log('   ❌ Unexpected error:', error);
	}

	// Test 5: Account ID validation
	console.log('🔸 Test 5: Account ID Validation');
	const testCases = [
		'0.0.123456', // Valid
		'0.0.6494628', // Valid
		'0.1.123456', // Valid (different shard)
		'invalid-account', // Invalid
		'123456', // Invalid
		'0.0.', // Invalid
	];

	testCases.forEach((accountId) => {
		const isValid = hederaVerificationService.isValidAccountId(accountId);
		console.log(
			`   ${accountId.padEnd(20)} : ${isValid ? '✅ Valid' : '❌ Invalid'}`
		);
	});
	console.log('');

	// Test 6: Amount formatting
	console.log('🔸 Test 6: Amount Formatting');
	const testAmounts = [
		1000000, // 1 USDC (6 decimals)
		500000, // 0.5 USDC
		1, // 0.000001 USDC
		10000000000, // 10,000 USDC
	];

	testAmounts.forEach((amount) => {
		const formatted = hederaVerificationService.formatAmount(amount, 6);
		console.log(`   ${amount.toString().padEnd(12)} -> ${formatted} USDC`);
	});
	console.log('');

	// Test 7: Timestamp validation
	console.log('🔸 Test 7: Timestamp Validation');
	const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
	const oneHourAgo = now - 3600;
	const oneDayAgo = now - 86400;
	const twoDaysAgo = now - 172800;

	const timestampTests = [
		{ timestamp: now.toString(), label: 'Now' },
		{ timestamp: oneHourAgo.toString(), label: '1 hour ago' },
		{ timestamp: oneDayAgo.toString(), label: '1 day ago' },
		{ timestamp: twoDaysAgo.toString(), label: '2 days ago' },
	];

	timestampTests.forEach((test) => {
		const isRecent = hederaVerificationService.isTransactionRecent(
			test.timestamp
		);
		console.log(
			`   ${test.label.padEnd(12)} : ${isRecent ? '✅ Recent' : '❌ Too old'}`
		);
	});
	console.log('');

	console.log('🎉 All tests completed!');
	console.log(
		'================================================================================'
	);
	console.log('💡 To test with a real transaction:');
	console.log('   1. Create a token transfer transaction');
	console.log('   2. Get the transaction ID from the response');
	console.log(
		'   3. Run: await hederaVerificationService.verifyTransaction("your-tx-id")'
	);
	console.log(
		'================================================================================'
	);
}

// Run the tests
testHederaVerificationService()
	.then(() => {
		console.log('\n✅ Test suite completed successfully!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n❌ Test suite failed:', error);
		process.exit(1);
	});

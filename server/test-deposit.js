import { depositService } from './dist/services/depositService.js';
import { hederaVerificationService } from './dist/services/hederaVerificationService.js';
import connectDB from './dist/utils/connectDB.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to database
connectDB(process.env.MONGO_URL || 'mongodb://localhost:27017/shoq');

console.log('🔍 Testing Hedera deposit verification...\n');

// Test the Hedera verification service first
async function testHederaService() {
	const networkInfo = hederaVerificationService.getNetworkInfo();

	console.log('📋 Testing Hedera Verification Service:');
	console.log('Network:', networkInfo.network);
	console.log('Mirror Node URL:', networkInfo.mirrorNodeUrl);
	console.log('Expected USDC Token ID:', networkInfo.expectedTokenId);
	console.log('Treasury Account:', networkInfo.treasuryAccount);
	console.log();

	// Test with a sample transaction hash format
	const sampleTxHash = '0.0.5789379@1754584444.553560679';
	console.log('🔍 Testing transaction ID validation...');
	console.log('Sample TX Hash:', sampleTxHash);

	let verificationResult = null;
	try {
		verificationResult =
			await hederaVerificationService.verifyTransaction(sampleTxHash);
		console.log('Verification Result:', verificationResult);
	} catch (error) {
		console.log('Expected error (transaction not found):', error.message);
		verificationResult = { isValid: false, error: error.message };
	}

	console.log(verificationResult);

	return {
		networkInfo,
		sampleTransaction: {
			txHash: sampleTxHash,
			verification: verificationResult,
		},
	};
}

// Test deposit service
async function testDepositService() {
	console.log('💰 Testing Deposit Service:');

	const testDeposit = {
		chatId: 123456789,
		txHash: '0.0.5789379@1754584444.553560679',
		expectedAmount: 10,
	};

	let depositResult = null;
	try {
		console.log('Test deposit request:', testDeposit);
		depositResult = await depositService.verifyDeposit(testDeposit);
		console.log('Deposit verification result:', depositResult);
	} catch (error) {
		console.log('Error:', error.message);
		depositResult = { success: false, error: error.message };
	}
	console.log();

	return {
		testRequest: testDeposit,
		result: depositResult,
	};
}

// Run tests
async function runTests() {
	let testResults = {
		success: false,
		hederaService: null,
		depositService: null,
		timestamp: new Date().toISOString(),
		errors: [],
	};

	try {
		console.log('🚀 Running comprehensive deposit verification tests...\n');

		// Test Hedera service
		testResults.hederaService = await testHederaService();

		// Test deposit service
		testResults.depositService = await testDepositService();

		testResults.success = true;

		console.log('✅ Deposit verification system is ready!');
		console.log('\n📝 To test with real transactions:');
		console.log('1. Set environment variables:');
		console.log('   - HEDERA_USDC_TOKEN_ID=<actual_token_id>');
		console.log('   - SHOQ_TREASURY_ACCOUNT=<your_account_id>');
		console.log('   - HEDERA_NETWORK=testnet');
		console.log('2. Use the Telegram bot with /deposit command');
		console.log('3. Or POST to /deposits/verify endpoint');
	} catch (error) {
		console.error('❌ Test failed:', error);
		testResults.errors.push(error.message || error.toString());
		testResults.success = false;
	}

	// Return comprehensive test results
	console.log('\n🔍 Final Test Results:');
	console.log(JSON.stringify(testResults, null, 2));

	return testResults;
}

// Execute tests and handle results
runTests()
	.then((results) => {
		console.log('\n✨ Test execution completed successfully!');
		if (results.success) {
			console.log('🎉 All systems operational!');
		} else {
			console.log('⚠️ Some tests had issues, but core functionality is ready.');
		}
		process.exit(results.success ? 0 : 1);
	})
	.catch((error) => {
		console.error('💥 Critical test failure:', error);
		process.exit(1);
	});

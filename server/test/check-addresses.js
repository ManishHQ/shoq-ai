import dotenv from 'dotenv';
import { usdcService } from '../services/usdcService.js';

dotenv.config();

async function checkAddresses() {
	try {
		console.log('🔍 Checking addresses involved in the transaction...\n');

		// Get addresses from environment
		const operatorAddress = process.env.OPERATOR_ADDRESS;
		const shopOwnerAddress = process.env.SHOP_OWNER_ADDRESS;
		const defaultTokenId = '0.0.6528760'; // USDC token ID

		console.log('📋 Addresses Configuration:');
		console.log(`Operator Address: ${operatorAddress}`);
		console.log(`Shop Owner Address: ${shopOwnerAddress}`);
		console.log(`USDC Token ID: ${defaultTokenId}\n`);

		// Check operator account balance
		console.log('💰 Checking Operator Account Balance:');
		const operatorBalance = await usdcService.getBalance(
			operatorAddress,
			defaultTokenId
		);
		if (operatorBalance) {
			console.log(`✅ Operator has ${operatorBalance.balance} USDC tokens`);
		} else {
			console.log('❌ Operator has no USDC tokens or token not associated');
		}

		// Check shop owner account balance
		console.log('\n💰 Checking Shop Owner Account Balance:');
		const shopOwnerBalance = await usdcService.getBalance(
			shopOwnerAddress,
			defaultTokenId
		);
		if (shopOwnerBalance) {
			console.log(`✅ Shop Owner has ${shopOwnerBalance.balance} USDC tokens`);
		} else {
			console.log('❌ Shop Owner has no USDC tokens or token not associated');
		}

		// Check if accounts have token association
		console.log('\n🔗 Checking Token Associations:');

		// For operator account
		try {
			const operatorBalanceCheck = await usdcService.getBalance(
				operatorAddress,
				defaultTokenId
			);
			if (operatorBalanceCheck && operatorBalanceCheck.balance >= 0) {
				console.log('✅ Operator account has USDC token associated');
			} else {
				console.log('❌ Operator account does NOT have USDC token associated');
			}
		} catch (error) {
			console.log('❌ Operator account does NOT have USDC token associated');
		}

		// For shop owner account
		try {
			const shopOwnerBalanceCheck = await usdcService.getBalance(
				shopOwnerAddress,
				defaultTokenId
			);
			if (shopOwnerBalanceCheck && shopOwnerBalanceCheck.balance >= 0) {
				console.log('✅ Shop Owner account has USDC token associated');
			} else {
				console.log(
					'❌ Shop Owner account does NOT have USDC token associated'
				);
			}
		} catch (error) {
			console.log('❌ Shop Owner account does NOT have USDC token associated');
		}

		console.log('\n📝 Summary:');
		console.log(
			'The error "TOKENNOTASSOCIATEDTOACCOUNT" means the sender account'
		);
		console.log('does not have the USDC token associated with their account.');
		console.log('\nTo fix this:');
		console.log(
			'1. The sender account needs to associate with the USDC token first'
		);
		console.log('2. Or use an account that already has USDC tokens');
		console.log('3. Or create a mock USDC token for testing');
	} catch (error) {
		console.error('❌ Error checking addresses:', error);
	}
}

checkAddresses();

# USDC Service

A comprehensive service for handling USDC token transfers on the Hedera network.

## Features

- ✅ Transfer USDC tokens between accounts
- ✅ Check account balances
- ✅ Validate sufficient balance before transfers
- ✅ Get transaction details
- ✅ Support for multiple account balance queries
- ✅ RESTful API endpoints
- ✅ TypeScript support with full type safety

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
OPERATOR_ADDRESS=your_hedera_operator_address
OPERATOR_KEY=your_hedera_operator_private_key
```

### 2. USDC Token ID

Update the `defaultUSDCTokenId` in `services/usdcService.ts` with the actual USDC token ID for your network:

- **Testnet**: Replace `'0.0.1234567'` with the actual testnet USDC token ID
- **Mainnet**: Replace with the mainnet USDC token ID

## API Endpoints

### Transfer USDC Tokens

```http
POST /usdc/transfer
```

**Request Body:**

```json
{
	"fromAccountId": "0.0.1234567",
	"toAccountId": "0.0.7654321",
	"amount": 100,
	"tokenId": "0.0.1234567", // Optional, defaults to configured USDC token
	"memo": "Payment for services" // Optional
}
```

**Response:**

```json
{
	"success": true,
	"message": "USDC transfer successful",
	"data": {
		"transactionId": "0.0.1234567@1234567890.123456789",
		"receipt": {
			/* transaction receipt */
		}
	}
}
```

### Get Account Balance

```http
GET /usdc/balance/:accountId?tokenId=0.0.1234567
```

**Response:**

```json
{
	"success": true,
	"data": {
		"accountId": "0.0.1234567",
		"balance": 1000,
		"tokenId": "0.0.1234567"
	}
}
```

### Get Multiple Account Balances

```http
POST /usdc/balances
```

**Request Body:**

```json
{
	"accountIds": ["0.0.1234567", "0.0.7654321"],
	"tokenId": "0.0.1234567" // Optional
}
```

### Check Sufficient Balance

```http
POST /usdc/check-balance
```

**Request Body:**

```json
{
	"accountId": "0.0.1234567",
	"requiredAmount": 500,
	"tokenId": "0.0.1234567" // Optional
}
```

### Get Transaction Details

```http
GET /usdc/transaction/:transactionId
```

## Usage Examples

### Basic Transfer

```typescript
import { usdcService } from './services/usdcService.js';

const result = await usdcService.transferTokens({
	fromAccountId: '0.0.1234567',
	toAccountId: '0.0.7654321',
	amount: 100,
	memo: 'Payment',
});

if (result.success) {
	console.log('Transfer successful:', result.transactionId);
} else {
	console.log('Transfer failed:', result.error);
}
```

### Check Balance Before Transfer

```typescript
const hasSufficient = await usdcService.hasSufficientBalance(
  '0.0.1234567',
  500
);

if (hasSufficient) {
  // Proceed with transfer
  const result = await usdcService.transferTokens({...});
} else {
  console.log('Insufficient balance');
}
```

### Get Multiple Balances

```typescript
const balances = await usdcService.getMultipleBalances([
	'0.0.1234567',
	'0.0.7654321',
	'0.0.1111111',
]);

balances.forEach((balance) => {
	console.log(`Account ${balance.accountId}: ${balance.balance} USDC`);
});
```

## Running the Example

To run the demonstration script:

```bash
cd server
npx tsx examples/usdc-example.ts
```

## Error Handling

The service includes comprehensive error handling:

- **Network errors**: Connection issues with Hedera network
- **Invalid accounts**: Non-existent or invalid account IDs
- **Insufficient balance**: Attempting to transfer more than available
- **Invalid amounts**: Negative or zero amounts
- **Transaction failures**: Failed transactions on the network

## Security Considerations

1. **Private Keys**: Never expose private keys in client-side code
2. **Environment Variables**: Keep sensitive data in environment variables
3. **Input Validation**: All inputs are validated before processing
4. **Error Messages**: Avoid exposing sensitive information in error messages

## Network Configuration

The service is configured for **testnet** by default. To switch to mainnet:

1. Change `Client.forTestnet()` to `Client.forMainnet()` in `usdcService.ts`
2. Update the USDC token ID to the mainnet version
3. Ensure your operator account has sufficient HBAR for fees

## Dependencies

- `@hashgraph/sdk`: Hedera SDK for JavaScript/TypeScript
- `express`: Web framework for API endpoints
- `dotenv`: Environment variable management

## Contributing

When adding new features:

1. Add TypeScript interfaces for new data structures
2. Include proper error handling
3. Add validation for all inputs
4. Update this README with new endpoints
5. Add tests for new functionality

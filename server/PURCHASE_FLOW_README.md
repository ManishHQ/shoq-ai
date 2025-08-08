# Purchase Flow with User Onboarding

This documentation explains how the purchase flow works with automatic user onboarding for both Telegram and Claude (AI) users.

## Overview

The purchase system automatically handles:
1. **User Detection**: Checks if user exists using wallet address, chat ID, or email
2. **User Creation**: Creates new users if they don't exist
3. **Order Processing**: Creates orders with full validation
4. **Notifications**: Sends emails and admin notifications
5. **Payment Validation**: Validates transactions (extensible)

## API Endpoints

### 1. General Purchase Endpoint
```
POST /purchase
```

**Request Body:**
```json
{
  "walletAddress": "0x742e26f3F3C4F3b0D0f7B8F9C4F0D0F0C4F0D0F0", // optional
  "chatId": 123456789, // optional (for Telegram)
  "email": "user@example.com", // optional
  "name": "John Doe", // optional
  "username": "johndoe", // optional
  
  "items": [
    {
      "productId": "PROD001",
      "name": "Premium Coffee Mug",
      "description": "Ceramic coffee mug with premium finish",
      "category": "product",
      "price": 13.00,
      "quantity": 2,
      "sku": "MUG-001",
      "image": "/product-image.jpg"
    }
  ],
  
  "shippingAddress": {
    "street": "123 Market Street",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102",
    "country": "USA"
  },
  
  "payment": {
    "method": "usdc_wallet",
    "transactionHash": "0x1234567890abcdef...",
    "amount": 31.99,
    "currency": "USD"
  },
  
  "subtotal": 26.00,
  "shipping": 5.99,
  "tax": 0,
  "discount": 0,
  "totalPrice": 31.99,
  "notes": "Please leave at front door",
  
  "source": "webapp" // or "telegram", "claude"
}
```

### 2. Telegram-Specific Purchase
```
POST /purchase/telegram
```

**Request Body:**
```json
{
  "chatId": 123456789,
  "name": "John Doe",
  "username": "johndoe",
  
  "items": [...],
  "shippingAddress": {...},
  "payment": {...},
  "subtotal": 26.00,
  "shipping": 5.99,
  "tax": 0,
  "discount": 0,
  "totalPrice": 31.99
}
```

### 3. Claude AI-Specific Purchase
```
POST /purchase/claude
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  
  "items": [...],
  "shippingAddress": {...},
  "payment": {...},
  "subtotal": 26.00,
  "shipping": 5.99,
  "tax": 0,
  "discount": 0,
  "totalPrice": 31.99
}
```

### 4. User Existence Check
```
POST /purchase/check-user
```

**Request Body:**
```json
{
  "walletAddress": "0x742e26f3F3C4F3b0D0f7B8F9C4F0D0F0C4F0D0F0", // optional
  "chatId": 123456789, // optional
  "email": "user@example.com" // optional
}
```

**Response:**
```json
{
  "success": true,
  "userExists": true,
  "data": {
    "user": {
      "id": "66b2a1c4f123456789012346",
      "name": "John Doe",
      "email": "user@example.com",
      "walletAddress": "0x742e26f3F3C4F3b0D0f7B8F9C4F0D0F0C4F0D0F0",
      "onboardingMethod": "wallet",
      "isVerified": true,
      "registeredAt": "2024-08-07T10:30:00.000Z"
    },
    "identifierUsed": "walletAddress"
  }
}
```

### 5. Get Purchase Status
```
GET /purchase/:orderId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "66b2a1c4f123456789012345",
      "orderId": "SHQ-2024-001234",
      "status": "confirmed",
      "items": [...],
      "totalPrice": 31.99,
      "trackingNumber": "TRK789456123",
      "createdAt": "2024-08-07T10:30:00.000Z"
    },
    "customer": {
      "name": "John Doe",
      "email": "user@example.com",
      "onboardingMethod": "wallet"
    }
  }
}
```

## User Onboarding Logic

### 1. User Detection Priority
1. **Wallet Address** (highest priority for web users)
2. **Chat ID** (for Telegram users)
3. **Email** (for AI/Claude users)
4. **Username** (fallback)

### 2. Onboarding Method Assignment
- `telegram`: If `source=telegram` or `chatId` provided
- `wallet`: If `walletAddress` provided
- `ai`: Default for Claude/AI purchases

### 3. New User Creation
When creating new users:
- **Name**: Uses provided name, or generates from username/email/identifier
- **Username**: Uses provided username, or generates unique one
- **Email**: Required for wallet and AI users, optional for Telegram
- **Verification**: Wallet users are auto-verified, others require verification

## Example Usage Scenarios

### Scenario 1: New Telegram User Purchase
```javascript
// Telegram bot receives order request
const purchaseData = {
  chatId: 123456789,
  name: "John Doe",
  username: "johndoe",
  
  items: [{
    productId: "PROD001",
    name: "Concert Ticket",
    description: "VIP Front Row",
    category: "ticket",
    price: 75.00,
    quantity: 2
  }],
  
  shippingAddress: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA"
  },
  
  payment: {
    method: "usdc_wallet",
    transactionHash: "0xabc123...",
    amount: 150.00,
    currency: "USD"
  },
  
  subtotal: 150.00,
  shipping: 0,
  tax: 0,
  discount: 0,
  totalPrice: 150.00
};

// API call
const response = await fetch('/purchase/telegram', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(purchaseData)
});

const result = await response.json();
console.log(result.isNewUser); // true if new user created
```

### Scenario 2: Existing Wallet User Purchase
```javascript
// Web app purchase for existing wallet user
const purchaseData = {
  walletAddress: "0x742e26f3F3C4F3b0D0f7B8F9C4F0D0F0C4F0D0F0",
  email: "john@example.com", // will update existing user if different
  
  items: [{
    productId: "PROD002",
    name: "Premium Headphones",
    description: "Noise-cancelling wireless",
    category: "product",
    price: 299.99,
    quantity: 1
  }],
  
  shippingAddress: {...},
  payment: {
    method: "usdc_wallet",
    transactionHash: "0xdef456...",
    amount: 314.99,
    currency: "USD"
  },
  
  subtotal: 299.99,
  shipping: 15.00,
  tax: 0,
  discount: 0,
  totalPrice: 314.99,
  source: "webapp"
};

const response = await fetch('/purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(purchaseData)
});
```

### Scenario 3: Claude AI User Purchase
```javascript
// Claude helping user make purchase
const purchaseData = {
  email: "sarah@example.com",
  name: "Sarah Connor",
  
  items: [{
    productId: "PROD003",
    name: "Smart Watch",
    description: "Fitness tracking smartwatch",
    category: "product",
    price: 199.99,
    quantity: 1
  }],
  
  shippingAddress: {
    street: "456 Tech Ave",
    city: "San Francisco",
    state: "CA",
    zipCode: "94105",
    country: "USA"
  },
  
  payment: {
    method: "usdc_wallet",
    transactionHash: "0xghi789...",
    amount: 209.98,
    currency: "USD"
  },
  
  subtotal: 199.99,
  shipping: 9.99,
  tax: 0,
  discount: 0,
  totalPrice: 209.98
};

const response = await fetch('/purchase/claude', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(purchaseData)
});

const result = await response.json();
// Returns order details and tracking URL
console.log(result.data.order.trackingUrl);
```

## Email Notifications

### New User Welcome Email
Sent to new users with email addresses:
- Welcome message
- Account details
- Available features

### Order Confirmation Email
Sent to all users with email addresses:
- Order details
- Items purchased
- Shipping information
- Tracking link

### Admin Notification Email
Sent to fulfillment team:
- Order details requiring action
- Customer information
- Special flags for new customers
- Fulfillment instructions

## Error Handling

The system handles various error scenarios:

### Validation Errors
- Missing required fields
- Invalid email/wallet formats
- Incorrect total calculations
- Empty order items

### User Conflicts
- Duplicate wallet addresses
- Duplicate chat IDs
- Duplicate usernames

### Payment Issues
- Invalid transaction hashes
- Payment amount mismatches
- Payment validation failures

### Database Errors
- Connection issues
- Constraint violations
- Transaction rollbacks

## Integration Examples

### Telegram Bot Integration
```javascript
// In your Telegram bot
bot.on('message', async (msg) => {
  if (msg.text === '/buy') {
    // Show product selection
    // Collect shipping info
    // Process payment
    
    const result = await purchaseService.processPurchase({
      chatId: msg.chat.id,
      name: `${msg.from.first_name} ${msg.from.last_name}`,
      username: msg.from.username,
      // ... other order data
      source: 'telegram'
    });
    
    if (result.success) {
      bot.sendMessage(msg.chat.id, `✅ Order confirmed! #${result.order.orderId}`);
    } else {
      bot.sendMessage(msg.chat.id, `❌ ${result.message}`);
    }
  }
});
```

### Web App Integration
```javascript
// In your React/Next.js app
const handlePurchase = async (orderData) => {
  // Get wallet address from Web3 provider
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });
  
  const purchaseData = {
    ...orderData,
    walletAddress: accounts[0],
    source: 'webapp'
  };
  
  const response = await fetch('/api/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchaseData)
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Redirect to order confirmation page
    router.push(`/orders/${result.data.order.id}`);
  } else {
    // Show error message
    setError(result.message);
  }
};
```

### Claude MCP Integration
```javascript
// In your Claude MCP server
const tools = [
  {
    name: "create_purchase",
    description: "Create a purchase order with automatic user onboarding",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string" },
        name: { type: "string" },
        items: { type: "array" },
        shippingAddress: { type: "object" },
        payment: { type: "object" }
      }
    }
  }
];

const handleToolCall = async (name, args) => {
  if (name === "create_purchase") {
    const response = await fetch(`${process.env.API_BASE_URL}/purchase/claude`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...args,
        source: 'claude'
      })
    });
    
    const result = await response.json();
    return result;
  }
};
```

## Security Considerations

1. **Input Validation**: All inputs are validated on the server side
2. **Transaction Verification**: Payment hashes are validated (extend as needed)
3. **Rate Limiting**: Implement rate limiting for purchase endpoints
4. **Authentication**: Consider adding authentication for sensitive operations
5. **Data Encryption**: Sensitive data should be encrypted at rest
6. **Audit Logging**: All purchase actions should be logged

## Future Enhancements

1. **Advanced Payment Validation**: Integrate with blockchain APIs for real transaction verification
2. **Inventory Management**: Check product availability before order creation
3. **Dynamic Pricing**: Support for dynamic pricing and promotions
4. **Multi-Currency Support**: Handle multiple cryptocurrencies and fiat currencies
5. **Advanced Notifications**: SMS notifications, push notifications
6. **Analytics Integration**: Track user onboarding and purchase metrics
7. **Webhook Support**: Allow external systems to receive order notifications
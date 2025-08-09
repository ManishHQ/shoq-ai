# Shoq MCP Server

A comprehensive Model Context Protocol (MCP) server for the Shoq e-commerce platform, providing AI agents with full access to product management, order processing, user management, and Hedera blockchain functionality.

## Features

### 🛍️ Product Management
- **Search Products**: Find products by keywords, category, or filters
- **Product Details**: Get comprehensive product information
- **CRUD Operations**: Create, update, and delete products
- **Inventory Management**: Track stock levels and availability

### 📦 Order Processing
- **Order Creation**: Process orders with automatic USDC payments
- **Order Management**: View, track, and cancel orders
- **Payment Integration**: Seamless Hedera USDC transactions
- **Email Notifications**: Automated order confirmations

### 👤 User Management
- **User Profiles**: Access user information and preferences
- **Balance Management**: Handle USDC deposits and refunds
- **Order History**: Track user purchase history

### ⛓️ Hedera Blockchain Integration
- **Transaction Verification**: Verify USDC transactions on Hedera
- **Balance Checking**: Check HBAR and token balances
- **Token Transfers**: Execute USDC transfers between accounts
- **Real-time Processing**: Live blockchain integration

### 🤖 AI-Powered Features
- **Smart Responses**: Context-aware AI chat responses
- **Product Recommendations**: AI-driven product suggestions
- **Natural Language Processing**: Understand user intents
- **Conversation Context**: Maintain chat history and context

### 📊 Analytics & Reporting
- **Sales Analytics**: Revenue, order counts, and trends
- **Popular Products**: Best-selling and highest-rated items
- **User Insights**: Customer behavior and preferences

## Installation

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Hedera testnet account with USDC tokens
- Gemini AI API key
- SMTP email configuration

### Setup

1. **Install Dependencies**
   ```bash
   cd server/mcp
   npm install
   ```

2. **Build the Server**
   ```bash
   npm run build
   ```

3. **Configure Environment Variables**
   Copy and update the environment variables in your `.env` file:
   ```env
   MONGO_URL=mongodb://localhost:27017/shoq
   GEMINI_API_KEY=your-gemini-api-key
   OPERATOR_ADDRESS=0.0.your-hedera-account
   OPERATOR_KEY=your-hedera-private-key
   SHOP_OWNER_ADDRESS=0.0.shop-owner-account
   HEDERA_USDC_TOKEN_ID=0.0.6528760
   FULFILLMENT_EMAIL=orders@yourstore.com
   EMAIL_USERNAME=your-smtp-email
   EMAIL_PASSWORD=your-smtp-password
   SMTP_HOST=smtp.gmail.com
   JWT_SECRET=your-jwt-secret
   ```

4. **Configure Claude Desktop**
   Update your Claude Desktop configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
   ```json
   {
     "mcpServers": {
       "shoq-ecommerce": {
         "command": "node",
         "args": ["/absolute/path/to/shoq/app/server/shoq-mcp-server.js"],
         "env": {
           "MONGO_URL": "mongodb://localhost:27017/shoq",
           "GEMINI_API_KEY": "your-gemini-api-key",
           // ... other environment variables
         }
       }
     }
   }
   ```

5. **Start the Server**
   ```bash
   npm start
   ```

## Available Tools

### Product Management Tools

#### `search_products`
Search for products using keywords, category filters, and limits.
```json
{
  "query": "wireless headphones",
  "category": "electronics", 
  "limit": 10
}
```

#### `get_product_details`
Get detailed information about a specific product.
```json
{
  "productId": "HEADPHONES001"
}
```

#### `create_product`
Create a new product in the catalog.
```json
{
  "name": "Wireless Earbuds",
  "description": "High-quality wireless earbuds with noise cancellation",
  "category": "electronics",
  "price": 99.99,
  "stockQuantity": 50,
  "imageUrl": "https://example.com/image.jpg"
}
```

#### `update_product`
Update an existing product.
```json
{
  "productId": "HEADPHONES001",
  "updates": {
    "price": 89.99,
    "stockQuantity": 75
  }
}
```

#### `delete_product`
Soft delete a product (mark as inactive).
```json
{
  "productId": "HEADPHONES001"
}
```

### Order Management Tools

#### `create_order`
Create a new order with automatic payment processing.
```json
{
  "chatId": 123456789,
  "productId": "HEADPHONES001",
  "quantity": 2
}
```

#### `get_order_details`
Get detailed information about an order.
```json
{
  "orderId": "181755003"
}
```

#### `get_user_orders`
Get all orders for a specific user.
```json
{
  "chatId": 123456789,
  "limit": 10
}
```

#### `cancel_order`
Cancel an order and process refund.
```json
{
  "orderId": "181755003",
  "chatId": 123456789
}
```

### User Management Tools

#### `get_user_profile`
Get user profile information.
```json
{
  "chatId": 123456789
}
```

#### `update_user_balance`
Update user USDC balance.
```json
{
  "chatId": 123456789,
  "amount": 50.00,
  "reason": "Deposit verification"
}
```

### Hedera Blockchain Tools

#### `verify_hedera_transaction`
Verify a Hedera USDC transaction and process deposit.
```json
{
  "transactionId": "0.0.6494628@1754669302.460902934",
  "chatId": 123456789
}
```

#### `check_hedera_balance`
Check HBAR and USDC balance of an account.
```json
{
  "accountId": "0.0.6494628"
}
```

#### `transfer_usdc`
Transfer USDC between Hedera accounts.
```json
{
  "fromAccountId": "0.0.6494628",
  "toAccountId": "0.0.6494629", 
  "amount": 25.50,
  "memo": "Payment for order #123"
}
```

### AI & Communication Tools

#### `ai_chat_response`
Generate AI response with product and user context.
```json
{
  "userMessage": "I'm looking for wireless headphones under $100",
  "chatId": 123456789,
  "conversationHistory": [
    {
      "userMessage": "Hi there!",
      "botResponse": "Hello! How can I help you today?",
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### `send_order_confirmation_email`
Send order confirmation email to customer.
```json
{
  "orderId": "181755003"
}
```

### Analytics & Reporting Tools

#### `get_sales_analytics`
Get sales analytics and statistics.
```json
{
  "period": "week"
}
```

#### `get_popular_products`
Get most popular/best-selling products.
```json
{
  "limit": 10,
  "category": "electronics"
}
```

## Usage Examples

### Example 1: Product Search and Purchase Flow
```typescript
// 1. Search for products
const searchResult = await callTool('search_products', {
  query: 'wireless headphones',
  category: 'electronics',
  limit: 5
});

// 2. Get product details
const productDetails = await callTool('get_product_details', {
  productId: 'HEADPHONES001'
});

// 3. Create an order
const order = await callTool('create_order', {
  chatId: 123456789,
  productId: 'HEADPHONES001',
  quantity: 1
});
```

### Example 2: Transaction Verification Flow
```typescript
// 1. Verify Hedera transaction
const verification = await callTool('verify_hedera_transaction', {
  transactionId: '0.0.6494628@1754669302.460902934',
  chatId: 123456789
});

// 2. Check updated user balance
const userProfile = await callTool('get_user_profile', {
  chatId: 123456789
});
```

### Example 3: AI-Powered Customer Service
```typescript
// Generate contextual AI response
const aiResponse = await callTool('ai_chat_response', {
  userMessage: 'I want to buy something for my home office',
  chatId: 123456789,
  conversationHistory: [
    {
      userMessage: 'Hi, I need help finding products',
      botResponse: 'I\'d be happy to help! What are you looking for?',
      timestamp: '2024-01-15T10:00:00Z'
    }
  ]
});
```

## Architecture

The Shoq MCP Server is built on top of the existing Shoq e-commerce platform and provides a standardized interface for AI agents to interact with:

- **MongoDB Database**: Product catalog, orders, and user data
- **Hedera Blockchain**: USDC payment processing and verification  
- **Gemini AI**: Natural language processing and recommendations
- **Email Service**: Automated notifications and confirmations
- **Express.js API**: RESTful endpoints for web and mobile clients

## Security

- **Environment Variables**: Sensitive credentials stored in environment variables
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive parameter validation for all tools
- **Error Handling**: Graceful error handling with detailed logging
- **Rate Limiting**: Built-in protection against abuse

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Testing Tools
You can test individual tools using the MCP inspector or by calling them directly through Claude Desktop.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues, questions, or contributions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation for troubleshooting

---

**Note**: This MCP server requires the full Shoq backend to be running with all dependencies properly configured. Make sure your MongoDB, Hedera accounts, and email services are properly set up before using the MCP server.

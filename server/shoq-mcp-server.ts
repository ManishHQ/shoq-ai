#!/usr/bin/env node

/**
 * Shoq MCP Server
 * 
 * This MCP server exposes the core functionality of the Shoq e-commerce platform
 * including product management, order processing, user management, and Hedera blockchain integration.
 * 
 * Features:
 * - Product catalog management (search, create, update, delete)
 * - Order processing and management
 * - User account management
 * - USDC payment processing via Hedera
 * - AI-powered chat and recommendations
 * - Email notifications
 * - Transaction verification
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';

// Import services
import connectDB from './utils/connectDB.js';
import productService from './services/productService.js';
import orderService from './services/orderService.js';
import { usdcService } from './services/usdcService.js';
import User from './models/user.model.js';
import { hederaVerificationService } from './services/hederaVerificationService.js';
import emailService from './services/emailService.js';
import GeminiService from './services/geminiService.js';

dotenv.config();

// Initialize services
let geminiService: GeminiService;

async function initializeServices() {
  // Initialize database connection
  await connectDB(process.env.MONGO_URL as string || 'mongodb://localhost:27017/shoq');
  
  // Initialize services
  geminiService = new GeminiService();
}

// Tool definitions
const TOOLS = [
  // Product Management Tools
  {
    name: 'search_products',
    description: 'Search for products in the catalog using keywords, category, or filters',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (product name, description, or tags)'
        },
        category: {
          type: 'string',
          description: 'Filter by category (electronics, clothing, grocery, home, books, etc.)',
          enum: ['electronics', 'clothing', 'grocery', 'home', 'books', 'sports', 'other']
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 10
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_product_details',
    description: 'Get detailed information about a specific product',
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID to retrieve details for'
        }
      },
      required: ['productId']
    }
  },
  {
    name: 'create_product',
    description: 'Create a new product in the catalog',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Product name'
        },
        description: {
          type: 'string',
          description: 'Product description'
        },
        category: {
          type: 'string',
          description: 'Product category',
          enum: ['electronics', 'clothing', 'grocery', 'home', 'books', 'sports', 'other']
        },
        price: {
          type: 'number',
          description: 'Product price in USD'
        },
        stockQuantity: {
          type: 'number',
          description: 'Initial stock quantity'
        },
        imageUrl: {
          type: 'string',
          description: 'Product image URL (optional)'
        }
      },
      required: ['name', 'description', 'category', 'price', 'stockQuantity']
    }
  },
  {
    name: 'update_product',
    description: 'Update an existing product',
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID to update'
        },
        updates: {
          type: 'object',
          description: 'Fields to update',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            stockQuantity: { type: 'number' },
            category: { type: 'string' },
            imageUrl: { type: 'string' }
          }
        }
      },
      required: ['productId', 'updates']
    }
  },
  {
    name: 'delete_product',
    description: 'Soft delete a product (mark as inactive)',
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID to delete'
        }
      },
      required: ['productId']
    }
  },

  // Order Management Tools
  {
    name: 'create_order',
    description: 'Create a new order and process USDC payment',
    inputSchema: {
      type: 'object',
      properties: {
        chatId: {
          type: 'number',
          description: 'User chat ID (Telegram)'
        },
        productId: {
          type: 'string',
          description: 'Product ID to order'
        },
        quantity: {
          type: 'number',
          description: 'Quantity to order',
          default: 1
        }
      },
      required: ['chatId', 'productId', 'quantity']
    }
  },
  {
    name: 'get_order_details',
    description: 'Get details of a specific order',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID or MongoDB _id'
        }
      },
      required: ['orderId']
    }
  },
  {
    name: 'get_user_orders',
    description: 'Get all orders for a specific user',
    inputSchema: {
      type: 'object',
      properties: {
        chatId: {
          type: 'number',
          description: 'User chat ID'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of orders to return',
          default: 10
        }
      },
      required: ['chatId']
    }
  },
  {
    name: 'cancel_order',
    description: 'Cancel an order and refund the user',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to cancel'
        },
        chatId: {
          type: 'number',
          description: 'User chat ID for verification'
        }
      },
      required: ['orderId', 'chatId']
    }
  },

  // User Management Tools
  {
    name: 'get_user_profile',
    description: 'Get user profile information',
    inputSchema: {
      type: 'object',
      properties: {
        chatId: {
          type: 'number',
          description: 'User chat ID'
        }
      },
      required: ['chatId']
    }
  },
  {
    name: 'update_user_balance',
    description: 'Update user USDC balance (for deposits/refunds)',
    inputSchema: {
      type: 'object',
      properties: {
        chatId: {
          type: 'number',
          description: 'User chat ID'
        },
        amount: {
          type: 'number',
          description: 'Amount to add/subtract (can be negative)'
        },
        reason: {
          type: 'string',
          description: 'Reason for balance change'
        }
      },
      required: ['chatId', 'amount', 'reason']
    }
  },

  // Hedera Blockchain Tools
  {
    name: 'verify_hedera_transaction',
    description: 'Verify a Hedera USDC transaction and process deposit',
    inputSchema: {
      type: 'object',
      properties: {
        transactionId: {
          type: 'string',
          description: 'Hedera transaction ID (format: 0.0.XXXXX@TIMESTAMP.NANOSECONDS)'
        },
        chatId: {
          type: 'number',
          description: 'User chat ID to credit the deposit'
        }
      },
      required: ['transactionId', 'chatId']
    }
  },
  {
    name: 'check_hedera_balance',
    description: 'Check HBAR and USDC balance of a Hedera account',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Hedera account ID (format: 0.0.XXXXX)'
        }
      },
      required: ['accountId']
    }
  },
  {
    name: 'transfer_usdc',
    description: 'Transfer USDC tokens between Hedera accounts',
    inputSchema: {
      type: 'object',
      properties: {
        fromAccountId: {
          type: 'string',
          description: 'Source account ID'
        },
        toAccountId: {
          type: 'string',
          description: 'Destination account ID'
        },
        amount: {
          type: 'number',
          description: 'Amount of USDC to transfer'
        },
        memo: {
          type: 'string',
          description: 'Transaction memo (optional)'
        }
      },
      required: ['fromAccountId', 'toAccountId', 'amount']
    }
  },

  // AI & Communication Tools
  {
    name: 'ai_chat_response',
    description: 'Generate AI response for user queries with product context',
    inputSchema: {
      type: 'object',
      properties: {
        userMessage: {
          type: 'string',
          description: 'User message or query'
        },
        chatId: {
          type: 'number',
          description: 'User chat ID for context'
        },
        conversationHistory: {
          type: 'array',
          description: 'Previous conversation messages',
          items: {
            type: 'object',
            properties: {
              userMessage: { type: 'string' },
              botResponse: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        }
      },
      required: ['userMessage', 'chatId']
    }
  },
  {
    name: 'send_order_confirmation_email',
    description: 'Send order confirmation email to customer',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to send confirmation for'
        }
      },
      required: ['orderId']
    }
  },

  // Analytics & Reporting Tools
  {
    name: 'get_sales_analytics',
    description: 'Get sales analytics and statistics',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Time period for analytics',
          enum: ['today', 'week', 'month', 'all'],
          default: 'week'
        }
      }
    }
  },
  {
    name: 'get_popular_products',
    description: 'Get most popular/best-selling products',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of products to return',
          default: 10
        },
        category: {
          type: 'string',
          description: 'Filter by category (optional)'
        }
      }
    }
  }
];

// Create MCP server
const server = new Server(
  {
    name: 'shoq-ecommerce',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Product Management
      case 'search_products':
        return await handleSearchProducts(args);
      case 'get_product_details':
        return await handleGetProductDetails(args);
      case 'create_product':
        return await handleCreateProduct(args);
      case 'update_product':
        return await handleUpdateProduct(args);
      case 'delete_product':
        return await handleDeleteProduct(args);

      // Order Management
      case 'create_order':
        return await handleCreateOrder(args);
      case 'get_order_details':
        return await handleGetOrderDetails(args);
      case 'get_user_orders':
        return await handleGetUserOrders(args);
      case 'cancel_order':
        return await handleCancelOrder(args);

      // User Management
      case 'get_user_profile':
        return await handleGetUserProfile(args);
      case 'update_user_balance':
        return await handleUpdateUserBalance(args);

      // Hedera Blockchain
      case 'verify_hedera_transaction':
        return await handleVerifyHederaTransaction(args);
      case 'check_hedera_balance':
        return await handleCheckHederaBalance(args);
      case 'transfer_usdc':
        return await handleTransferUSDC(args);

      // AI & Communication
      case 'ai_chat_response':
        return await handleAIChatResponse(args);
      case 'send_order_confirmation_email':
        return await handleSendOrderConfirmationEmail(args);

      // Analytics & Reporting
      case 'get_sales_analytics':
        return await handleGetSalesAnalytics(args);
      case 'get_popular_products':
        return await handleGetPopularProducts(args);

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// Tool handlers
async function handleSearchProducts(args: any) {
  const { query, category, limit = 10 } = args;
  
  let result;
  if (category) {
    result = await productService.getProductsByCategory(category);
  } else {
    result = await productService.searchProducts(query);
  }

  if (!result.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Error searching products: ${result.error}`
        }
      ]
    };
  }

  const products = result.products?.slice(0, limit) || [];
  
  return {
    content: [
      {
        type: 'text',
        text: `Found ${products.length} products:\n\n${products.map(p => 
          `• ${p.name} - $${p.price} (${p.category})\n  ${p.description}\n  Stock: ${p.stockQuantity} | Rating: ${p.rating}/5`
        ).join('\n\n')}`
      }
    ]
  };
}

async function handleGetProductDetails(args: any) {
  const { productId } = args;
  const result = await productService.getProductById(productId);

  if (!result.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Product not found: ${result.error}`
        }
      ]
    };
  }

  const product = result.product;
  return {
    content: [
      {
        type: 'text',
        text: `Product Details:
Name: ${product.name}
Description: ${product.description}
Category: ${product.category}
Price: $${product.price}
Stock: ${product.stockQuantity}
Rating: ${product.rating}/5 (${product.reviewCount} reviews)
SKU: ${product.sku}
Status: ${product.inStock ? 'In Stock' : 'Out of Stock'}
Created: ${new Date(product.createdAt).toLocaleDateString()}`
      }
    ]
  };
}

async function handleCreateProduct(args: any) {
  const result = await productService.createProduct(args);

  if (!result.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to create product: ${result.error}`
        }
      ]
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Product created successfully:
ID: ${result.product.productId}
Name: ${result.product.name}
Price: $${result.product.price}
Category: ${result.product.category}`
      }
    ]
  };
}

async function handleUpdateProduct(args: any) {
  const { productId, updates } = args;
  const result = await productService.updateProduct(productId, updates);

  if (!result.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to update product: ${result.error}`
        }
      ]
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Product ${productId} updated successfully`
      }
    ]
  };
}

async function handleDeleteProduct(args: any) {
  const { productId } = args;
  const result = await productService.deleteProduct(productId);

  if (!result.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to delete product: ${result.error}`
        }
      ]
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Product ${productId} deleted successfully`
      }
    ]
  };
}

async function handleCreateOrder(args: any) {
  const { chatId, productId, quantity = 1 } = args;

  // Get product details for pricing
  const productResult = await productService.getProductById(productId);
  if (!productResult.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Product not found: ${productResult.error}`
        }
      ]
    };
  }

  const totalPrice = productResult.product.price * quantity;

  const orderRequest = {
    chatId,
    productId,
    quantity,
    totalPrice
  };

  const result = await orderService.createOrder(orderRequest);

  if (!result.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Order creation failed: ${result.message}`
        }
      ]
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Order created successfully:
Order ID: ${result.order.orderId}
Product: ${productResult.product.name}
Quantity: ${quantity}
Total: $${totalPrice}
Status: ${result.order.status}
Transaction Hash: ${result.transactionHash}`
      }
    ]
  };
}

async function handleGetOrderDetails(args: any) {
  const { orderId } = args;
  
  // Try both orderId and MongoDB _id
  let order = await orderService.getOrderById(orderId);
  if (!order) {
    order = await orderService.getOrder(orderId);
  }

  if (!order) {
    return {
      content: [
        {
          type: 'text',
          text: `Order not found: ${orderId}`
        }
      ]
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Order Details:
Order ID: ${order.orderId}
Status: ${order.status}
Total: $${order.totalPrice}
Items: ${order.items.map((item: any) => `${item.name} x${item.quantity}`).join(', ')}
Transaction Hash: ${order.transactionHash || 'N/A'}
Created: ${new Date(order.createdAt).toLocaleDateString()}
Customer: ${order.userId.name} (${order.userId.email})`
      }
    ]
  };
}

async function handleGetUserOrders(args: any) {
  const { chatId, limit = 10 } = args;
  const orders = await orderService.getUserOrders(chatId, limit);

  if (orders.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No orders found for this user'
        }
      ]
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `User Orders (${orders.length}):\n\n${orders.map(order => 
          `Order #${order.orderId} - $${order.totalPrice} - ${order.status}\n` +
          `  Items: ${order.items.map((item: any) => `${item.name} x${item.quantity}`).join(', ')}\n` +
          `  Date: ${new Date(order.createdAt).toLocaleDateString()}`
        ).join('\n\n')}`
      }
    ]
  };
}

async function handleCancelOrder(args: any) {
  const { orderId, chatId } = args;
  const result = await orderService.cancelOrder(orderId, chatId);

  return {
    content: [
      {
        type: 'text',
        text: result.message
      }
    ]
  };
}

async function handleGetUserProfile(args: any) {
  const { chatId } = args;
  const user = await User.findOne({ chatId });

  if (!user) {
    return {
      content: [
        {
          type: 'text',
          text: 'User not found'
        }
      ]
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `User Profile:
Name: ${user.name}
Username: @${user.username}
Email: ${user.email}
Balance: $${user.balance} USDC
Member Since: ${new Date(user.registeredAt).toLocaleDateString()}
Onboarding Method: ${user.onboardingMethod}
Verified: ${user.isVerified ? 'Yes' : 'No'}
Email Notifications: ${user.emailNotifications ? 'Enabled' : 'Disabled'}`
      }
    ]
  };
}

async function handleUpdateUserBalance(args: any) {
  const { chatId, amount, reason } = args;
  
  const user = await User.findOne({ chatId });
  if (!user) {
    return {
      content: [
        {
          type: 'text',
          text: 'User not found'
        }
      ]
    };
  }

  const oldBalance = user.balance;
  user.balance += amount;
  await user.save();

  return {
    content: [
      {
        type: 'text',
        text: `Balance updated for ${user.name}:
Previous Balance: $${oldBalance}
Change: ${amount >= 0 ? '+' : ''}$${amount}
New Balance: $${user.balance}
Reason: ${reason}`
      }
    ]
  };
}

async function handleVerifyHederaTransaction(args: any) {
  const { transactionId, chatId } = args;
  
  const verification = await hederaVerificationService.verifyTransaction(transactionId);
  
  if (!verification.isValid) {
    return {
      content: [
        {
          type: 'text',
          text: `Transaction verification failed: ${verification.error}`
        }
      ]
    };
  }

  // Credit user balance if verification successful
  const user = await User.findOne({ chatId });
  if (user && verification.amount) {
    user.balance += verification.amount;
    await user.save();
  }

  return {
    content: [
      {
        type: 'text',
        text: `Transaction verified successfully:
Amount: $${verification.amount} USDC
From: ${verification.sender}
To: ${verification.receiver}
Token: ${verification.tokenId}
Timestamp: ${verification.timestamp}
${user ? `User balance updated: $${user.balance}` : 'User not found for balance update'}`
      }
    ]
  };
}

async function handleCheckHederaBalance(args: any) {
  const { accountId } = args;
  
  const balanceInfo = await hederaVerificationService.getAccountBalance(accountId);
  
  if (!balanceInfo.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to get balance: ${balanceInfo.error}`
        }
      ]
    };
  }

  const networkInfo = hederaVerificationService.getNetworkInfo();
  const usdcTokenId = networkInfo.expectedTokenId;
  const usdcBalance = balanceInfo.tokenBalances?.[usdcTokenId] || 0;
  const usdcFormatted = hederaVerificationService.formatAmount(usdcBalance, 6);

  return {
    content: [
      {
        type: 'text',
        text: `Account Balance for ${accountId}:
HBAR: ${balanceInfo.balance} tinybars
USDC: ${usdcFormatted}
Total Tokens: ${Object.keys(balanceInfo.tokenBalances || {}).length}`
      }
    ]
  };
}

async function handleTransferUSDC(args: any) {
  const { fromAccountId, toAccountId, amount, memo } = args;
  
  const result = await usdcService.transferTokens({
    fromAccountId,
    toAccountId,
    amount,
    memo
  });

  if (!result.success) {
    return {
      content: [
        {
          type: 'text',
          text: `USDC transfer failed: ${result.error}`
        }
      ]
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `USDC transfer successful:
Amount: $${amount}
From: ${fromAccountId}
To: ${toAccountId}
Transaction ID: ${result.transactionId}
${memo ? `Memo: ${memo}` : ''}`
      }
    ]
  };
}

async function handleAIChatResponse(args: any) {
  const { userMessage, chatId, conversationHistory } = args;
  
  // Get user context
  const user = await User.findOne({ chatId });
  const userContext = user ? {
    userId: user._id,
    chatId: user.chatId,
    email: user.email,
    name: user.name,
    balance: user.balance,
    onboardingMethod: user.onboardingMethod
  } : undefined;

  // Format conversation context
  const context = conversationHistory ? {
    conversationHistory: conversationHistory.map((entry: any) => ({
      userMessage: entry.userMessage,
      botResponse: entry.botResponse,
      timestamp: new Date(entry.timestamp)
    }))
  } : undefined;

  const response = await geminiService.processMessage(userMessage, chatId, userContext, context);

  return {
    content: [
      {
        type: 'text',
        text: `AI Response: ${response.message}${response.action ? `\n\nSuggested Action: ${response.action.action} with parameters: ${JSON.stringify(response.action.parameters)}` : ''}`
      }
    ]
  };
}

async function handleSendOrderConfirmationEmail(args: any) {
  const { orderId } = args;
  
  // Get order details
  let order = await orderService.getOrderById(orderId);
  if (!order) {
    order = await orderService.getOrder(orderId);
  }

  if (!order) {
    return {
      content: [
        {
          type: 'text',
          text: `Order not found: ${orderId}`
        }
      ]
    };
  }

  // Send email (this would typically be called automatically in the order creation process)
  return {
    content: [
      {
        type: 'text',
        text: `Order confirmation email functionality available. Order ${order.orderId} details can be sent to ${order.userId.email}`
      }
    ]
  };
}

async function handleGetSalesAnalytics(args: any) {
  const { period = 'week' } = args;
  
  // This is a simplified analytics implementation
  // In a real system, you'd have more sophisticated analytics
  const Order = (await import('./models/order.model.js')).default;
  
  let dateFilter = {};
  const now = new Date();
  
  switch (period) {
    case 'today':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      };
      break;
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: weekAgo } };
      break;
    case 'month':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      };
      break;
    default:
      dateFilter = {};
  }

  const orders = await Order.find(dateFilter);
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    content: [
      {
        type: 'text',
        text: `Sales Analytics (${period}):
Total Orders: ${totalOrders}
Total Revenue: $${totalRevenue.toFixed(2)}
Average Order Value: $${averageOrderValue.toFixed(2)}
Status Breakdown:
- Confirmed: ${orders.filter(o => o.status === 'confirmed').length}
- Pending: ${orders.filter(o => o.status === 'pending').length}
- Cancelled: ${orders.filter(o => o.status === 'cancelled').length}
- Delivered: ${orders.filter(o => o.status === 'delivered').length}`
      }
    ]
  };
}

async function handleGetPopularProducts(args: any) {
  const { limit = 10, category } = args;
  
  // Get products sorted by rating and review count
  const result = category 
    ? await productService.getProductsByCategory(category)
    : await productService.getFeaturedProducts(limit);

  if (!result.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Error getting popular products: ${result.error}`
        }
      ]
    };
  }

  const products = result.products?.slice(0, limit) || [];
  
  return {
    content: [
      {
        type: 'text',
        text: `Popular Products${category ? ` in ${category}` : ''}:\n\n${products.map((p, i) => 
          `${i + 1}. ${p.name} - $${p.price}\n   Rating: ${p.rating}/5 (${p.reviewCount} reviews)\n   Stock: ${p.stockQuantity}`
        ).join('\n\n')}`
      }
    ]
  };
}

// Start the server
async function main() {
  await initializeServices();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Shoq MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

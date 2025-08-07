#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ErrorCode,
	ListToolsRequestSchema,
	McpError,
} from '@modelcontextprotocol/sdk/types.js';
import connectDB from './utils/connectDB.js';
import User from './models/user.model.js';
import Order from './models/order.model.js';
import Deposit from './models/deposit.model.js';
import { config } from 'dotenv';
config();

// Initialize database connection
connectDB(process.env.MONGO_URL || 'mongodb://localhost:27017/shoq');

const server = new Server(
	{
		name: 'shoq-server',
		version: '1.0.0',
	},
	{
		capabilities: {
			tools: {},
		},
	}
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: 'get_users',
				description: 'Get all users from the database',
				inputSchema: {
					type: 'object',
					properties: {
						limit: {
							type: 'number',
							description: 'Maximum number of users to return',
							default: 50,
						},
					},
				},
			},
			{
				name: 'get_user_by_id',
				description: 'Get a specific user by their ID',
				inputSchema: {
					type: 'object',
					properties: {
						userId: {
							type: 'string',
							description: 'The user ID to fetch',
						},
					},
					required: ['userId'],
				},
			},
			{
				name: 'get_orders',
				description: 'Get all orders from the database',
				inputSchema: {
					type: 'object',
					properties: {
						limit: {
							type: 'number',
							description: 'Maximum number of orders to return',
							default: 50,
						},
						userId: {
							type: 'string',
							description: 'Filter orders by user ID (optional)',
						},
					},
				},
			},
			{
				name: 'get_deposits',
				description: 'Get all deposits from the database',
				inputSchema: {
					type: 'object',
					properties: {
						limit: {
							type: 'number',
							description: 'Maximum number of deposits to return',
							default: 50,
						},
						userId: {
							type: 'string',
							description: 'Filter deposits by user ID (optional)',
						},
					},
				},
			},
			{
				name: 'get_server_stats',
				description: 'Get server statistics and overview',
				inputSchema: {
					type: 'object',
					properties: {},
				},
			},
			{
				name: 'verify_user',
				description: 'Verify user identity by email or telegramId',
				inputSchema: {
					type: 'object',
					properties: {
						email: {
							type: 'string',
							description: 'User email to verify',
						},
						telegramId: {
							type: 'string',
							description: 'Telegram ID to verify',
						},
						name: {
							type: 'string',
							description: 'User name to cross-check',
						},
					},
				},
			},
			{
				name: 'create_order',
				description: 'Create a new order for a verified user',
				inputSchema: {
					type: 'object',
					properties: {
						userId: {
							type: 'string',
							description: 'The verified user ID',
						},
						itemType: {
							type: 'string',
							description: 'Type of item (ticket/shop)',
							enum: ['ticket', 'shop'],
						},
						itemId: {
							type: 'string',
							description: 'ID of the item being ordered',
						},
						itemName: {
							type: 'string',
							description: 'Name of the item',
						},
						price: {
							type: 'number',
							description: 'Price of the item',
						},
						quantity: {
							type: 'number',
							description: 'Quantity to order',
							default: 1,
						},
					},
					required: ['userId', 'itemType', 'itemId', 'itemName', 'price'],
				},
			},
			{
				name: 'verify_order',
				description: 'Verify and get details of an existing order',
				inputSchema: {
					type: 'object',
					properties: {
						orderId: {
							type: 'string',
							description: 'Order ID to verify',
						},
						userEmail: {
							type: 'string',
							description: 'User email for verification',
						},
					},
					required: ['orderId'],
				},
			},
		],
	};
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	try {
		switch (name) {
			case 'get_users': {
				const limit = (args?.limit as number) || 50;
				const users = await User.find({}).limit(limit).sort({ createdAt: -1 });

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(users, null, 2),
						},
					],
				};
			}

			case 'get_user_by_id': {
				const { userId } = args as { userId: string };
				const user = await User.findById(userId);

				if (!user) {
					throw new McpError(
						ErrorCode.InvalidRequest,
						`User with ID ${userId} not found`
					);
				}

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(user, null, 2),
						},
					],
				};
			}

			case 'get_orders': {
				const limit = (args?.limit as number) || 50;
				const userId = args?.userId;

				const query = userId ? { userId } : {};
				const orders = await Order.find(query)
					.limit(limit)
					.sort({ createdAt: -1 })
					.populate('userId', 'name email chatId');

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(orders, null, 2),
						},
					],
				};
			}

			case 'get_deposits': {
				const limit = (args?.limit as number) || 50;
				const userId = args?.userId;

				const query = userId ? { userId } : {};
				const deposits = await Deposit.find(query)
					.limit(limit)
					.sort({ createdAt: -1 })
					.populate('userId', 'name email chatId');

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(deposits, null, 2),
						},
					],
				};
			}

			case 'get_server_stats': {
				const [userCount, orderCount, depositCount] = await Promise.all([
					User.countDocuments(),
					Order.countDocuments(),
					Deposit.countDocuments(),
				]);

				const recentOrders = await Order.find({})
					.limit(5)
					.sort({ createdAt: -1 })
					.populate('userId', 'name chatId');

				const stats = {
					totalUsers: userCount,
					totalOrders: orderCount,
					totalDeposits: depositCount,
					recentOrders: recentOrders,
					serverUptime: process.uptime(),
					nodeVersion: process.version,
					environment: process.env.NODE_ENV || 'development',
				};

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(stats, null, 2),
						},
					],
				};
			}

			case 'verify_user': {
				const { email, telegramId, name } = args as { 
					email?: string; 
					telegramId?: string; 
					name?: string; 
				};

				if (!email && !telegramId) {
					throw new McpError(
						ErrorCode.InvalidRequest,
						'Either email or telegramId is required for user verification'
					);
				}

				const query: any = {};
				if (email) query.email = email;
				if (telegramId) query.chatId = parseInt(telegramId);

				const user = await User.findOne(query);

				if (!user) {
					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({ 
									verified: false, 
									message: 'User not found with provided credentials' 
								}, null, 2),
							},
						],
					};
				}

				// Cross-check name if provided
				const nameMatch = !name || user.name.toLowerCase().includes(name.toLowerCase());

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								verified: true,
								nameMatch,
								user: {
									id: user._id,
									name: user.name,
									email: user.email,
									chatId: user.chatId,
									registeredAt: user.registeredAt,
									balance: user.balance,
								}
							}, null, 2),
						},
					],
				};
			}

			case 'create_order': {
				const { userId, itemType, itemId, itemName, price, quantity = 1 } = args as {
					userId: string;
					itemType: 'ticket' | 'shop';
					itemId: string;
					itemName: string;
					price: number;
					quantity?: number;
				};

				// Verify user exists
				const user = await User.findById(userId);
				if (!user) {
					throw new McpError(
						ErrorCode.InvalidRequest,
						`User with ID ${userId} not found`
					);
				}

				const order = new Order({
					userId: userId,
					itemType: itemType,
					itemId: itemId,
					itemName: itemName,
					price: price,
					quantity: quantity,
					totalAmount: price * quantity,
					status: 'pending',
					orderDate: new Date(),
				});

				const savedOrder = await order.save();
				await savedOrder.populate('userId', 'name email chatId');

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								success: true,
								order: savedOrder,
								message: `Order created successfully for ${user.name}`
							}, null, 2),
						},
					],
				};
			}

			case 'verify_order': {
				const { orderId, userEmail } = args as { 
					orderId: string; 
					userEmail?: string; 
				};

				const order = await Order.findById(orderId).populate('userId', 'name email chatId');

				if (!order) {
					throw new McpError(
						ErrorCode.InvalidRequest,
						`Order with ID ${orderId} not found`
					);
				}

				// Verify user if email provided
				const emailMatch = !userEmail || (order.userId as any).email === userEmail;

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								verified: true,
								emailMatch,
								order: order,
								customer: {
									name: (order.userId as any).name,
									email: (order.userId as any).email,
									chatId: (order.userId as any).chatId,
								}
							}, null, 2),
						},
					],
				};
			}

			default:
				throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
		}
	} catch (error) {
		if (error instanceof McpError) {
			throw error;
		}

		throw new McpError(
			ErrorCode.InternalError,
			`Error executing tool ${name}: ${error}`
		);
	}
});

// Start the server
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error('Shoq MCP server running on stdio');
}

main().catch((error) => {
	console.error('Server error:', error);
	process.exit(1);
});

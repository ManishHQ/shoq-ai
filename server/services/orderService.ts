import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import emailService from './emailService.js';
import { usdcService } from './usdcService.js';

export interface OrderRequest {
	chatId: number;
	productId: string;
	quantity: number;
	totalPrice: number;
}

export interface OrderResult {
	success: boolean;
	message: string;
	order?: any;
	error?: string;
	transactionHash?: string;
}

class OrderService {
	/**
	 * Create a new order
	 */
	async createOrder(request: OrderRequest): Promise<OrderResult> {
		try {
			// Get user
			const user = await User.findOne({ chatId: request.chatId });
			if (!user) {
				return {
					success: false,
					message: '❌ User not found. Please use /start to register.',
					error: 'User not found',
				};
			}

			// Get product
			const product = await Product.findOne({ productId: request.productId });
			if (!product) {
				return {
					success: false,
					message: '❌ Product not found.',
					error: 'Product not found',
				};
			}

			// Check if user has sufficient balance
			if (user.balance < request.totalPrice) {
				return {
					success: false,
					message: `❌ Insufficient balance. You need $${request.totalPrice} but have $${user.balance}. Please make a deposit first.`,
					error: 'Insufficient balance',
				};
			}

			// Check if product is in stock
			if (!product.inStock || product.stockQuantity < request.quantity) {
				return {
					success: false,
					message: `❌ Product is out of stock or insufficient quantity.`,
					error: 'Product out of stock',
				};
			}

			// Generate order ID
			const orderId = this.generateOrderId();

			// Create order
			const order = new Order({
				orderId,
				userId: user._id,
				items: [
					{
						productId: product.productId,
						name: product.name,
						price: product.price,
						quantity: request.quantity,
					},
				],
				totalPrice: request.totalPrice,
				status: 'pending',
			});

			await order.save();

			// Transfer USDC tokens to shop owner
			const shopOwnerAddress = process.env.SHOP_OWNER_ADDRESS;
			if (!shopOwnerAddress) {
				return {
					success: false,
					message: '❌ Shop owner address not configured.',
					error: 'Shop owner address not configured',
				};
			}

			// Perform real USDC transfer to shop owner
			console.log(
				`💰 Initiating USDC transfer: ${request.totalPrice} USDC from ${user.hederaAccountId || process.env.OPERATOR_ADDRESS!} to ${shopOwnerAddress}`
			);
			const transferResult = await usdcService.transferTokens({
				fromAccountId: user.hederaAccountId || process.env.OPERATOR_ADDRESS!,
				toAccountId: shopOwnerAddress,
				amount: request.totalPrice,
				memo: `Order #${orderId} - ${product.name}`,
			});

			if (!transferResult.success) {
				// If transfer fails, delete the order and return error
				await Order.deleteOne({ _id: order._id });
				return {
					success: false,
					message: `❌ Payment failed: ${transferResult.error}`,
					error: transferResult.error,
				};
			}

			// Update order with transaction hash and confirm status
			console.log(
				`✅ USDC transfer successful! Transaction ID: ${transferResult.transactionId}`
			);
			order.transactionHash = transferResult.transactionId;
			order.status = 'confirmed';
			await order.save();

			// Deduct balance from user
			user.balance -= request.totalPrice;
			await user.save();

			// Update product stock
			product.stockQuantity -= request.quantity;
			if (product.stockQuantity <= 0) {
				product.inStock = false;
			}
			await product.save();

			// Send confirmation emails
			await this.sendOrderEmails(user, order, product);

			return {
				success: true,
				message: `✅ Order confirmed! Order ID: #${orderId}`,
				order: order,
				transactionHash: transferResult.transactionId,
			};
		} catch (error) {
			console.error('Error creating order:', error);
			return {
				success: false,
				message: '❌ Error processing order. Please try again.',
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Get order by order ID
	 */
	async getOrder(orderId: string): Promise<any | null> {
		try {
			const order = await Order.findOne({ orderId }).populate('userId');
			return order;
		} catch (error) {
			console.error('Error getting order:', error);
			return null;
		}
	}

	/**
	 * Get order by MongoDB _id
	 */
	async getOrderById(id: string): Promise<any | null> {
		try {
			const order = await Order.findById(id).populate('userId');
			return order;
		} catch (error) {
			console.error('Error getting order by ID:', error);
			return null;
		}
	}

	/**
	 * Get orders for a user
	 */
	async getUserOrders(chatId: number, limit: number = 10): Promise<any[]> {
		try {
			const user = await User.findOne({ chatId });
			if (!user) {
				return [];
			}

			const orders = await Order.find({ userId: user._id })
				.sort({ createdAt: -1 })
				.limit(limit);

			return orders;
		} catch (error) {
			console.error('Error getting user orders:', error);
			return [];
		}
	}

	/**
	 * Update order status
	 */
	async updateOrderStatus(
		orderId: string,
		status: 'confirmed' | 'pending' | 'cancelled' | 'delivered'
	): Promise<boolean> {
		try {
			const result = await Order.updateOne({ orderId }, { status });
			return result.modifiedCount > 0;
		} catch (error) {
			console.error('Error updating order status:', error);
			return false;
		}
	}

	/**
	 * Generate unique order ID
	 */
	private generateOrderId(): string {
		const timestamp = Date.now().toString();
		const random = Math.floor(Math.random() * 1000)
			.toString()
			.padStart(3, '0');
		return timestamp.slice(-6) + random;
	}

	/**
	 * Send order confirmation emails using AI-powered email service
	 */
	private async sendOrderEmails(
		user: any,
		order: any,
		product: any
	): Promise<void> {
		try {
			// Prepare email data
			const emailData = {
				user: {
					name: user.name,
					email: user.email,
					username: user.username,
					chatId: user.chatId,
				},
				order: {
					orderId: order.orderId,
					_id: order._id,
					items: order.items,
					totalPrice: order.totalPrice,
					status: order.status,
					transactionHash: order.transactionHash,
					createdAt: order.createdAt,
				},
				product: {
					name: product.name,
					description: product.description,
					category: product.category,
					image: product.images?.[0],
				},
			};

			// Send customer email (if email exists)
			if (user.email) {
				const customerEmailSent =
					await emailService.sendOrderConfirmationEmail(emailData);
				if (!customerEmailSent) {
					console.log('⚠️ Customer email not sent - continuing with order');
				}
			}

			// Send fulfillment email to staff
			const fulfillmentEmailSent =
				await emailService.sendFulfillmentEmail(emailData);
			if (!fulfillmentEmailSent) {
				console.log('⚠️ Fulfillment email not sent - continuing with order');
			}
		} catch (error) {
			console.error('Error sending order emails:', error);
			// Don't throw error, as order was already created successfully
		}
	}

	/**
	 * Cancel an order
	 */
	async cancelOrder(orderId: string, chatId: number): Promise<OrderResult> {
		try {
			const user = await User.findOne({ chatId });
			if (!user) {
				return {
					success: false,
					message: '❌ User not found.',
					error: 'User not found',
				};
			}

			const order = await Order.findOne({ orderId, userId: user._id });
			if (!order) {
				return {
					success: false,
					message: '❌ Order not found.',
					error: 'Order not found',
				};
			}

			if (order.status === 'delivered') {
				return {
					success: false,
					message: '❌ Cannot cancel a delivered order.',
					error: 'Order already delivered',
				};
			}

			// Update order status
			order.status = 'cancelled';
			await order.save();

			// Refund the balance
			user.balance += order.totalPrice;
			await user.save();

			return {
				success: true,
				message: `✅ Order #${orderId} has been cancelled. $${order.totalPrice} has been refunded to your balance.`,
				order: order,
			};
		} catch (error) {
			console.error('Error cancelling order:', error);
			return {
				success: false,
				message: '❌ Error cancelling order. Please try again.',
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}
}

export const orderService = new OrderService();
export default orderService;

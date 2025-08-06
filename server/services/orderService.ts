import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import { sendEmail } from '../utils/sendEmail.js';

export interface OrderRequest {
	chatId: number;
	item: string;
	quantity: number;
	totalPrice: number;
}

export interface OrderResult {
	success: boolean;
	message: string;
	order?: any;
	error?: string;
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
					error: 'User not found'
				};
			}

			// Check if user has sufficient balance
			if (user.balance < request.totalPrice) {
				return {
					success: false,
					message: `❌ Insufficient balance. You need $${request.totalPrice} but have $${user.balance}. Please make a deposit first.`,
					error: 'Insufficient balance'
				};
			}

			// Generate order ID
			const orderId = this.generateOrderId();

			// Create order
			const order = new Order({
				orderId,
				userId: user._id,
				item: request.item,
				quantity: request.quantity,
				totalPrice: request.totalPrice,
				status: 'confirmed',
			});

			await order.save();

			// Deduct balance from user
			user.balance -= request.totalPrice;
			await user.save();

			// Send confirmation emails
			await this.sendOrderEmails(user, order);

			return {
				success: true,
				message: `✅ Order confirmed! Order ID: #${orderId}`,
				order: order
			};

		} catch (error) {
			console.error('Error creating order:', error);
			return {
				success: false,
				message: '❌ Error processing order. Please try again.',
				error: error instanceof Error ? error.message : 'Unknown error'
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
	async updateOrderStatus(orderId: string, status: 'confirmed' | 'pending' | 'cancelled' | 'delivered'): Promise<boolean> {
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
		const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
		return timestamp.slice(-6) + random;
	}

	/**
	 * Send order confirmation emails
	 */
	private async sendOrderEmails(user: any, order: any): Promise<void> {
		try {
			// Customer email (if email exists)
			if (user.email) {
				const customerEmailHtml = `
					<h2>Order Confirmation</h2>
					<p>Hi ${user.name},</p>
					<p>Your order has been confirmed!</p>
					<div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
						<h3>Order Details</h3>
						<p><strong>Order ID:</strong> #${order.orderId}</p>
						<p><strong>Item:</strong> ${order.item}</p>
						<p><strong>Quantity:</strong> ${order.quantity}</p>
						<p><strong>Total:</strong> $${order.totalPrice}</p>
						<p><strong>Status:</strong> ${order.status}</p>
					</div>
					<p>You can view your order at: <a href="${process.env.FRONTEND_URL}/order/${order.orderId}">View Order</a></p>
					<p>Thank you for using Shoq!</p>
				`;

				await sendEmail({
					to: user.email,
					subject: `Order Confirmation #${order.orderId}`,
					html: customerEmailHtml,
				});
			}

			// Fulfillment email to Shoq staff
			const fulfillmentEmailHtml = `
				<h2>New Order for Fulfillment</h2>
				<div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
					<h3>Order Details</h3>
					<p><strong>Order ID:</strong> #${order.orderId}</p>
					<p><strong>Customer:</strong> ${user.name} (@${user.username})</p>
					<p><strong>Chat ID:</strong> ${user.chatId}</p>
					<p><strong>Item:</strong> ${order.item}</p>
					<p><strong>Quantity:</strong> ${order.quantity}</p>
					<p><strong>Total:</strong> $${order.totalPrice}</p>
					<p><strong>Status:</strong> ${order.status}</p>
					<p><strong>Order Date:</strong> ${order.createdAt}</p>
				</div>
				<p><strong>Action Required:</strong> Please fulfill this order and update the status accordingly.</p>
			`;

			const fulfillmentEmail = process.env.FULFILLMENT_EMAIL || 'orders@shoq.me';
			await sendEmail({
				to: fulfillmentEmail,
				subject: `New Order #${order.orderId} - Action Required`,
				html: fulfillmentEmailHtml,
			});

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
					error: 'User not found'
				};
			}

			const order = await Order.findOne({ orderId, userId: user._id });
			if (!order) {
				return {
					success: false,
					message: '❌ Order not found.',
					error: 'Order not found'
				};
			}

			if (order.status === 'delivered') {
				return {
					success: false,
					message: '❌ Cannot cancel a delivered order.',
					error: 'Order already delivered'
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
				order: order
			};

		} catch (error) {
			console.error('Error cancelling order:', error);
			return {
				success: false,
				message: '❌ Error cancelling order. Please try again.',
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}
}

export const orderService = new OrderService();
export default orderService;
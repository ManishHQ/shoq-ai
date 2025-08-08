import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import { sendEmail } from '../utils/sendEmail.js';

export interface PurchaseRequest {
	// User identification - at least one required
	walletAddress?: string;
	chatId?: number;
	email?: string;
	
	// User details for onboarding (if needed)
	name?: string;
	username?: string;
	
	// Order details
	items: Array<{
		productId: string;
		name: string;
		description: string;
		category: 'product' | 'ticket';
		price: number;
		quantity: number;
		sku?: string;
		image?: string;
	}>;
	
	shippingAddress: {
		street: string;
		city: string;
		state: string;
		zipCode: string;
		country: string;
	};
	
	payment: {
		method: 'usdc_wallet' | 'card' | 'crypto';
		transactionHash?: string;
		amount: number;
		currency: string;
	};
	
	subtotal: number;
	shipping: number;
	tax: number;
	discount: number;
	totalPrice: number;
	notes?: string;
	
	// Source identification
	source: 'telegram' | 'claude' | 'webapp';
}

export interface PurchaseResult {
	success: boolean;
	message: string;
	order?: any;
	user?: any;
	isNewUser?: boolean;
	error?: string;
}

class PurchaseService {
	/**
	 * Process purchase with automatic user onboarding
	 */
	async processPurchase(request: PurchaseRequest): Promise<PurchaseResult> {
		try {
			// 1. Validate request
			const validation = this.validatePurchaseRequest(request);
			if (!validation.valid) {
				return {
					success: false,
					message: validation.message,
					error: 'Validation error'
				};
			}

			// 2. Find or create user
			const userResult = await this.findOrCreateUser(request);
			if (!userResult.success) {
				return {
					success: false,
					message: userResult.message,
					error: userResult.error
				};
			}

			const { user, isNewUser } = userResult;

			// 3. Check payment validation (if required)
			if (request.payment.method === 'usdc_wallet' && request.payment.transactionHash) {
				const paymentValid = await this.validatePayment(request.payment);
				if (!paymentValid) {
					return {
						success: false,
						message: 'Payment validation failed. Please check your transaction hash.',
						error: 'Invalid payment'
					};
				}
			}

			// 4. Create order
			const order = await this.createOrder(user, request);
			if (!order) {
				return {
					success: false,
					message: 'Failed to create order. Please try again.',
					error: 'Order creation failed'
				};
			}

			// 5. Send notifications
			await this.sendOrderNotifications(user, order, isNewUser);

			return {
				success: true,
				message: `✅ Order created successfully! Order ID: #${order.orderId}`,
				order,
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					onboardingMethod: user.onboardingMethod
				},
				isNewUser
			};

		} catch (error) {
			console.error('Purchase processing error:', error);
			return {
				success: false,
				message: '❌ Error processing purchase. Please try again.',
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Validate purchase request
	 */
	private validatePurchaseRequest(request: PurchaseRequest): { valid: boolean; message: string } {
		// Check if at least one user identifier is provided
		if (!request.walletAddress && !request.chatId && !request.email) {
			return {
				valid: false,
				message: 'At least one user identifier (wallet, chatId, or email) is required'
			};
		}

		// Validate wallet address format if provided
		if (request.walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(request.walletAddress)) {
			return {
				valid: false,
				message: 'Invalid wallet address format'
			};
		}

		// Validate email format if provided
		if (request.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
			return {
				valid: false,
				message: 'Invalid email address format'
			};
		}

		// Validate order items
		if (!request.items || request.items.length === 0) {
			return {
				valid: false,
				message: 'Order must contain at least one item'
			};
		}

		// Validate payment amount matches total
		if (Math.abs(request.payment.amount - request.totalPrice) > 0.01) {
			return {
				valid: false,
				message: 'Payment amount does not match total price'
			};
		}

		// Validate total price calculation
		const calculatedTotal = request.subtotal + request.shipping + request.tax - request.discount;
		if (Math.abs(calculatedTotal - request.totalPrice) > 0.01) {
			return {
				valid: false,
				message: 'Total price calculation is incorrect'
			};
		}

		return { valid: true, message: 'Valid' };
	}

	/**
	 * Find existing user or create new one
	 */
	private async findOrCreateUser(request: PurchaseRequest): Promise<{
		success: boolean;
		user?: any;
		isNewUser?: boolean;
		message?: string;
		error?: string;
	}> {
		try {
			// Try to find existing user
			let existingUser = null;

			if (request.walletAddress) {
				existingUser = await User.findOne({ walletAddress: request.walletAddress });
			}
			
			if (!existingUser && request.chatId) {
				existingUser = await User.findOne({ chatId: request.chatId });
			}
			
			if (!existingUser && request.email) {
				existingUser = await User.findOne({ email: request.email });
			}

			if (existingUser) {
				// Update user info if new details provided
				let updated = false;
				
				if (request.name && request.name !== existingUser.name) {
					existingUser.name = request.name;
					updated = true;
				}
				
				if (request.email && request.email !== existingUser.email && request.source !== 'telegram') {
					existingUser.email = request.email;
					updated = true;
				}
				
				if (request.walletAddress && !existingUser.walletAddress) {
					existingUser.walletAddress = request.walletAddress;
					updated = true;
				}

				if (updated) {
					await existingUser.save();
				}

				return {
					success: true,
					user: existingUser,
					isNewUser: false
				};
			}

			// Create new user
			const onboardingMethod = this.determineOnboardingMethod(request);
			
			const userData: any = {
				name: request.name || this.generateDefaultName(request),
				username: request.username || this.generateUsername(request),
				onboardingMethod,
				emailNotifications: true,
				isVerified: onboardingMethod === 'wallet', // Wallet users are auto-verified
			};

			// Set required fields based on onboarding method
			if (onboardingMethod === 'wallet' && request.walletAddress) {
				userData.walletAddress = request.walletAddress;
				if (request.email) {
					userData.email = request.email;
				}
			}

			if (onboardingMethod === 'telegram' && request.chatId) {
				userData.chatId = request.chatId;
			}

			if (onboardingMethod === 'ai' && request.email) {
				userData.email = request.email;
			}

			const newUser = new User(userData);
			await newUser.save();

			return {
				success: true,
				user: newUser,
				isNewUser: true
			};

		} catch (error) {
			console.error('User creation/lookup error:', error);
			
			if (error.code === 11000) {
				const field = Object.keys(error.keyPattern)[0];
				return {
					success: false,
					message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
					error: 'Duplicate user'
				};
			}

			return {
				success: false,
				message: 'Error processing user information',
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Determine onboarding method based on request
	 */
	private determineOnboardingMethod(request: PurchaseRequest): 'telegram' | 'wallet' | 'ai' {
		if (request.source === 'telegram' || request.chatId) {
			return 'telegram';
		}
		
		if (request.walletAddress) {
			return 'wallet';
		}
		
		return 'ai'; // Default for Claude/AI purchases
	}

	/**
	 * Generate default name based on available info
	 */
	private generateDefaultName(request: PurchaseRequest): string {
		if (request.name) return request.name;
		if (request.username) return request.username;
		if (request.email) return request.email.split('@')[0];
		if (request.walletAddress) return `User_${request.walletAddress.slice(-6)}`;
		if (request.chatId) return `Telegram_${request.chatId}`;
		return `User_${Date.now()}`;
	}

	/**
	 * Generate username based on available info
	 */
	private generateUsername(request: PurchaseRequest): string {
		if (request.username) return request.username;
		if (request.walletAddress) return request.walletAddress;
		if (request.chatId) return `tg_${request.chatId}`;
		if (request.email) return request.email.split('@')[0] + '_' + Date.now();
		return `user_${Date.now()}`;
	}

	/**
	 * Validate payment (basic validation - extend as needed)
	 */
	private async validatePayment(payment: any): Promise<boolean> {
		// For now, just check if transaction hash has valid format
		if (payment.transactionHash && payment.transactionHash.length < 10) {
			return false;
		}
		
		// TODO: Add actual blockchain validation here
		// - Check if transaction exists
		// - Verify amount
		// - Check recipient address
		
		return true;
	}

	/**
	 * Create order in database
	 */
	private async createOrder(user: any, request: PurchaseRequest): Promise<any> {
		try {
			const orderId = this.generateOrderId();

			const order = new Order({
				orderId,
				userId: user._id,
				items: request.items,
				shippingAddress: request.shippingAddress,
				payment: {
					...request.payment,
					status: request.payment.transactionHash ? 'confirmed' : 'pending'
				},
				subtotal: request.subtotal,
				shipping: request.shipping,
				tax: request.tax,
				discount: request.discount,
				totalPrice: request.totalPrice,
				status: request.payment.transactionHash ? 'confirmed' : 'pending',
				notes: request.notes,
			});

			await order.save();
			return order;

		} catch (error) {
			console.error('Order creation error:', error);
			return null;
		}
	}

	/**
	 * Generate unique order ID
	 */
	private generateOrderId(): string {
		const timestamp = Date.now().toString();
		const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
		return `SHQ-${new Date().getFullYear()}-${timestamp.slice(-6)}${random}`;
	}

	/**
	 * Send order notifications
	 */
	private async sendOrderNotifications(user: any, order: any, isNewUser: boolean): Promise<void> {
		try {
			// Welcome email for new users
			if (isNewUser && user.email) {
				await this.sendWelcomeEmail(user);
			}

			// Order confirmation email
			if (user.email) {
				await this.sendOrderConfirmationEmail(user, order);
			}

			// Admin notification
			await this.sendAdminOrderNotification(user, order, isNewUser);

		} catch (error) {
			console.error('Error sending notifications:', error);
		}
	}

	/**
	 * Send welcome email to new users
	 */
	private async sendWelcomeEmail(user: any): Promise<void> {
		const welcomeHtml = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h1 style="color: #6366f1; text-align: center;">Welcome to Shoq! 🎉</h1>
				<p>Hi ${user.name},</p>
				<p>Welcome to Shoq! We're excited to have you as part of our community.</p>
				
				<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<h3>Your Account Details:</h3>
					<p><strong>Name:</strong> ${user.name}</p>
					<p><strong>Email:</strong> ${user.email || 'Not provided'}</p>
					<p><strong>Onboarding Method:</strong> ${user.onboardingMethod}</p>
					<p><strong>Account Created:</strong> ${new Date().toLocaleDateString()}</p>
				</div>
				
				<p>You can now:</p>
				<ul>
					<li>📦 Track your orders</li>
					<li>🛍️ Browse our marketplace</li>
					<li>💳 Manage your payments</li>
					<li>📧 Receive order updates</li>
				</ul>
				
				<p>If you have any questions, feel free to reach out to our support team.</p>
				<p>Happy shopping!</p>
				
				<hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
				<p style="text-align: center; color: #64748b; font-size: 14px;">
					This email was sent by Shoq AI • Powered by secure blockchain transactions
				</p>
			</div>
		`;

		await sendEmail({
			to: user.email,
			subject: '🎉 Welcome to Shoq! Your account is ready',
			html: welcomeHtml,
		});
	}

	/**
	 * Send order confirmation email
	 */
	private async sendOrderConfirmationEmail(user: any, order: any): Promise<void> {
		const orderHtml = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h1 style="color: #6366f1; text-align: center;">Order Confirmation ✅</h1>
				<p>Hi ${user.name},</p>
				<p>Your order has been confirmed and is being processed!</p>
				
				<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<h3>Order Details</h3>
					<p><strong>Order ID:</strong> #${order.orderId}</p>
					<p><strong>Status:</strong> ${order.status}</p>
					<p><strong>Total:</strong> $${order.totalPrice.toFixed(2)}</p>
					<p><strong>Payment Method:</strong> ${order.payment.method.replace('_', ' ').toUpperCase()}</p>
					${order.payment.transactionHash ? `<p><strong>Transaction:</strong> <code>${order.payment.transactionHash}</code></p>` : ''}
				</div>

				<div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
					<h3>Items Ordered</h3>
					${order.items.map(item => `
						<div style="border-bottom: 1px solid #f1f5f9; padding: 10px 0;">
							<p><strong>${item.name}</strong></p>
							<p style="color: #64748b;">${item.description}</p>
							<p>Quantity: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}</p>
						</div>
					`).join('')}
				</div>

				<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<h3>Shipping Address</h3>
					<p>${order.shippingAddress.street}<br>
					${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
					${order.shippingAddress.country}</p>
				</div>

				<p>You can track your order status anytime by visiting your account dashboard.</p>
				
				<div style="text-align: center; margin: 30px 0;">
					<a href="${process.env.FRONTEND_URL}/orders/${order._id}" 
						 style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
						Track Your Order
					</a>
				</div>

				<p>Thank you for choosing Shoq!</p>
				
				<hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
				<p style="text-align: center; color: #64748b; font-size: 14px;">
					This email was sent by Shoq AI • Powered by secure blockchain transactions
				</p>
			</div>
		`;

		await sendEmail({
			to: user.email,
			subject: `Order Confirmation #${order.orderId}`,
			html: orderHtml,
		});
	}

	/**
	 * Send admin notification
	 */
	private async sendAdminOrderNotification(user: any, order: any, isNewUser: boolean): Promise<void> {
		const adminHtml = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h1 style="color: #dc2626;">🚨 New Order Alert</h1>
				${isNewUser ? '<p style="color: #059669; font-weight: bold;">👤 NEW CUSTOMER!</p>' : ''}
				
				<div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<h3>⚡ Action Required</h3>
					<p>New order requires fulfillment and processing.</p>
				</div>

				<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<h3>Order Information</h3>
					<p><strong>Order ID:</strong> #${order.orderId}</p>
					<p><strong>Total:</strong> $${order.totalPrice.toFixed(2)}</p>
					<p><strong>Status:</strong> ${order.status}</p>
					<p><strong>Payment:</strong> ${order.payment.method} ${order.payment.transactionHash ? '(Confirmed)' : '(Pending)'}</p>
					<p><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
				</div>

				<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<h3>Customer Information</h3>
					<p><strong>Name:</strong> ${user.name}</p>
					<p><strong>Email:</strong> ${user.email || 'Not provided'}</p>
					<p><strong>Source:</strong> ${user.onboardingMethod}</p>
					${user.walletAddress ? `<p><strong>Wallet:</strong> <code>${user.walletAddress}</code></p>` : ''}
					${user.chatId ? `<p><strong>Telegram:</strong> ${user.chatId}</p>` : ''}
					${isNewUser ? '<p><strong>🆕 NEW USER</strong> - First order!</p>' : ''}
				</div>

				<div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
					<h3>Items to Fulfill</h3>
					${order.items.map(item => `
						<div style="border-bottom: 1px solid #f1f5f9; padding: 10px 0;">
							<p><strong>${item.name}</strong> (${item.category})</p>
							<p style="color: #64748b;">${item.description}</p>
							<p>SKU: ${item.sku || 'N/A'} | Qty: ${item.quantity} | Price: $${item.price.toFixed(2)}</p>
						</div>
					`).join('')}
				</div>

				<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<h3>Shipping Information</h3>
					<p><strong>Address:</strong><br>
					${order.shippingAddress.street}<br>
					${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
					${order.shippingAddress.country}</p>
					${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
				</div>

				<div style="text-align: center; margin: 30px 0;">
					<p><strong>Next Steps:</strong></p>
					<ol style="text-align: left; display: inline-block;">
						<li>Verify payment if needed</li>
						<li>Prepare items for shipping</li>
						<li>Update order status to "processing"</li>
						<li>Generate tracking number</li>
						<li>Ship and mark as "shipped"</li>
					</ol>
				</div>
			</div>
		`;

		const fulfillmentEmail = process.env.FULFILLMENT_EMAIL || 'orders@shoq.me';
		await sendEmail({
			to: fulfillmentEmail,
			subject: `🚨 New Order #${order.orderId} - ${isNewUser ? 'NEW CUSTOMER' : 'Action Required'}`,
			html: adminHtml,
		});
	}

	/**
	 * Get purchase status
	 */
	async getPurchaseStatus(orderId: string): Promise<any> {
		try {
			const order = await Order.findOne({ orderId }).populate('userId');
			return order;
		} catch (error) {
			console.error('Error getting purchase status:', error);
			return null;
		}
	}
}

export const purchaseService = new PurchaseService();
export default purchaseService;
import { sendEmail } from '../utils/sendEmail.js';
import GeminiService from './geminiService.js';

export interface EmailTemplate {
	subject: string;
	html: string;
	text?: string;
}

export interface OrderEmailData {
	user: {
		name: string;
		email: string;
		username?: string;
		chatId: number;
	};
	order: {
		orderId: string;
		_id: string;
		items: Array<{
			name: string;
			quantity: number;
			price: number;
		}>;
		totalPrice: number;
		status: string;
		transactionHash?: string;
		createdAt: Date;
	};
	product: {
		name: string;
		description?: string;
		category: string;
		image?: string;
	};
}

export interface WelcomeEmailData {
	user: {
		name: string;
		email: string;
		username?: string;
		chatId: number;
	};
	onboardingMethod: 'telegram' | 'wallet' | 'email';
}

class EmailService {
	private geminiService: GeminiService;

	constructor() {
		this.geminiService = new GeminiService();
	}

	/**
	 * Generate AI-powered order confirmation email
	 */
	async generateOrderConfirmationEmail(
		data: OrderEmailData
	): Promise<EmailTemplate> {
		const prompt = `
		You are an email generation assistant for Shoq Store. Generate a personalized order confirmation email.
		
		Customer Details:
		- Name: ${data.user.name}
		- Username: ${data.user.username || 'N/A'}
		
		Order Details:
		- Order ID: #${data.order.orderId}
		- Product: ${data.product.name}
		- Category: ${data.product.category}
		- Quantity: ${data.order.items[0].quantity}
		- Total: $${data.order.totalPrice}
		- Status: ${data.order.status}
		- Transaction Hash: ${data.order.transactionHash || 'N/A'}
		- Order Date: ${data.order.createdAt.toLocaleDateString()}
		
		Requirements:
		1. Make it personal and friendly
		2. Include all order details in a clean format
		3. Add a link to view order: ${process.env.FRONTEND_URL}/orders/${data.order._id}
		4. Include transaction hash for blockchain verification
		5. Add a call-to-action to continue shopping
		6. Use professional but warm tone
		7. Include Shoq Store branding
		8. Make it mobile-friendly HTML
		
		IMPORTANT: You must respond with ONLY valid JSON in this exact format:
		{
			"subject": "Your order confirmation subject line",
			"html": "<html>Your email HTML content</html>"
		}
		
		Do not include any other text, explanations, or formatting outside the JSON object.
		`;

		try {
			const response = await this.geminiService.processMessage(prompt, 0); // Pass userId as 0 for system emails
			
			// Try to parse the message as JSON first
			try {
				const emailData = JSON.parse(response.message);
				return {
					subject: emailData.subject,
					html: emailData.html,
				};
			} catch (parseError) {
				// If parsing fails, the AI might have returned a plain text response
				console.log('AI returned plain text, using fallback template');
				return this.getDefaultOrderConfirmationEmail(data);
			}
		} catch (error) {
			console.error('Error generating AI email:', error);
			// Fallback to default template
			return this.getDefaultOrderConfirmationEmail(data);
		}
	}

	/**
	 * Generate AI-powered welcome email
	 */
	async generateWelcomeEmail(data: WelcomeEmailData): Promise<EmailTemplate> {
		const prompt = `
		You are an email generation assistant for Shoq Store. Generate a personalized welcome email.
		
		Customer Details:
		- Name: ${data.user.name}
		- Username: ${data.user.username || 'N/A'}
		- Onboarding Method: ${data.onboardingMethod}
		
		Requirements:
		1. Welcome them warmly to Shoq Store
		2. Mention their onboarding method (Telegram bot, wallet connection, or email)
		3. Explain what Shoq Store offers (e-commerce with USDC payments)
		4. Include links to:
		   - Shop: ${process.env.FRONTEND_URL}/shop
		   - Chat with bot: https://t.me/your_bot_username
		   - View orders: ${process.env.FRONTEND_URL}/orders
		5. Add a special welcome discount or offer
		6. Use professional but friendly tone
		7. Include Shoq Store branding
		8. Make it mobile-friendly HTML
		
		IMPORTANT: You must respond with ONLY valid JSON in this exact format:
		{
			"subject": "Your welcome email subject line",
			"html": "<html>Your email HTML content</html>"
		}
		
		Do not include any other text, explanations, or formatting outside the JSON object.
		`;

		try {
			const response = await this.geminiService.processMessage(prompt, 0); // Pass userId as 0 for system emails
			
			// Try to parse the message as JSON first
			try {
				const emailData = JSON.parse(response.message);
				return {
					subject: emailData.subject,
					html: emailData.html,
				};
			} catch (parseError) {
				// If parsing fails, the AI might have returned a plain text response
				console.log('AI returned plain text, using fallback template');
				return this.getDefaultWelcomeEmail(data);
			}
		} catch (error) {
			console.error('Error generating AI welcome email:', error);
			// Fallback to default template
			return this.getDefaultWelcomeEmail(data);
		}
	}

	/**
	 * Send order confirmation email with AI-generated content
	 */
	async sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
		try {
			const emailTemplate = await this.generateOrderConfirmationEmail(data);

			return await sendEmail({
				to: data.user.email,
				subject: emailTemplate.subject,
				html: emailTemplate.html,
			});
		} catch (error) {
			console.error('Error sending order confirmation email:', error);
			return false;
		}
	}

	/**
	 * Send welcome email with AI-generated content
	 */
	async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
		try {
			const emailTemplate = await this.generateWelcomeEmail(data);

			return await sendEmail({
				to: data.user.email,
				subject: emailTemplate.subject,
				html: emailTemplate.html,
			});
		} catch (error) {
			console.error('Error sending welcome email:', error);
			return false;
		}
	}

	/**
	 * Send fulfillment notification to staff
	 */
	async sendFulfillmentEmail(data: OrderEmailData): Promise<boolean> {
		try {
			const fulfillmentEmail =
				process.env.FULFILLMENT_EMAIL || 'orders@shoq.me';

			const html = `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #6366f1;">🛍️ New Order for Fulfillment</h2>
					
					<div style="border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 8px;">
						<h3 style="color: #374151;">Order Details</h3>
						<p><strong>Order ID:</strong> #${data.order.orderId}</p>
						<p><strong>Customer:</strong> ${data.user.name} ${data.user.username ? `(@${data.user.username})` : ''}</p>
						<p><strong>Chat ID:</strong> ${data.user.chatId}</p>
						<p><strong>Email:</strong> ${data.user.email}</p>
						<p><strong>Product:</strong> ${data.product.name}</p>
						<p><strong>Category:</strong> ${data.product.category}</p>
						<p><strong>Quantity:</strong> ${data.order.items[0].quantity}</p>
						<p><strong>Total:</strong> $${data.order.totalPrice}</p>
						<p><strong>Status:</strong> ${data.order.status}</p>
						<p><strong>Transaction Hash:</strong> ${data.order.transactionHash || 'N/A'}</p>
						<p><strong>Order Date:</strong> ${data.order.createdAt.toLocaleDateString()}</p>
					</div>
					
					<div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
						<p style="margin: 0; color: #92400e;"><strong>⚠️ Action Required:</strong> Please fulfill this order and update the status accordingly.</p>
					</div>
					
					<p style="color: #6b7280; font-size: 14px;">
						This is an automated notification from Shoq Store.
					</p>
				</div>
			`;

			return await sendEmail({
				to: fulfillmentEmail,
				subject: `🛍️ New Order #${data.order.orderId} - Action Required`,
				html: html,
			});
		} catch (error) {
			console.error('Error sending fulfillment email:', error);
			return false;
		}
	}

	/**
	 * Default order confirmation email template (fallback)
	 */
	private getDefaultOrderConfirmationEmail(
		data: OrderEmailData
	): EmailTemplate {
		return {
			subject: `🎉 Order Confirmed! #${data.order.orderId}`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #6366f1;">🎉 Order Confirmed!</h2>
					
					<p>Hi ${data.user.name},</p>
					
					<p>Thank you for your order! We're excited to confirm that your purchase has been successfully processed.</p>
					
					<div style="border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 8px;">
						<h3 style="color: #374151;">Order Details</h3>
						<p><strong>Order ID:</strong> #${data.order.orderId}</p>
						<p><strong>Product:</strong> ${data.product.name}</p>
						<p><strong>Category:</strong> ${data.product.category}</p>
						<p><strong>Quantity:</strong> ${data.order.items[0].quantity}</p>
						<p><strong>Total:</strong> $${data.order.totalPrice}</p>
						<p><strong>Status:</strong> ${data.order.status}</p>
						<p><strong>Transaction Hash:</strong> ${data.order.transactionHash || 'N/A'}</p>
						<p><strong>Order Date:</strong> ${data.order.createdAt.toLocaleDateString()}</p>
					</div>
					
					<div style="text-align: center; margin: 30px 0;">
						<a href="${process.env.FRONTEND_URL}/orders/${data.order._id}" 
						   style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
							📋 View Order Details
						</a>
					</div>
					
					<p>We'll keep you updated on your order status. You can track your order anytime through our platform.</p>
					
					<p>Happy shopping!<br>
					<strong>The Shoq Store Team</strong></p>
					
					<hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
					<p style="color: #6b7280; font-size: 14px;">
						Questions? Contact us at support@shoq.me
					</p>
				</div>
			`,
		};
	}

	/**
	 * Default welcome email template (fallback)
	 */
	private getDefaultWelcomeEmail(data: WelcomeEmailData): EmailTemplate {
		return {
			subject: `🎉 Welcome to Shoq Store, ${data.user.name}!`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #6366f1;">🎉 Welcome to Shoq Store!</h2>
					
					<p>Hi ${data.user.name},</p>
					
					<p>Welcome to Shoq Store! We're thrilled to have you join our community of shoppers who love seamless e-commerce with USDC payments.</p>
					
					<div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3 style="color: #0369a1;">🎁 Special Welcome Offer</h3>
						<p>As a new customer, enjoy <strong>10% off</strong> your first order! Use code: <strong>WELCOME10</strong></p>
					</div>
					
					<h3 style="color: #374151;">What's Next?</h3>
					<ul>
						<li>🛍️ <a href="${process.env.FRONTEND_URL}/shop" style="color: #6366f1;">Browse our products</a></li>
						<li>💬 <a href="https://t.me/your_bot_username" style="color: #6366f1;">Chat with our AI assistant</a></li>
						<li>📋 <a href="${process.env.FRONTEND_URL}/orders" style="color: #6366f1;">Track your orders</a></li>
					</ul>
					
					<div style="text-align: center; margin: 30px 0;">
						<a href="${process.env.FRONTEND_URL}/shop" 
						   style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
							🛍️ Start Shopping
						</a>
					</div>
					
					<p>We're here to make your shopping experience amazing!</p>
					
					<p>Best regards,<br>
					<strong>The Shoq Store Team</strong></p>
					
					<hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
					<p style="color: #6b7280; font-size: 14px;">
						Questions? Contact us at support@shoq.me
					</p>
				</div>
			`,
		};
	}
}

export default new EmailService();

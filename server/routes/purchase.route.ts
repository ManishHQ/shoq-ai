import express, { Request, Response } from 'express';
import {
	purchaseService,
	PurchaseRequest,
} from '../services/purchaseService.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

/**
 * Process purchase with automatic user onboarding
 * POST /api/purchase
 */
router.post(
	'/',
	catchAsync(async (req: Request, res: Response) => {
		try {
			const purchaseRequest: PurchaseRequest = req.body;

			// Validate required fields
			if (!purchaseRequest.items || purchaseRequest.items.length === 0) {
				return res.status(400).json({
					success: false,
					message: 'Items are required for purchase',
				});
			}

			if (!purchaseRequest.shippingAddress) {
				return res.status(400).json({
					success: false,
					message: 'Shipping address is required',
				});
			}

			if (!purchaseRequest.payment) {
				return res.status(400).json({
					success: false,
					message: 'Payment information is required',
				});
			}

			// Process the purchase
			const result = await purchaseService.processPurchase(purchaseRequest);

			if (result.success) {
				res.status(201).json({
					success: true,
					message: result.message,
					data: {
						order: {
							id: result.order._id,
							orderId: result.order.orderId,
							status: result.order.status,
							totalPrice: result.order.totalPrice,
							items: result.order.items,
							createdAt: result.order.createdAt,
						},
						user: result.user,
						isNewUser: result.isNewUser,
					},
				});
			} else {
				res.status(400).json({
					success: false,
					message: result.message,
					error: result.error,
				});
			}
		} catch (error) {
			console.error('Purchase API error:', error);
			res.status(500).json({
				success: false,
				message: 'Internal server error during purchase',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	})
);

/**
 * Get purchase/order status
 * GET /api/purchase/:orderId
 */
router.get(
	'/:orderId',
	catchAsync(async (req: Request, res: Response) => {
		try {
			const { orderId } = req.params;

			const order = await purchaseService.getPurchaseStatus(orderId);

			if (!order) {
				return res.status(404).json({
					success: false,
					message: 'Order not found',
				});
			}

			res.status(200).json({
				success: true,
				data: {
					order: {
						id: order._id,
						orderId: order.orderId,
						status: order.status,
						items: order.items,
						shippingAddress: order.shippingAddress,
						payment: {
							method: order.payment.method,
							status: order.payment.status,
							amount: order.payment.amount,
							currency: order.payment.currency,
						},
						subtotal: order.subtotal,
						shipping: order.shipping,
						tax: order.tax,
						discount: order.discount,
						totalPrice: order.totalPrice,
						trackingNumber: order.trackingNumber,
						estimatedDelivery: order.estimatedDelivery,
						notes: order.notes,
						createdAt: order.createdAt,
						updatedAt: order.updatedAt,
					},
					customer: {
						name: order.userId.name,
						email: order.userId.email,
						onboardingMethod: order.userId.onboardingMethod,
					},
				},
			});
		} catch (error) {
			console.error('Get order API error:', error);
			res.status(500).json({
				success: false,
				message: 'Internal server error while fetching order',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	})
);

/**
 * Quick user check endpoint
 * POST /api/purchase/check-user
 */
router.post(
	'/check-user',
	catchAsync(async (req: Request, res: Response) => {
		try {
			const { walletAddress, chatId, email } = req.body;

			if (!walletAddress && !chatId && !email) {
				return res.status(400).json({
					success: false,
					message:
						'At least one identifier (walletAddress, chatId, or email) is required',
				});
			}

			// Try to find user
			let user = null;
			let identifierUsed = '';

			if (walletAddress) {
				const User = (await import('../models/user.model.js')).default;
				user = await User.findOne({ walletAddress }).select(
					'-password -otpCode'
				);
				identifierUsed = 'wallet';
			}

			if (!user && chatId) {
				const User = (await import('../models/user.model.js')).default;
				user = await User.findOne({ chatId }).select('-password -otpCode');
				identifierUsed = 'telegram';
			}

			if (!user && email) {
				const User = (await import('../models/user.model.js')).default;
				user = await User.findOne({ email }).select('-password -otpCode');
				identifierUsed = 'email';
			}

			if (user) {
				res.status(200).json({
					success: true,
					userExists: true,
					data: {
						user: {
							id: user._id,
							name: user.name,
							email: user.email,
							username: user.username,
							walletAddress: user.walletAddress,
							onboardingMethod: user.onboardingMethod,
							isVerified: user.isVerified,
							registeredAt: user.registeredAt,
						},
						identifierUsed,
					},
				});
			} else {
				res.status(200).json({
					success: true,
					userExists: false,
					message: 'User not found - will be created during purchase',
				});
			}
		} catch (error) {
			console.error('User check API error:', error);
			res.status(500).json({
				success: false,
				message: 'Internal server error during user check',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	})
);

/**
 * Telegram-specific purchase endpoint
 * POST /api/purchase/telegram
 */
router.post(
	'/telegram',
	catchAsync(async (req: Request, res: Response) => {
		try {
			const { chatId, name, username, ...orderData } = req.body;

			if (!chatId) {
				return res.status(400).json({
					success: false,
					message: 'Chat ID is required for Telegram purchases',
				});
			}

			// Convert to standard purchase request
			const purchaseRequest: PurchaseRequest = {
				...orderData,
				chatId,
				name,
				username,
				source: 'telegram',
			};

			const result = await purchaseService.processPurchase(purchaseRequest);

			if (result.success) {
				res.status(201).json({
					success: true,
					message: result.message,
					data: {
						order: {
							id: result.order._id,
							orderId: result.order.orderId,
							status: result.order.status,
							totalPrice: result.order.totalPrice,
						},
						user: result.user,
						isNewUser: result.isNewUser,
					},
				});
			} else {
				res.status(400).json({
					success: false,
					message: result.message,
					error: result.error,
				});
			}
		} catch (error) {
			console.error('Telegram purchase API error:', error);
			res.status(500).json({
				success: false,
				message: 'Internal server error during Telegram purchase',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	})
);

/**
 * Check user registration status for AI/Claude users
 * POST /api/purchase/claude/check-user
 */
router.post(
	'/claude/check-user',
	catchAsync(async (req: Request, res: Response) => {
		try {
			const { email, walletAddress } = req.body;

			if (!email && !walletAddress) {
				return res.status(400).json({
					success: false,
					message: 'Email or wallet address is required for user check',
				});
			}

			// Try to find user
			let user = null;
			let identifierUsed = '';

			if (email) {
				const User = (await import('../models/user.model.js')).default;
				user = await User.findOne({ email }).select('-password -otpCode');
				identifierUsed = 'email';
			}

			if (!user && walletAddress) {
				const User = (await import('../models/user.model.js')).default;
				user = await User.findOne({ walletAddress }).select(
					'-password -otpCode'
				);
				identifierUsed = 'wallet';
			}

			if (user) {
				res.status(200).json({
					success: true,
					userExists: true,
					requiresEmail: false,
					data: {
						user: {
							id: user._id,
							name: user.name,
							email: user.email,
							username: user.username,
							walletAddress: user.walletAddress,
							onboardingMethod: user.onboardingMethod,
							isVerified: user.isVerified,
							registeredAt: user.registeredAt,
						},
						identifierUsed,
					},
				});
			} else {
				res.status(200).json({
					success: true,
					userExists: false,
					requiresEmail: !email,
					message: email
						? 'User not found - will be created during purchase'
						: 'Email required for user registration',
				});
			}
		} catch (error) {
			console.error('Claude user check API error:', error);
			res.status(500).json({
				success: false,
				message: 'Internal server error during user check',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	})
);

/**
 * Claude AI-specific purchase endpoint
 * POST /api/purchase/claude
 */
router.post(
	'/claude',
	catchAsync(async (req: Request, res: Response) => {
		try {
			const { email, name, ...orderData } = req.body;

			// Validate email is provided for AI users
			if (!email) {
				return res.status(400).json({
					success: false,
					message: 'Email is required for AI/Claude purchases',
					requiresEmail: true,
				});
			}

			// Convert to standard purchase request
			const purchaseRequest: PurchaseRequest = {
				...orderData,
				email,
				name,
				source: 'claude',
			};

			const result = await purchaseService.processPurchase(purchaseRequest);

			if (result.success) {
				res.status(201).json({
					success: true,
					message: result.message,
					data: {
						order: {
							id: result.order._id,
							orderId: result.order.orderId,
							status: result.order.status,
							totalPrice: result.order.totalPrice,
							trackingUrl: `${process.env.FRONTEND_URL}/orders/${result.order._id}`,
						},
						user: result.user,
						isNewUser: result.isNewUser,
					},
				});
			} else {
				res.status(400).json({
					success: false,
					message: result.message,
					error: result.error,
				});
			}
		} catch (error) {
			console.error('Claude purchase API error:', error);
			res.status(500).json({
				success: false,
				message: 'Internal server error during Claude purchase',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	})
);

export default router;

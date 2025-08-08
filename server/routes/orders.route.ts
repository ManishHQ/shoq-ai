import express, { Request, Response } from 'express';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

// Get all orders with filtering and sorting
router.get(
	'/',
	catchAsync(async (req: Request, res: Response) => {
		const {
			status,
			search,
			sortBy = 'createdAt',
			sortOrder = 'desc',
		} = req.query;

		// Build query
		let query: any = {};

		// Status filter
		if (status && status !== 'all') {
			query.status = status;
		}

		// Search filter
		if (search) {
			query.$or = [
				{ orderId: { $regex: search, $options: 'i' } },
				{ 'items.name': { $regex: search, $options: 'i' } },
			];
		}

		// Build sort object
		const sort: any = {};
		sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

		// Fetch orders with user details
		const orders = await Order.find(query)
			.populate('userId', 'name email chatId')
			.sort(sort)
			.lean();

		// Transform orders to match frontend expectations
		const transformedOrders = orders.map((order) => ({
			_id: order._id,
			orderId: order.orderId,
			userId: order.userId || {
				_id: 'unknown',
				name: 'Unknown User',
				email: 'unknown@example.com',
				chatId: 0,
			},
			items: order.items || [],
			totalPrice: order.totalPrice,
			status: order.status,
			transactionHash: order.transactionHash,
			telegramMessageId: order.telegramMessageId,
			createdAt: order.createdAt,
			updatedAt: order.updatedAt,
		}));

		res.json({
			success: true,
			orders: transformedOrders,
			total: transformedOrders.length,
		});
	})
);

// Get order by ID
router.get(
	'/:id',
	catchAsync(async (req: Request, res: Response) => {
		const order = await Order.findById(req.params.id)
			.populate('userId', 'name email chatId')
			.lean();

		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'Order not found',
			});
		}

		res.json({
			success: true,
			order: {
				_id: order._id,
				orderId: order.orderId,
				userId: order.userId,
				items: order.items,
				totalPrice: order.totalPrice,
				status: order.status,
				transactionHash: order.transactionHash,
				telegramMessageId: order.telegramMessageId,
				createdAt: order.createdAt,
				updatedAt: order.updatedAt,
			},
		});
	})
);

// Update order status
router.patch(
	'/:id/status',
	catchAsync(async (req: Request, res: Response) => {
		const { status } = req.body;

		if (!status) {
			return res.status(400).json({
				success: false,
				message: 'Status is required',
			});
		}

		const order = await Order.findByIdAndUpdate(
			req.params.id,
			{ status },
			{ new: true }
		).populate('userId', 'name email chatId');

		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'Order not found',
			});
		}

		res.json({
			success: true,
			order: {
				_id: order._id,
				orderId: order.orderId,
				userId: order.userId,
				items: order.items,
				totalPrice: order.totalPrice,
				status: order.status,
				transactionHash: order.transactionHash,
				telegramMessageId: order.telegramMessageId,
				createdAt: order.createdAt,
				updatedAt: order.updatedAt,
			},
		});
	})
);

export default router;

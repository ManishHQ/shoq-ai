'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
	ArrowLeft,
	Package,
	Truck,
	CheckCircle,
	Clock,
	XCircle,
	MapPin,
	CreditCard,
	Copy,
	Download,
	MessageCircle,
	Edit3,
	User,
	Calendar,
	ShoppingCart,
	Loader2,
	ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Types for order data
interface OrderItem {
	productId: string;
	name: string;
	price: number;
	quantity: number;
}

interface User {
	_id: string;
	name: string;
	email: string;
	chatId: number;
}

interface Order {
	_id: string;
	orderId: string;
	userId: User;
	items: OrderItem[];
	totalPrice: number;
	status:
		| 'pending'
		| 'confirmed'
		| 'processing'
		| 'shipped'
		| 'delivered'
		| 'cancelled';
	transactionHash?: string;
	telegramMessageId?: string;
	createdAt: string;
	updatedAt: string;
}

// Order status timeline data
const getStatusTimeline = (
	status: string,
	createdAt: string,
	updatedAt: string
) => {
	const baseStatuses = [
		{
			status: 'pending',
			label: 'Order Placed',
			description: 'Your order has been placed and is awaiting confirmation',
			timestamp: createdAt,
			completed: true,
		},
		{
			status: 'confirmed',
			label: 'Order Confirmed',
			description: 'Payment confirmed and order is being prepared',
			timestamp: updatedAt,
			completed: ['confirmed', 'processing', 'shipped', 'delivered'].includes(
				status
			),
		},
		{
			status: 'processing',
			label: 'Processing',
			description: 'Your order is being prepared for shipment',
			timestamp: status === 'processing' ? updatedAt : null,
			completed: ['processing', 'shipped', 'delivered'].includes(status),
		},
		{
			status: 'shipped',
			label: 'Shipped',
			description: 'Your order is on its way to you',
			timestamp: status === 'shipped' ? updatedAt : null,
			completed: ['shipped', 'delivered'].includes(status),
		},
		{
			status: 'delivered',
			label: 'Delivered',
			description: 'Your order has been delivered',
			timestamp: status === 'delivered' ? updatedAt : null,
			completed: status === 'delivered',
		},
	];

	// Filter out cancelled orders from timeline
	if (status === 'cancelled') {
		return [
			{
				status: 'cancelled',
				label: 'Order Cancelled',
				description: 'This order has been cancelled',
				timestamp: updatedAt,
				completed: true,
			},
		];
	}

	return baseStatuses;
};

export default function OrderDetailPage() {
	const params = useParams();
	const [order, setOrder] = useState<Order | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [copiedHash, setCopiedHash] = useState(false);

	// Fetch order data
	const fetchOrder = async (orderId: string) => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`/api/orders/${orderId}`);
			const data = await response.json();

			if (data.success) {
				setOrder(data.order);
			} else {
				setError(data.message || 'Failed to fetch order');
			}
		} catch (err) {
			setError('Failed to fetch order details');
			console.error('Error fetching order:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (params.id) {
			fetchOrder(params.id as string);
		}
	}, [params.id]);

	const getStatusIcon = (status: string, completed: boolean = false) => {
		if (!completed) {
			return <Clock size={20} className='text-slate-400' />;
		}

		switch (status.toLowerCase()) {
			case 'pending':
				return <Clock size={20} className='text-yellow-600' />;
			case 'confirmed':
				return <CheckCircle size={20} className='text-green-600' />;
			case 'processing':
				return <Package size={20} className='text-blue-600' />;
			case 'shipped':
				return <Truck size={20} className='text-indigo-600' />;
			case 'delivered':
				return <CheckCircle size={20} className='text-green-600' />;
			case 'cancelled':
				return <XCircle size={20} className='text-red-600' />;
			default:
				return <Clock size={20} className='text-gray-600' />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'confirmed':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'processing':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'shipped':
				return 'bg-indigo-100 text-indigo-800 border-indigo-200';
			case 'delivered':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'cancelled':
				return 'bg-red-100 text-red-800 border-red-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	};

	const copyTransactionHash = async () => {
		if (order?.transactionHash) {
			await navigator.clipboard.writeText(order.transactionHash);
			setCopiedHash(true);
			setTimeout(() => setCopiedHash(false), 2000);
		}
	};

	const getHashScanUrl = (transactionHash: string) => {
		return `https://hashscan.io/testnet/transaction/${transactionHash}`;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center'>
				<div className='text-center'>
					<Loader2
						size={48}
						className='text-purple-600 mx-auto mb-4 animate-spin'
					/>
					<p className='text-slate-600'>Loading order details...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center'>
				<div className='text-center'>
					<XCircle size={48} className='text-red-500 mx-auto mb-4' />
					<h3 className='text-lg font-semibold text-slate-900 mb-2'>
						Error loading order
					</h3>
					<p className='text-slate-600 mb-4'>{error}</p>
					<button
						onClick={() => fetchOrder(params.id as string)}
						className='bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors'
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	if (!order) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center'>
				<div className='text-center'>
					<Package size={48} className='text-slate-300 mx-auto mb-4' />
					<h3 className='text-lg font-semibold text-slate-900 mb-2'>
						Order not found
					</h3>
					<p className='text-slate-600 mb-4'>
						The order you're looking for doesn't exist.
					</p>
					<Link
						href='/orders'
						className='bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors'
					>
						Back to Orders
					</Link>
				</div>
			</div>
		);
	}

	const timeline = getStatusTimeline(
		order.status,
		order.createdAt,
		order.updatedAt
	);

	return (
		<div className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12 px-4'>
			<div className='max-w-4xl mx-auto'>
				{/* Back Button */}
				<motion.button
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					whileHover={{ x: -5 }}
					className='flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-8 transition-all duration-200'
				>
					<Link href='/orders' className='flex items-center space-x-2'>
						<ArrowLeft size={20} />
						<span>Back to Orders</span>
					</Link>
				</motion.button>

				{/* Order Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100 mb-8'
				>
					<div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
						<div>
							<h1 className='text-3xl font-bold text-slate-900 mb-2'>
								Order #{order.orderId}
							</h1>
							<p className='text-slate-600'>
								Placed on {formatDate(order.createdAt)}
							</p>
						</div>
						<div className='flex items-center space-x-4'>
							<div
								className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
									order.status
								)}`}
							>
								{getStatusIcon(order.status, true)}
								<span className='capitalize'>{order.status}</span>
							</div>
						</div>
					</div>
				</motion.div>

				<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
					{/* Main Content */}
					<div className='lg:col-span-2 space-y-8'>
						{/* Order Items */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 }}
							className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
						>
							<h2 className='text-xl font-semibold text-slate-900 mb-6 flex items-center space-x-2'>
								<ShoppingCart size={24} className='text-purple-600' />
								<span>Order Items</span>
							</h2>
							<div className='space-y-4'>
								{order.items.map((item, index) => (
									<div
										key={index}
										className='flex items-center justify-between p-4 bg-slate-50 rounded-xl'
									>
										<div className='flex-1'>
											<h3 className='font-semibold text-slate-900'>
												{item.name}
											</h3>
											<p className='text-sm text-slate-600'>
												Quantity: {item.quantity}
											</p>
										</div>
										<div className='text-right'>
											<p className='font-semibold text-slate-900'>
												${(item.price * item.quantity).toFixed(2)}
											</p>
											<p className='text-sm text-slate-600'>
												${item.price.toFixed(2)} each
											</p>
										</div>
									</div>
								))}
							</div>
							<div className='mt-6 pt-6 border-t border-slate-200'>
								<div className='flex justify-between items-center'>
									<span className='text-lg font-semibold text-slate-900'>
										Total
									</span>
									<span className='text-2xl font-bold text-purple-600'>
										${order.totalPrice.toFixed(2)}
									</span>
								</div>
							</div>
						</motion.div>

						{/* Order Timeline */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
						>
							<h2 className='text-xl font-semibold text-slate-900 mb-6 flex items-center space-x-2'>
								<Calendar size={24} className='text-purple-600' />
								<span>Order Timeline</span>
							</h2>
							<div className='space-y-6'>
								{timeline.map((step, index) => (
									<div key={step.status} className='flex items-start space-x-4'>
										<div className='flex-shrink-0'>
											<div
												className={`w-10 h-10 rounded-full flex items-center justify-center ${
													step.completed ? 'bg-purple-100' : 'bg-slate-100'
												}`}
											>
												{getStatusIcon(step.status, step.completed)}
											</div>
											{index < timeline.length - 1 && (
												<div
													className={`w-0.5 h-8 mx-auto mt-2 ${
														step.completed ? 'bg-purple-200' : 'bg-slate-200'
													}`}
												></div>
											)}
										</div>
										<div className='flex-1 min-w-0'>
											<h3
												className={`font-semibold ${
													step.completed ? 'text-slate-900' : 'text-slate-500'
												}`}
											>
												{step.label}
											</h3>
											<p
												className={`text-sm ${
													step.completed ? 'text-slate-600' : 'text-slate-400'
												}`}
											>
												{step.description}
											</p>
											{step.timestamp && (
												<p className='text-xs text-slate-400 mt-1'>
													{formatDate(step.timestamp)}
												</p>
											)}
										</div>
									</div>
								))}
							</div>
						</motion.div>
					</div>

					{/* Sidebar */}
					<div className='space-y-6'>
						{/* Customer Information */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.1 }}
							className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
						>
							<h2 className='text-xl font-semibold text-slate-900 mb-6 flex items-center space-x-2'>
								<User size={24} className='text-purple-600' />
								<span>Customer</span>
							</h2>
							<div className='space-y-4'>
								<div>
									<p className='text-sm text-slate-600'>Name</p>
									<p className='font-semibold text-slate-900'>
										{order.userId.name}
									</p>
								</div>
								<div>
									<p className='text-sm text-slate-600'>Email</p>
									<p className='font-semibold text-slate-900'>
										{order.userId.email}
									</p>
								</div>
								<div>
									<p className='text-sm text-slate-600'>Chat ID</p>
									<p className='font-semibold text-slate-900'>
										{order.userId.chatId}
									</p>
								</div>
							</div>
						</motion.div>

						{/* Payment Information */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
							className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
						>
							<h2 className='text-xl font-semibold text-slate-900 mb-6 flex items-center space-x-2'>
								<CreditCard size={24} className='text-purple-600' />
								<span>Payment</span>
							</h2>
							<div className='space-y-4'>
								<div>
									<p className='text-sm text-slate-600'>Method</p>
									<p className='font-semibold text-slate-900'>USDC Wallet</p>
								</div>
								<div>
									<p className='text-sm text-slate-600'>Amount</p>
									<p className='font-semibold text-slate-900'>
										${order.totalPrice.toFixed(2)} USDC
									</p>
								</div>
								{order.transactionHash && (
									<div>
										<p className='text-sm text-slate-600'>Transaction Hash</p>
										<div className='flex items-center space-x-2'>
											<a
												href={getHashScanUrl(order.transactionHash)}
												target='_blank'
												rel='noopener noreferrer'
												className='font-mono text-sm text-purple-600 hover:text-purple-700 truncate flex-1 cursor-pointer hover:underline'
												title='View on HashScan'
											>
												{order.transactionHash}
											</a>
											<button
												onClick={copyTransactionHash}
												className='p-1 hover:bg-slate-100 rounded transition-colors'
												title='Copy transaction hash'
											>
												{copiedHash ? (
													<CheckCircle size={16} className='text-green-600' />
												) : (
													<Copy size={16} className='text-slate-600' />
												)}
											</button>
											<a
												href={getHashScanUrl(order.transactionHash)}
												target='_blank'
												rel='noopener noreferrer'
												className='p-1 hover:bg-slate-100 rounded transition-colors'
												title='View on HashScan'
											>
												<ExternalLink size={16} className='text-slate-600' />
											</a>
										</div>
									</div>
								)}
							</div>
						</motion.div>

						{/* Order Details */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.3 }}
							className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
						>
							<h2 className='text-xl font-semibold text-slate-900 mb-6 flex items-center space-x-2'>
								<Package size={24} className='text-purple-600' />
								<span>Order Details</span>
							</h2>
							<div className='space-y-4'>
								<div>
									<p className='text-sm text-slate-600'>Order ID</p>
									<p className='font-semibold text-slate-900'>
										{order.orderId}
									</p>
								</div>
								<div>
									<p className='text-sm text-slate-600'>Created</p>
									<p className='font-semibold text-slate-900'>
										{formatDate(order.createdAt)}
									</p>
								</div>
								<div>
									<p className='text-sm text-slate-600'>Last Updated</p>
									<p className='font-semibold text-slate-900'>
										{formatDate(order.updatedAt)}
									</p>
								</div>
								{order.telegramMessageId && (
									<div>
										<p className='text-sm text-slate-600'>Telegram Message</p>
										<p className='font-semibold text-slate-900'>
											{order.telegramMessageId}
										</p>
									</div>
								)}
							</div>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	);
}

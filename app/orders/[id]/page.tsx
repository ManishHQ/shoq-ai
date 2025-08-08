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
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Mock data - would be fetched from API based on order ID
const mockOrder = {
	_id: '66b2a1c4f123456789012345',
	orderId: 'SHQ-2024-001234',
	userId: {
		_id: '66b2a1c4f123456789012346',
		name: 'John Doe',
		email: 'john@example.com',
		chatId: 123456789,
		username: '@johndoe',
		walletAddress: '0x742e26f3F3C4F3b0D0f7B8F9C4F0D0F0C4F0D0F0',
		onboardingMethod: 'wallet',
		photo: '',
	},
	items: [
		{
			productId: 'PROD001',
			name: 'Premium Coffee Mug',
			description: 'Ceramic coffee mug with premium finish',
			category: 'product',
			price: 13.00,
			quantity: 2,
			sku: 'MUG-001',
			image: '/product-placeholder.jpg',
		},
	],
	shippingAddress: {
		street: '123 Market Street',
		city: 'San Francisco',
		state: 'CA',
		zipCode: '94102',
		country: 'USA',
	},
	payment: {
		method: 'usdc_wallet',
		transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
		amount: 31.99,
		currency: 'USD',
		status: 'confirmed',
	},
	subtotal: 26.00,
	shipping: 5.99,
	tax: 0,
	discount: 0,
	totalPrice: 31.99,
	status: 'confirmed',
	trackingNumber: 'TRK789456123',
	estimatedDelivery: '2024-08-10T18:00:00.000Z',
	notes: 'Please leave package at front door if not home.',
	telegramMessageId: 'msg_12345',
	createdAt: '2024-08-07T10:30:00.000Z',
	updatedAt: '2024-08-07T14:15:00.000Z',
};

// Order status timeline data
const getStatusTimeline = (status: string, createdAt: string, updatedAt: string) => {
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
			completed: ['confirmed', 'processing', 'shipped', 'delivered'].includes(status),
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
			description: 'Your order is on its way',
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

	return baseStatuses;
};

export default function OrderDetailPage() {
	const params = useParams();
	const [order] = useState(mockOrder);
	const [loading, setLoading] = useState(false);
	const [copiedHash, setCopiedHash] = useState(false);

	useEffect(() => {
		// In real app, fetch order by ID
		// fetchOrder(params.id);
		setLoading(false);
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
		if (order.payment.transactionHash) {
			await navigator.clipboard.writeText(order.payment.transactionHash);
			setCopiedHash(true);
			setTimeout(() => setCopiedHash(false), 2000);
		}
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

	const timeline = getStatusTimeline(order.status, order.createdAt, order.updatedAt);

	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4'></div>
					<p className='text-slate-600'>Loading order details...</p>
				</div>
			</div>
		);
	}

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
					<Link href='/app/orders' className='flex items-center space-x-2'>
						<ArrowLeft size={20} />
						<span>Back to Orders</span>
					</Link>
				</motion.button>

				{/* Main Invoice Card */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					className='bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/50'
				>
					{/* Header */}
					<div className='bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6'>
						<div className='flex justify-between items-start text-white'>
							<div className='flex items-center space-x-4'>
								<div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center'>
									<Package size={24} />
								</div>
								<div>
									<h1 className='text-2xl font-bold'>Order Details</h1>
									<p className='text-purple-100'>Order #{order.orderId}</p>
								</div>
							</div>
							<div className='text-right'>
								<div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/20 text-white`}>
									<CheckCircle size={16} className='mr-1' />
									{order.status.toUpperCase()}
								</div>
							</div>
						</div>
					</div>

					{/* Invoice Content */}
					<div className='px-8 py-8'>

				{/* Customer & Order Info */}
				<div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'>
					{/* Customer Info */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.2 }}
					>
						<h3 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4'>Customer</h3>
						<div className='space-y-2'>
							<div className='font-semibold text-slate-900 text-lg'>{order.userId.name}</div>
							<div className='text-slate-600'>{order.userId.email}</div>
							<div className='text-slate-600'>{order.userId.username}</div>
							<div className='text-slate-600 mt-3'>
								<div className='flex items-start space-x-2'>
									<MapPin size={16} className='text-slate-400 mt-0.5 flex-shrink-0' />
									<div>
										<p>{order.shippingAddress.street}</p>
										<p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
										<p>{order.shippingAddress.country}</p>
									</div>
								</div>
							</div>
						</div>
					</motion.div>

					{/* Order Info */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.3 }}
					>
						<h3 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4'>Order Information</h3>
						<div className='space-y-3'>
							<div className='bg-slate-50 rounded-xl p-4'>
								<div className='flex items-center space-x-2 mb-2'>
									<Clock size={16} className='text-slate-500' />
									<span className='text-sm font-medium text-slate-500'>Order Date</span>
								</div>
								<div className='text-lg font-semibold text-slate-900'>{formatDate(order.createdAt)}</div>
							</div>
							<div className='bg-slate-50 rounded-xl p-4'>
								<div className='flex items-center space-x-2 mb-2'>
									<CreditCard size={16} className='text-slate-500' />
									<span className='text-sm font-medium text-slate-500'>Payment Method</span>
								</div>
								<div className='text-lg font-semibold text-slate-900'>{order.payment.method.replace('_', ' ')}</div>
								<div className='text-xs text-slate-500 mt-1 font-mono'>{order.payment.transactionHash.slice(0, 10)}...{order.payment.transactionHash.slice(-6)}</div>
							</div>
						</div>
					</motion.div>
				</div>
				{/* Items Table */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className='mb-8'
				>
					<h3 className='text-lg font-semibold text-slate-900 mb-4'>Order Items</h3>
					<div className='border border-slate-200 rounded-xl overflow-hidden'>
						<div className='bg-slate-50 px-6 py-4 border-b border-slate-200'>
							<div className='grid grid-cols-12 gap-4 text-sm font-medium text-slate-600 uppercase tracking-wide'>
								<div className='col-span-6'>Item</div>
								<div className='col-span-2 text-center'>Qty</div>
								<div className='col-span-2 text-right'>Price</div>
								<div className='col-span-2 text-right'>Total</div>
							</div>
						</div>
						<div className='divide-y divide-slate-200'>
							{order.items.map((item, index) => (
								<motion.div
									key={index}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.5 + index * 0.1 }}
									className='px-6 py-4 hover:bg-slate-50 transition-colors duration-200'
								>
									<div className='grid grid-cols-12 gap-4 items-center'>
										<div className='col-span-6 flex items-center space-x-4'>
											<div className='w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0'>
												<Package size={24} className='text-slate-400' />
											</div>
											<div>
												<div className='font-semibold text-slate-900'>{item.name}</div>
												<div className='text-sm text-slate-600'>{item.description}</div>
												<div className='text-xs text-slate-500 mt-1'>SKU: {item.sku}</div>
											</div>
										</div>
										<div className='col-span-2 text-center font-semibold text-slate-900'>
											{item.quantity}
										</div>
										<div className='col-span-2 text-right font-semibold text-slate-900'>
											${item.price.toFixed(2)}
										</div>
										<div className='col-span-2 text-right font-bold text-slate-900'>
											${(item.quantity * item.price).toFixed(2)}
										</div>
									</div>
								</motion.div>
							))}
						</div>
					</div>
				</motion.div>

				{/* Order Summary */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className='flex justify-end mb-8'
				>
					<div className='w-full max-w-md'>
						<div className='bg-slate-50 rounded-xl p-6'>
							<h3 className='text-lg font-semibold text-slate-900 mb-4'>Order Summary</h3>
							<div className='space-y-3'>
								<div className='flex justify-between'>
									<span className='text-slate-600'>Subtotal</span>
									<span className='font-semibold text-slate-900'>${order.subtotal.toFixed(2)}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-slate-600'>Shipping</span>
									<span className='font-semibold text-slate-900'>${order.shipping.toFixed(2)}</span>
								</div>
								{order.tax > 0 && (
									<div className='flex justify-between'>
										<span className='text-slate-600'>Tax</span>
										<span className='font-semibold text-slate-900'>${order.tax.toFixed(2)}</span>
									</div>
								)}
								{order.discount > 0 && (
									<div className='flex justify-between text-green-600'>
										<span>Discount</span>
										<span className='font-semibold'>-${order.discount.toFixed(2)}</span>
									</div>
								)}
								<div className='border-t border-slate-200 pt-3'>
									<div className='flex justify-between text-lg'>
										<span className='font-bold text-slate-900'>Total</span>
										<span className='font-bold text-slate-900'>${order.totalPrice.toFixed(2)}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Order Timeline */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.7 }}
					className='mb-8'
				>
					<h3 className='text-lg font-semibold text-slate-900 mb-6'>Order Tracking</h3>
					<div className='space-y-4'>
						{timeline.map((step, index) => (
							<div key={index} className='flex items-start space-x-4'>
								<div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
									step.completed 
										? 'bg-green-100 text-green-600' 
										: 'bg-slate-100 text-slate-400'
								}`}>
									{step.completed ? (
										<CheckCircle size={16} />
									) : (
										<Clock size={16} />
									)}
								</div>
								<div className='flex-grow'>
									<div className={`font-semibold ${
										step.completed ? 'text-slate-900' : 'text-slate-500'
									}`}>
										{step.label}
									</div>
									<div className='text-sm text-slate-600'>{step.timestamp && formatDate(step.timestamp)}</div>
								</div>
							</div>
						))}
					</div>
				</motion.div>

				{/* Actions */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.8 }}
					className='flex flex-wrap gap-4 pt-6 border-t border-slate-200 mb-8'
				>
					<motion.button
						whileHover={{ scale: 1.02, y: -2 }}
						whileTap={{ scale: 0.98 }}
						onClick={() => {
							// Generate and download invoice PDF
							const printWindow = window.open('', '_blank');
							if (printWindow) {
								printWindow.document.write(`
									<html>
										<head>
											<title>Invoice #${order.orderId}</title>
											<style>
												body { font-family: Arial, sans-serif; margin: 40px; }
												.header { text-align: center; margin-bottom: 40px; }
												.order-details { margin: 20px 0; }
												.items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
												.items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
												.items-table th { background-color: #f2f2f2; }
												.total { text-align: right; font-weight: bold; font-size: 18px; }
											</style>
										</head>
										<body>
											<div class="header">
												<h1>Shoq Invoice</h1>
												<h2>Order #${order.orderId}</h2>
											</div>
											
											<div class="order-details">
												<p><strong>Customer:</strong> ${order.userId.name}</p>
												<p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
												<p><strong>Status:</strong> ${order.status}</p>
												<p><strong>Payment:</strong> ${order.payment.method}</p>
											</div>

											<table class="items-table">
												<thead>
													<tr>
														<th>Item</th>
														<th>Quantity</th>
														<th>Price</th>
														<th>Total</th>
													</tr>
												</thead>
												<tbody>
													${order.items.map(item => `
														<tr>
															<td>${item.name}</td>
															<td>${item.quantity}</td>
															<td>$${item.price.toFixed(2)}</td>
															<td>$${(item.quantity * item.price).toFixed(2)}</td>
														</tr>
													`).join('')}
												</tbody>
											</table>

											<div class="total">
												<p>Subtotal: $${order.subtotal.toFixed(2)}</p>
												<p>Shipping: $${order.shipping.toFixed(2)}</p>
												${order.tax > 0 ? `<p>Tax: $${order.tax.toFixed(2)}</p>` : ''}
												${order.discount > 0 ? `<p>Discount: -$${order.discount.toFixed(2)}</p>` : ''}
												<hr>
												<p>Total: $${order.totalPrice.toFixed(2)}</p>
											</div>
										</body>
									</html>
								`);
								printWindow.document.close();
								printWindow.print();
							}
						}}
						className='flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300'
					>
						<Download size={18} />
						<span>Download Invoice</span>
					</motion.button>

					{order.trackingNumber && (
						<motion.button
							whileHover={{ scale: 1.02, y: -2 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => {
								// Open tracking page in new tab
								window.open(`https://www.ups.com/track?loc=en_US&tracknum=${order.trackingNumber}`, '_blank');
							}}
							className='flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300'
						>
							<Truck size={18} />
							<span>Track Package</span>
						</motion.button>
					)}

					<motion.button
						whileHover={{ scale: 1.02, y: -2 }}
						whileTap={{ scale: 0.98 }}
						onClick={() => {
							// Open support chat/email
							window.open('https://t.me/HeyShoqBot', '_blank');
						}}
						className='flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300'
					>
						<MessageCircle size={18} />
						<span>Contact Support</span>
					</motion.button>

					{order.payment.transactionHash && (
						<motion.button
							whileHover={{ scale: 1.02, y: -2 }}
							whileTap={{ scale: 0.98 }}
							onClick={copyTransactionHash}
							className='flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300'
						>
							{copiedHash ? <CheckCircle size={18} /> : <Copy size={18} />}
							<span>Copy Transaction Hash</span>
						</motion.button>
					)}
				</motion.div>

				{/* Support Section */}
				{order.notes && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.9 }}
						className='p-6 bg-purple-50 rounded-xl border border-purple-200'
					>
						<div className='flex items-start space-x-3'>
							<div className='flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
								<Edit3 size={16} className='text-purple-600' />
							</div>
							<div>
								<h4 className='font-semibold text-slate-900 mb-1'>Order Notes</h4>
								<p className='text-slate-700 leading-relaxed'>{order.notes}</p>
							</div>
						</div>
					</motion.div>
				)}
					</div>
				</motion.div>
			</div>
		</div>
	);
}
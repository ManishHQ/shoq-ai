'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
	Download,
	Mail,
	MapPin,
	Package,
	CreditCard,
	Clock,
	CheckCircle,
	Truck,
	Star,
	ArrowLeft,
	Copy,
	Share2,
} from 'lucide-react';
import Image from 'next/image';

// Order Invoice Configuration
const ORDER_CONFIG = {
	company: {
		name: 'Shoq',
		logo: '/shoq-logo.png',
		address: 'San Francisco, CA 94102',
		email: 'hello@shoq.ai',
		website: 'shoq.ai',
	},
	order: {
		id: 'SHQ-2024-001234',
		date: '2024-08-07',
		status: 'confirmed',
		tracking: 'TRK789456123',
		estimatedDelivery: '2024-08-10',
		paymentMethod: 'USDC Wallet',
		transactionHash: '0x1234...abcd',
	},
	customer: {
		name: 'John Doe',
		email: 'john@example.com',
		telegramId: '@johndoe',
		address: {
			street: '123 Market Street',
			city: 'San Francisco',
			state: 'CA',
			zip: '94102',
			country: 'USA',
		},
	},
	items: [
		{
			id: 'ITEM001',
			name: 'Premium Coffee Mug',
			description: 'Ceramic coffee mug with premium finish',
			quantity: 2,
			price: 13.00,
			image: '/coffee-mug.jpg',
			sku: 'MUG-001',
		},
		{
			id: 'ITEM002',
			name: 'Concert Ticket - Rock Band Live',
			description: 'Front row seats for Rock Band concert',
			quantity: 2,
			price: 75.00,
			image: '/concert-ticket.jpg',
			sku: 'TKT-ROCK-001',
		},
	],
	summary: {
		subtotal: 176.00,
		shipping: 5.99,
		tax: 14.56,
		discount: 10.00,
		total: 186.55,
	},
	timeline: [
		{ status: 'Order Placed', time: '2024-08-07 10:30 AM', completed: true },
		{ status: 'Payment Confirmed', time: '2024-08-07 10:32 AM', completed: true },
		{ status: 'Processing', time: '2024-08-07 02:15 PM', completed: true },
		{ status: 'Shipped', time: '2024-08-08 09:00 AM', completed: false },
		{ status: 'Out for Delivery', time: 'Estimated 2024-08-10 10:00 AM', completed: false },
		{ status: 'Delivered', time: 'Estimated 2024-08-10 06:00 PM', completed: false },
	],
};

const OrderInvoice = () => {
	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case 'confirmed':
			case 'delivered':
				return 'text-green-600 bg-green-100';
			case 'processing':
			case 'shipped':
				return 'text-blue-600 bg-blue-100';
			case 'pending':
				return 'text-yellow-600 bg-yellow-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12 px-4'>
			<div className='max-w-4xl mx-auto'>
				{/* Back Button */}
				<motion.button
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					whileHover={{ x: -5 }}
					onClick={() => {
						// Navigate back to orders page or previous page
						if (window.history.length > 1) {
							window.history.back();
						} else {
							window.location.href = '/app/orders';
						}
					}}
					className='flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-8 transition-all duration-200'
				>
					<ArrowLeft size={20} />
					<span>Back to Orders</span>
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
									<h1 className='text-2xl font-bold'>Order Invoice</h1>
									<p className='text-purple-100'>Order #{ORDER_CONFIG.order.id}</p>
								</div>
							</div>
							<div className='text-right'>
								<div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(ORDER_CONFIG.order.status)} bg-white/20 text-white`}>
									<CheckCircle size={16} className='mr-1' />
									{ORDER_CONFIG.order.status.toUpperCase()}
								</div>
							</div>
						</div>
					</div>

					{/* Invoice Content */}
					<div className='px-8 py-8'>
						{/* Company & Customer Info */}
						<div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'>
							{/* From */}
							<motion.div
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.2 }}
							>
								<h3 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4'>From</h3>
								<div className='flex items-center space-x-3 mb-4'>
									<div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
										<Image
											src={ORDER_CONFIG.company.logo}
											alt='Shoq Logo'
											width={40}
											height={40}
											className='w-6 h-6'
										/>
									</div>
									<div>
										<div className='font-bold text-slate-900 text-xl'>{ORDER_CONFIG.company.name}</div>
										<div className='text-slate-600 text-sm'>{ORDER_CONFIG.company.website}</div>
									</div>
								</div>
								<div className='text-slate-600 space-y-1'>
									<p>{ORDER_CONFIG.company.address}</p>
									<p>{ORDER_CONFIG.company.email}</p>
								</div>
							</motion.div>

							{/* To */}
							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.3 }}
							>
								<h3 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4'>Bill To</h3>
								<div className='space-y-2'>
									<div className='font-semibold text-slate-900 text-lg'>{ORDER_CONFIG.customer.name}</div>
									<div className='text-slate-600'>{ORDER_CONFIG.customer.email}</div>
									<div className='text-slate-600'>{ORDER_CONFIG.customer.telegramId}</div>
									<div className='text-slate-600 mt-3'>
										<div className='flex items-start space-x-2'>
											<MapPin size={16} className='text-slate-400 mt-0.5 flex-shrink-0' />
											<div>
												<p>{ORDER_CONFIG.customer.address.street}</p>
												<p>{ORDER_CONFIG.customer.address.city}, {ORDER_CONFIG.customer.address.state} {ORDER_CONFIG.customer.address.zip}</p>
												<p>{ORDER_CONFIG.customer.address.country}</p>
											</div>
										</div>
									</div>
								</div>
							</motion.div>
						</div>

						{/* Order Details */}
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.4 }}
								className='bg-slate-50 rounded-xl p-4'
							>
								<div className='flex items-center space-x-2 mb-2'>
									<Clock size={16} className='text-slate-500' />
									<span className='text-sm font-medium text-slate-500'>Order Date</span>
								</div>
								<div className='text-lg font-semibold text-slate-900'>{ORDER_CONFIG.order.date}</div>
							</motion.div>

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.5 }}
								className='bg-slate-50 rounded-xl p-4'
							>
								<div className='flex items-center space-x-2 mb-2'>
									<CreditCard size={16} className='text-slate-500' />
									<span className='text-sm font-medium text-slate-500'>Payment Method</span>
								</div>
								<div className='text-lg font-semibold text-slate-900'>{ORDER_CONFIG.order.paymentMethod}</div>
								<div className='text-xs text-slate-500 mt-1 font-mono'>{ORDER_CONFIG.order.transactionHash}</div>
							</motion.div>

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.6 }}
								className='bg-slate-50 rounded-xl p-4'
							>
								<div className='flex items-center space-x-2 mb-2'>
									<Truck size={16} className='text-slate-500' />
									<span className='text-sm font-medium text-slate-500'>Delivery</span>
								</div>
								<div className='text-lg font-semibold text-slate-900'>{ORDER_CONFIG.order.estimatedDelivery}</div>
								<div className='text-xs text-slate-500 mt-1'>Tracking: {ORDER_CONFIG.order.tracking}</div>
							</motion.div>
						</div>

						{/* Items Table */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.7 }}
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
									{ORDER_CONFIG.items.map((item, index) => (
										<motion.div
											key={item.id}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: 0.8 + index * 0.1 }}
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
							transition={{ delay: 1.0 }}
							className='flex justify-end mb-8'
						>
							<div className='w-full max-w-md'>
								<div className='bg-slate-50 rounded-xl p-6'>
									<h3 className='text-lg font-semibold text-slate-900 mb-4'>Order Summary</h3>
									<div className='space-y-3'>
										<div className='flex justify-between'>
											<span className='text-slate-600'>Subtotal</span>
											<span className='font-semibold text-slate-900'>${ORDER_CONFIG.summary.subtotal.toFixed(2)}</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-slate-600'>Shipping</span>
											<span className='font-semibold text-slate-900'>${ORDER_CONFIG.summary.shipping.toFixed(2)}</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-slate-600'>Tax</span>
											<span className='font-semibold text-slate-900'>${ORDER_CONFIG.summary.tax.toFixed(2)}</span>
										</div>
										<div className='flex justify-between text-green-600'>
											<span>Discount</span>
											<span className='font-semibold'>-${ORDER_CONFIG.summary.discount.toFixed(2)}</span>
										</div>
										<div className='border-t border-slate-200 pt-3'>
											<div className='flex justify-between text-lg'>
												<span className='font-bold text-slate-900'>Total</span>
												<span className='font-bold text-slate-900'>${ORDER_CONFIG.summary.total.toFixed(2)}</span>
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
							transition={{ delay: 1.1 }}
							className='mb-8'
						>
							<h3 className='text-lg font-semibold text-slate-900 mb-6'>Order Tracking</h3>
							<div className='space-y-4'>
								{ORDER_CONFIG.timeline.map((step, index) => (
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
												{step.status}
											</div>
											<div className='text-sm text-slate-600'>{step.time}</div>
										</div>
									</div>
								))}
							</div>
						</motion.div>

						{/* Actions */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 1.2 }}
							className='flex flex-wrap gap-4 pt-6 border-t border-slate-200'
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
													<title>Invoice #${ORDER_CONFIG.order.id}</title>
													<style>
														body { font-family: Arial, sans-serif; margin: 40px; }
														.header { text-align: center; margin-bottom: 40px; }
														.company-info, .customer-info { margin: 20px 0; }
														.items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
														.items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
														.items-table th { background-color: #f2f2f2; }
														.total { text-align: right; font-weight: bold; font-size: 18px; }
													</style>
												</head>
												<body>
													<div class="header">
														<h1>${ORDER_CONFIG.company.name} Invoice</h1>
														<h2>Order #${ORDER_CONFIG.order.id}</h2>
													</div>
													
													<div class="company-info">
														<h3>From:</h3>
														<p>${ORDER_CONFIG.company.name}</p>
														<p>${ORDER_CONFIG.company.address}</p>
														<p>${ORDER_CONFIG.company.email}</p>
													</div>

													<div class="customer-info">
														<h3>Bill To:</h3>
														<p>${ORDER_CONFIG.customer.name}</p>
														<p>${ORDER_CONFIG.customer.email}</p>
														<p>${ORDER_CONFIG.customer.address.street}</p>
														<p>${ORDER_CONFIG.customer.address.city}, ${ORDER_CONFIG.customer.address.state} ${ORDER_CONFIG.customer.address.zip}</p>
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
															${ORDER_CONFIG.items.map(item => `
																<tr>
																	<td>${item.name}<br><small>${item.description}</small></td>
																	<td>${item.quantity}</td>
																	<td>$${item.price.toFixed(2)}</td>
																	<td>$${(item.quantity * item.price).toFixed(2)}</td>
																</tr>
															`).join('')}
														</tbody>
													</table>

													<div class="total">
														<p>Subtotal: $${ORDER_CONFIG.summary.subtotal.toFixed(2)}</p>
														<p>Shipping: $${ORDER_CONFIG.summary.shipping.toFixed(2)}</p>
														<p>Tax: $${ORDER_CONFIG.summary.tax.toFixed(2)}</p>
														<p>Discount: -$${ORDER_CONFIG.summary.discount.toFixed(2)}</p>
														<hr>
														<p>Total: $${ORDER_CONFIG.summary.total.toFixed(2)}</p>
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

							<motion.button
								whileHover={{ scale: 1.02, y: -2 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => {
									// Open email client with pre-filled invoice email
									const subject = `Invoice #${ORDER_CONFIG.order.id} - Shoq`;
									const body = `Hi,\n\nPlease find attached your invoice for order #${ORDER_CONFIG.order.id}.\n\nOrder Details:\n- Total: $${ORDER_CONFIG.summary.total.toFixed(2)}\n- Date: ${ORDER_CONFIG.order.date}\n- Status: ${ORDER_CONFIG.order.status}\n\nThank you for your business!\n\nBest regards,\nShoq Team`;
									const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
									window.open(mailtoLink);
								}}
								className='flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300'
							>
								<Mail size={18} />
								<span>Email Invoice</span>
							</motion.button>

							<motion.button
								whileHover={{ scale: 1.02, y: -2 }}
								whileTap={{ scale: 0.98 }}
								onClick={async () => {
									// Copy current page URL to clipboard
									try {
										await navigator.clipboard.writeText(window.location.href);
										// You could add a toast notification here
										alert('Invoice link copied to clipboard!');
									} catch (err) {
										console.error('Failed to copy link:', err);
									}
								}}
								className='flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300'
							>
								<Copy size={18} />
								<span>Copy Link</span>
							</motion.button>

							<motion.button
								whileHover={{ scale: 1.02, y: -2 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => {
									// Use Web Share API if available, otherwise fallback
									if (navigator.share) {
										navigator.share({
											title: `Shoq Invoice #${ORDER_CONFIG.order.id}`,
											text: `Check out my order invoice from Shoq - Order #${ORDER_CONFIG.order.id}`,
											url: window.location.href,
										});
									} else {
										// Fallback to social media share
										const url = encodeURIComponent(window.location.href);
										const text = encodeURIComponent(`Check out my order invoice from Shoq - Order #${ORDER_CONFIG.order.id}`);
										const shareUrls = [
											`https://twitter.com/intent/tweet?url=${url}&text=${text}`,
											`https://www.facebook.com/sharer/sharer.php?u=${url}`,
											`https://www.linkedin.com/sharing/share-offsite/?url=${url}`
										];
										// For simplicity, open Twitter share
										window.open(shareUrls[0], '_blank');
									}
								}}
								className='flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300'
							>
								<Share2 size={18} />
								<span>Share</span>
							</motion.button>
						</motion.div>

						{/* Support Section */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 1.3 }}
							className='mt-8 p-6 bg-purple-50 rounded-xl border border-purple-200'
						>
							<div className='flex items-start space-x-3'>
								<div className='flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
									<Mail size={16} className='text-purple-600' />
								</div>
								<div>
									<h4 className='font-semibold text-slate-900 mb-1'>Need Help?</h4>
									<p className='text-slate-600 text-sm mb-3'>
										Questions about your order? Our support team is here to help you 24/7.
									</p>
									<motion.a
										href='https://t.me/HeyShoqBot'
										whileHover={{ scale: 1.02 }}
										className='inline-flex items-center space-x-2 text-purple-600 font-medium hover:text-purple-700 transition-colors duration-200'
									>
										<span>Contact Support</span>
										<Share2 size={14} />
									</motion.a>
								</div>
							</div>
						</motion.div>
					</div>
				</motion.div>

				{/* Footer */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1.4 }}
					className='text-center mt-8 text-slate-500 text-sm'
				>
					<p>This invoice was generated by Shoq AI • Powered by secure blockchain transactions</p>
				</motion.div>
			</div>
		</div>
	);
};

export default OrderInvoice;
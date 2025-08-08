'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WalletHeader from '../../components/WalletHeader';
import {
	Search,
	Package,
	Clock,
	CheckCircle,
	XCircle,
	Truck,
	Eye,
	Download,
	DollarSign,
	User,
	ArrowUpDown,
	ChevronDown,
	Loader2,
} from 'lucide-react';
import Link from 'next/link';

// Types for orders
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

export default function OrdersPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [sortBy, setSortBy] = useState('createdAt');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

	// Fetch orders from API
	const fetchOrders = async () => {
		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams();
			if (statusFilter !== 'all') params.append('status', statusFilter);
			if (searchTerm) params.append('search', searchTerm);
			params.append('sortBy', sortBy);
			params.append('sortOrder', sortOrder);

			const response = await fetch(`/api/orders?${params.toString()}`);
			const data = await response.json();

			if (data.success) {
				setOrders(data.orders || []);
				setFilteredOrders(data.orders || []);
			} else {
				setError(data.message || 'Failed to fetch orders');
			}
		} catch (err) {
			setError('Failed to fetch orders');
			console.error('Error fetching orders:', err);
		} finally {
			setLoading(false);
		}
	};

	// Load orders on component mount
	useEffect(() => {
		fetchOrders();
	}, []);

	// Refetch when filters change
	useEffect(() => {
		fetchOrders();
	}, [statusFilter, searchTerm, sortBy, sortOrder]);

	const getStatusIcon = (status: string) => {
		switch (status.toLowerCase()) {
			case 'pending':
				return <Clock size={16} className='text-yellow-600' />;
			case 'confirmed':
				return <CheckCircle size={16} className='text-green-600' />;
			case 'processing':
				return <Package size={16} className='text-blue-600' />;
			case 'shipped':
				return <Truck size={16} className='text-indigo-600' />;
			case 'delivered':
				return <CheckCircle size={16} className='text-green-600' />;
			case 'cancelled':
				return <XCircle size={16} className='text-red-600' />;
			default:
				return <Clock size={16} className='text-gray-600' />;
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

	const handleSearch = (term: string) => {
		setSearchTerm(term);
	};

	const handleStatusFilter = (status: string) => {
		setStatusFilter(status);
	};

	const handleSort = (field: string) => {
		const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
		setSortBy(field);
		setSortOrder(newOrder);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const getTotalItems = (items: any[]) => {
		return items.reduce((sum, item) => sum + item.quantity, 0);
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50'>
			<WalletHeader />
			<div className='py-8 px-4'>
				<div className='max-w-7xl mx-auto'>
					{/* Header */}
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className='mb-8'
					>
						<h1 className='text-4xl font-bold text-slate-900 mb-2'>
							Orders Dashboard
						</h1>
						<p className='text-slate-600'>
							Manage and track all your Shoq orders
						</p>
					</motion.div>

					{/* Stats Cards */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'
					>
						<div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-slate-600 text-sm font-medium'>
										Total Orders
									</p>
									<p className='text-3xl font-bold text-slate-900'>
										{orders.length}
									</p>
								</div>
								<div className='p-3 bg-purple-100 rounded-xl'>
									<Package size={24} className='text-purple-600' />
								</div>
							</div>
						</div>

						<div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-slate-600 text-sm font-medium'>
										Confirmed
									</p>
									<p className='text-3xl font-bold text-green-600'>
										{orders.filter((o) => o.status === 'confirmed').length}
									</p>
								</div>
								<div className='p-3 bg-green-100 rounded-xl'>
									<CheckCircle size={24} className='text-green-600' />
								</div>
							</div>
						</div>

						<div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-slate-600 text-sm font-medium'>
										Processing
									</p>
									<p className='text-3xl font-bold text-blue-600'>
										{orders.filter((o) => o.status === 'processing').length}
									</p>
								</div>
								<div className='p-3 bg-blue-100 rounded-xl'>
									<Clock size={24} className='text-blue-600' />
								</div>
							</div>
						</div>

						<div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-slate-600 text-sm font-medium'>
										Total Revenue
									</p>
									<p className='text-3xl font-bold text-indigo-600'>
										$
										{orders
											.reduce((sum, order) => sum + order.totalPrice, 0)
											.toFixed(2)}
									</p>
								</div>
								<div className='p-3 bg-indigo-100 rounded-xl'>
									<DollarSign size={24} className='text-indigo-600' />
								</div>
							</div>
						</div>
					</motion.div>

					{/* Filters and Search */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100 mb-8'
					>
						<div className='flex flex-col lg:flex-row gap-4 items-center justify-between'>
							{/* Search */}
							<div className='relative flex-1 max-w-md'>
								<Search
									size={20}
									className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400'
								/>
								<input
									type='text'
									placeholder='Search orders...'
									value={searchTerm}
									onChange={(e) => handleSearch(e.target.value)}
									className='w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
								/>
							</div>

							{/* Status Filter */}
							<div className='flex items-center space-x-2'>
								<select
									value={statusFilter}
									onChange={(e) => handleStatusFilter(e.target.value)}
									className='px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
								>
									<option value='all'>All Status</option>
									<option value='pending'>Pending</option>
									<option value='confirmed'>Confirmed</option>
									<option value='processing'>Processing</option>
									<option value='shipped'>Shipped</option>
									<option value='delivered'>Delivered</option>
									<option value='cancelled'>Cancelled</option>
								</select>
							</div>

							{/* Export */}
							<motion.button
								whileHover={{ scale: 1.02, y: -1 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => {
									// Export orders to CSV
									const csvContent = [
										[
											'Order ID',
											'Customer',
											'Items',
											'Status',
											'Date',
											'Total',
										],
										...filteredOrders.map((order) => [
											order.orderId,
											order.userId.name,
											`${getTotalItems(order.items)} item(s)`,
											order.status,
											formatDate(order.createdAt),
											`$${order.totalPrice.toFixed(2)}`,
										]),
									];

									const csvString = csvContent
										.map((row) => row.map((cell) => `"${cell}"`).join(','))
										.join('\n');

									const blob = new Blob([csvString], { type: 'text/csv' });
									const url = window.URL.createObjectURL(blob);
									const a = document.createElement('a');
									a.href = url;
									a.download = `shoq-orders-${new Date()
										.toISOString()
										.slice(0, 10)}.csv`;
									document.body.appendChild(a);
									a.click();
									document.body.removeChild(a);
									window.URL.revokeObjectURL(url);
								}}
								className='flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300'
							>
								<Download size={18} />
								<span>Export</span>
							</motion.button>
						</div>
					</motion.div>

					{/* Orders Table */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className='bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden'
					>
						{/* Table Header */}
						<div className='px-6 py-4 border-b border-slate-200 bg-slate-50'>
							<div className='grid grid-cols-12 gap-4 items-center text-sm font-semibold text-slate-600 uppercase tracking-wide'>
								<div className='col-span-3'>
									<button
										onClick={() => handleSort('orderId')}
										className='flex items-center space-x-1 hover:text-slate-900 transition-colors'
									>
										<span>Order</span>
										<ArrowUpDown size={12} />
									</button>
								</div>
								<div className='col-span-2'>
									<button
										onClick={() => handleSort('userId')}
										className='flex items-center space-x-1 hover:text-slate-900 transition-colors'
									>
										<span>Customer</span>
										<ArrowUpDown size={12} />
									</button>
								</div>
								<div className='col-span-2'>Items</div>
								<div className='col-span-1'>
									<button
										onClick={() => handleSort('status')}
										className='flex items-center space-x-1 hover:text-slate-900 transition-colors'
									>
										<span>Status</span>
										<ArrowUpDown size={12} />
									</button>
								</div>
								<div className='col-span-2'>
									<button
										onClick={() => handleSort('createdAt')}
										className='flex items-center space-x-1 hover:text-slate-900 transition-colors'
									>
										<span>Date</span>
										<ArrowUpDown size={12} />
									</button>
								</div>
								<div className='col-span-1'>
									<button
										onClick={() => handleSort('totalPrice')}
										className='flex items-center space-x-1 hover:text-slate-900 transition-colors'
									>
										<span>Total</span>
										<ArrowUpDown size={12} />
									</button>
								</div>
								<div className='col-span-1 text-center'>Actions</div>
							</div>
						</div>

						{/* Table Body */}
						{loading ? (
							<div className='px-6 py-12 text-center'>
								<Loader2
									size={48}
									className='text-purple-600 mx-auto mb-4 animate-spin'
								/>
								<h3 className='text-lg font-semibold text-slate-900 mb-2'>
									Loading orders...
								</h3>
								<p className='text-slate-600'>
									Please wait while we fetch your orders
								</p>
							</div>
						) : error ? (
							<div className='px-6 py-12 text-center'>
								<XCircle size={48} className='text-red-500 mx-auto mb-4' />
								<h3 className='text-lg font-semibold text-slate-900 mb-2'>
									Error loading orders
								</h3>
								<p className='text-slate-600 mb-4'>{error}</p>
								<button
									onClick={fetchOrders}
									className='bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors'
								>
									Try Again
								</button>
							</div>
						) : (
							<div className='divide-y divide-slate-200'>
								{filteredOrders.map((order, index) => (
									<motion.div
										key={order._id}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.1 * index }}
										className='px-6 py-4 hover:bg-slate-50 transition-colors duration-200'
									>
										<div className='grid grid-cols-12 gap-4 items-center'>
											{/* Order Info */}
											<div className='col-span-3'>
												<div className='font-semibold text-slate-900'>
													{order.orderId}
												</div>
												<div className='text-sm text-slate-600'>
													{getTotalItems(order.items)} item
													{getTotalItems(order.items) !== 1 ? 's' : ''}
												</div>
											</div>

											{/* Customer */}
											<div className='col-span-2'>
												<div className='flex items-center space-x-2'>
													<div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
														<User size={14} className='text-purple-600' />
													</div>
													<div>
														<div className='font-medium text-slate-900 text-sm'>
															{order.userId.name}
														</div>
														<div className='text-xs text-slate-600'>
															{order.userId.email}
														</div>
													</div>
												</div>
											</div>

											{/* Items */}
											<div className='col-span-2'>
												<div className='text-sm text-slate-900 font-medium'>
													{order.items.length > 0
														? order.items[0].name
														: 'No items'}
												</div>
												{order.items.length > 1 && (
													<div className='text-xs text-slate-600'>
														+{order.items.length - 1} more item
														{order.items.length - 1 !== 1 ? 's' : ''}
													</div>
												)}
											</div>

											{/* Status */}
											<div className='col-span-1'>
												<div
													className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
														order.status
													)}`}
												>
													{getStatusIcon(order.status)}
													<span className='capitalize'>{order.status}</span>
												</div>
											</div>

											{/* Date */}
											<div className='col-span-2'>
												<div className='text-sm text-slate-900'>
													{formatDate(order.createdAt)}
												</div>
											</div>

											{/* Total */}
											<div className='col-span-1'>
												<div className='text-sm font-bold text-slate-900'>
													${order.totalPrice.toFixed(2)}
												</div>
											</div>

											{/* Actions */}
											<div className='col-span-1 text-center'>
												<Link href={`/orders/${order._id}`}>
													<motion.button
														whileHover={{ scale: 1.1 }}
														whileTap={{ scale: 0.9 }}
														className='p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200'
													>
														<Eye size={16} />
													</motion.button>
												</Link>
											</div>
										</div>
									</motion.div>
								))}
							</div>
						)}

						{/* Empty State */}
						{!loading && !error && filteredOrders.length === 0 && (
							<div className='px-6 py-12 text-center'>
								<Package size={48} className='text-slate-300 mx-auto mb-4' />
								<h3 className='text-lg font-semibold text-slate-900 mb-2'>
									No orders found
								</h3>
								<p className='text-slate-600'>
									Try adjusting your search or filter criteria
								</p>
							</div>
						)}
					</motion.div>
				</div>
			</div>
		</div>
	);
}

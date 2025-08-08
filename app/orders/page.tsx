'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';

// Mock data based on enhanced Order model
const mockOrders = [
	{
		_id: '66b2a1c4f123456789012345',
		orderId: 'SHQ-2024-001234',
		userId: {
			_id: '66b2a1c4f123456789012346',
			name: 'John Doe',
			email: 'john@example.com',
			chatId: 123456789,
		},
		items: [
			{
				productId: 'PROD001',
				name: 'Premium Coffee Mug',
				description: 'Ceramic coffee mug with premium finish',
				category: 'product',
				price: 13.0,
				quantity: 2,
				sku: 'MUG-001',
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
			transactionHash: '0x1234567890abcdef',
			amount: 31.99,
			currency: 'USD',
			status: 'confirmed',
		},
		subtotal: 26.0,
		shipping: 5.99,
		tax: 0,
		discount: 0,
		totalPrice: 31.99,
		status: 'confirmed',
		trackingNumber: 'TRK789456123',
		estimatedDelivery: '2024-08-10T18:00:00.000Z',
		createdAt: '2024-08-07T10:30:00.000Z',
		updatedAt: '2024-08-07T14:15:00.000Z',
	},
	{
		_id: '66b2a1c4f123456789012347',
		orderId: 'SHQ-2024-001235',
		userId: {
			_id: '66b2a1c4f123456789012348',
			name: 'Jane Smith',
			email: 'jane@example.com',
			chatId: 987654321,
		},
		items: [
			{
				productId: 'TKT001',
				name: 'Concert Ticket - Rock Band Live',
				description: 'Front row seats for Rock Band concert',
				category: 'ticket',
				price: 75.0,
				quantity: 2,
				sku: 'TKT-ROCK-001',
			},
		],
		shippingAddress: {
			street: '456 Broadway',
			city: 'New York',
			state: 'NY',
			zipCode: '10013',
			country: 'USA',
		},
		payment: {
			method: 'usdc_wallet',
			transactionHash: '0xabcdef1234567890',
			amount: 150.0,
			currency: 'USD',
			status: 'confirmed',
		},
		subtotal: 150.0,
		shipping: 0,
		tax: 0,
		discount: 0,
		totalPrice: 150.0,
		status: 'processing',
		createdAt: '2024-08-06T15:45:00.000Z',
		updatedAt: '2024-08-07T09:20:00.000Z',
	},
	{
		_id: '66b2a1c4f123456789012349',
		orderId: 'SHQ-2024-001236',
		userId: {
			_id: '66b2a1c4f123456789012350',
			name: 'Mike Johnson',
			email: 'mike@example.com',
			chatId: 456789123,
		},
		items: [
			{
				productId: 'ELEC001',
				name: 'Wireless Headphones',
				description: 'Premium noise-cancelling headphones',
				category: 'product',
				price: 129.99,
				quantity: 1,
				sku: 'HP-WRL-001',
			},
		],
		shippingAddress: {
			street: '789 Tech Ave',
			city: 'Austin',
			state: 'TX',
			zipCode: '73301',
			country: 'USA',
		},
		payment: {
			method: 'usdc_wallet',
			transactionHash: '0x9876543210fedcba',
			amount: 138.49,
			currency: 'USD',
			status: 'confirmed',
		},
		subtotal: 129.99,
		shipping: 8.5,
		tax: 0,
		discount: 0,
		totalPrice: 138.49,
		status: 'shipped',
		trackingNumber: 'TRK456123789',
		estimatedDelivery: '2024-08-09T16:00:00.000Z',
		createdAt: '2024-08-05T11:20:00.000Z',
		updatedAt: '2024-08-06T13:45:00.000Z',
	},
];

export default function OrdersPage() {
	const [orders] = useState(mockOrders);
	const [filteredOrders, setFilteredOrders] = useState(mockOrders);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [sortBy, setSortBy] = useState('createdAt');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
		filterAndSort(term, statusFilter, sortBy, sortOrder);
	};

	const handleStatusFilter = (status: string) => {
		setStatusFilter(status);
		filterAndSort(searchTerm, status, sortBy, sortOrder);
	};

	const handleSort = (field: string) => {
		const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
		setSortBy(field);
		setSortOrder(newOrder);
		filterAndSort(searchTerm, statusFilter, field, newOrder);
	};

	const filterAndSort = (
		search: string,
		status: string,
		sortField: string,
		order: 'asc' | 'desc'
	) => {
		let filtered = orders;

		// Search filter
		if (search) {
			filtered = filtered.filter(
				(order) =>
					order.orderId.toLowerCase().includes(search.toLowerCase()) ||
					order.userId.name.toLowerCase().includes(search.toLowerCase()) ||
					order.userId.email.toLowerCase().includes(search.toLowerCase()) ||
					order.items.some((item) =>
						item.name.toLowerCase().includes(search.toLowerCase())
					)
			);
		}

		// Status filter
		if (status !== 'all') {
			filtered = filtered.filter((order) => order.status === status);
		}

		// Sort
		filtered.sort((a, b) => {
			let aValue: any;
			let bValue: any;

			switch (sortField) {
				case 'createdAt':
					aValue = new Date(a.createdAt).getTime();
					bValue = new Date(b.createdAt).getTime();
					break;
				case 'totalPrice':
					aValue = a.totalPrice;
					bValue = b.totalPrice;
					break;
				case 'orderId':
					aValue = a.orderId;
					bValue = b.orderId;
					break;
				case 'status':
					aValue = a.status;
					bValue = b.status;
					break;
				default:
					aValue = a.createdAt;
					bValue = b.createdAt;
			}

			if (order === 'desc') {
				return bValue > aValue ? 1 : -1;
			} else {
				return aValue > bValue ? 1 : -1;
			}
		});

		setFilteredOrders(filtered);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const getTotalItems = (items: any[]) => {
		return items.reduce((total, item) => total + item.quantity, 0);
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
								<p className='text-slate-600 text-sm font-medium'>Confirmed</p>
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
								<p className='text-slate-600 text-sm font-medium'>Processing</p>
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
								placeholder='Search orders, customers, or items...'
								value={searchTerm}
								onChange={(e) => handleSearch(e.target.value)}
								className='w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none'
							/>
						</div>

						<div className='flex gap-3'>
							{/* Status Filter */}
							<div className='relative'>
								<select
									value={statusFilter}
									onChange={(e) => handleStatusFilter(e.target.value)}
									className='appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none cursor-pointer'
								>
									<option value='all'>All Status</option>
									<option value='pending'>Pending</option>
									<option value='confirmed'>Confirmed</option>
									<option value='processing'>Processing</option>
									<option value='shipped'>Shipped</option>
									<option value='delivered'>Delivered</option>
									<option value='cancelled'>Cancelled</option>
								</select>
								<ChevronDown
									size={16}
									className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none'
								/>
							</div>

							{/* Export */}
							<motion.button
								whileHover={{ scale: 1.02, y: -1 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => {
									// Export orders to CSV
									const csvContent = [
										['Order ID', 'Customer', 'Items', 'Status', 'Date', 'Total'],
										...filteredOrders.map(order => [
											order.orderId,
											order.userId.name,
											`${getTotalItems(order.items)} item(s)`,
											order.status,
											formatDate(order.createdAt),
											`$${order.totalPrice.toFixed(2)}`
										])
									];
									
									const csvString = csvContent
										.map(row => row.map(cell => `"${cell}"`).join(','))
										.join('\n');
									
									const blob = new Blob([csvString], { type: 'text/csv' });
									const url = window.URL.createObjectURL(blob);
									const a = document.createElement('a');
									a.href = url;
									a.download = `shoq-orders-${new Date().toISOString().slice(0, 10)}.csv`;
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
											{order.items[0].name}
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

					{/* Empty State */}
					{filteredOrders.length === 0 && (
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

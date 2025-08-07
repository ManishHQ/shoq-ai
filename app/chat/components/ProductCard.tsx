import { useState } from 'react';
import { Product } from '../../shop/page';

interface ProductCardProps {
	product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
	const [loading, setLoading] = useState(false);

	const handleQuickPurchase = async () => {
		setLoading(true);
		try {
			const customerData = {
				customerName: 'Chat User',
				customerEmail: 'user@example.com',
				quantity: 1,
				shippingAddress: '123 Main St, City, State 12345',
			};

			const response = await fetch(
				`http://localhost:8000/shop/item/${product.id}/purchase`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(customerData),
				}
			);

			const data = await response.json();

			if (data.status === 'success') {
				alert(
					`✅ Purchase successful!\nOrder ID: ${data.data.order.id}\nTotal: $${data.data.order.finalTotal}`
				);
			} else {
				alert('❌ Purchase failed: ' + data.message);
			}
		} catch (error) {
			console.error('Error purchasing product:', error);
			alert('❌ Error processing purchase');
		} finally {
			setLoading(false);
		}
	};

	const handleViewDetails = () => {
		window.open(`/shop?search=${encodeURIComponent(product.name)}`, '_blank');
	};

	return (
		<div className='bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow duration-200'>
			<div className='aspect-square relative bg-gray-100'>
				<img
					src={product.image}
					alt={product.name}
					className='w-full h-full object-cover'
					onError={(e) => {
						const target = e.target as HTMLImageElement;
					}}
				/>
				{!product.available && (
					<div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
						<span className='text-white font-semibold'>Out of Stock</span>
					</div>
				)}
				<div className='absolute top-2 left-2'>
					<span className='inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded'>
						{product.category}
					</span>
				</div>
			</div>

			<div className='p-3'>
				<h3
					className='font-semibold text-gray-900 mb-1 line-clamp-2'
					title={product.name}
				>
					{product.name}
				</h3>
				<p
					className='text-gray-600 text-sm mb-2 line-clamp-2'
					title={product.description}
				>
					{product.description}
				</p>

				<div className='flex justify-between items-center mb-3'>
					<span className='text-lg font-bold text-green-600'>
						${product.price}
					</span>
					<span className='text-xs text-gray-500'>
						{product.stock} in stock
					</span>
				</div>

				<div className='flex space-x-2'>
					<button
						onClick={handleQuickPurchase}
						disabled={!product.available || loading}
						className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
							product.available && !loading
								? 'bg-blue-600 hover:bg-blue-700 text-white'
								: 'bg-gray-300 text-gray-500 cursor-not-allowed'
						}`}
					>
						{loading ? (
							<div className='flex items-center justify-center'>
								<div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1'></div>
								Buying...
							</div>
						) : product.available ? (
							'🛒 Quick Buy'
						) : (
							'Out of Stock'
						)}
					</button>

					<button
						onClick={handleViewDetails}
						className='px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors'
						title='View in shop'
					>
						<svg
							className='w-4 h-4'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}

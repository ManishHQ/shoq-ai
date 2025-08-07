import { Product } from '../page';

interface ProductCardProps {
	product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
	const handlePurchase = async () => {
		try {
			const customerData = {
				customerName: 'John Doe',
				customerEmail: 'john@example.com',
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
				alert('Purchase successful! Order ID: ' + data.data.order.id);
			} else {
				alert('Purchase failed: ' + data.message);
			}
		} catch (error) {
			console.error('Error purchasing product:', error);
			alert('Error processing purchase');
		}
	};

	return (
		<div className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300'>
			<div className='aspect-square relative'>
				<img
					src={product.image}
					alt={product.name}
					className='w-full h-full object-cover'
				/>
				{!product.available && (
					<div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
						<span className='text-white font-semibold text-lg'>
							Out of Stock
						</span>
					</div>
				)}
			</div>

			<div className='p-4'>
				<div className='mb-2'>
					<span className='inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded'>
						{product.category}
					</span>
				</div>

				<h3 className='text-lg font-semibold text-gray-900 mb-2'>
					{product.name}
				</h3>
				<p className='text-gray-600 text-sm mb-3'>{product.description}</p>

				<div className='flex justify-between items-center mb-4'>
					<span className='text-2xl font-bold text-green-600'>
						${product.price}
					</span>
					<span className='text-sm text-gray-500'>
						{product.stock} in stock
					</span>
				</div>

				<button
					onClick={handlePurchase}
					disabled={!product.available}
					className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
						product.available
							? 'bg-blue-600 hover:bg-blue-700 text-white'
							: 'bg-gray-300 text-gray-500 cursor-not-allowed'
					}`}
				>
					{product.available ? 'Add to Cart' : 'Out of Stock'}
				</button>
			</div>
		</div>
	);
}

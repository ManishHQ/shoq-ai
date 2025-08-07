import { useState } from 'react';
import { Product } from '../../shop/page';

interface EditItemFormProps {
	item: Product;
	onItemUpdated: (item: Product) => void;
	onCancel: () => void;
}

export default function EditItemForm({
	item,
	onItemUpdated,
	onCancel,
}: EditItemFormProps) {
	const [formData, setFormData] = useState({
		name: item.name,
		price: item.price.toString(),
		category: item.category,
		description: item.description,
		stock: item.stock.toString(),
		image: item.image,
		available: item.available,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const categories = ['Clothing', 'Home', 'Electronics', 'Books', 'Office'];

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value, type } = e.target;
		const checked = (e.target as HTMLInputElement).checked;

		setFormData((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));

		if (error) setError('');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (
			!formData.name ||
			!formData.price ||
			!formData.category ||
			!formData.description
		) {
			setError('Please fill in all required fields');
			return;
		}

		try {
			setLoading(true);
			const response = await fetch(
				`http://localhost:8000/shop/admin/items/${item.id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						...formData,
						price: parseFloat(formData.price),
						stock: parseInt(formData.stock) || 0,
					}),
				}
			);

			const data = await response.json();

			if (data.status === 'success') {
				onItemUpdated(data.data.item);
			} else {
				setError(data.message || 'Failed to update item');
			}
		} catch (error) {
			console.error('Error updating item:', error);
			setError('Failed to update item');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='p-6'>
			<div className='mb-6'>
				<h2 className='text-2xl font-bold text-gray-900'>Edit Item</h2>
				<p className='text-gray-600'>Update product information</p>
			</div>

			{error && (
				<div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-md'>
					<p className='text-red-700'>{error}</p>
				</div>
			)}

			<form onSubmit={handleSubmit} className='space-y-6'>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					<div>
						<label
							htmlFor='name'
							className='block text-sm font-medium text-gray-700 mb-2'
						>
							Product Name *
						</label>
						<input
							type='text'
							id='name'
							name='name'
							value={formData.name}
							onChange={handleChange}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
							placeholder='Enter product name'
							required
						/>
					</div>

					<div>
						<label
							htmlFor='price'
							className='block text-sm font-medium text-gray-700 mb-2'
						>
							Price ($) *
						</label>
						<input
							type='number'
							id='price'
							name='price'
							value={formData.price}
							onChange={handleChange}
							step='0.01'
							min='0'
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
							placeholder='0.00'
							required
						/>
					</div>

					<div>
						<label
							htmlFor='category'
							className='block text-sm font-medium text-gray-700 mb-2'
						>
							Category *
						</label>
						<select
							id='category'
							name='category'
							value={formData.category}
							onChange={handleChange}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
							required
						>
							<option value=''>Select a category</option>
							{categories.map((cat) => (
								<option key={cat} value={cat}>
									{cat}
								</option>
							))}
						</select>
					</div>

					<div>
						<label
							htmlFor='stock'
							className='block text-sm font-medium text-gray-700 mb-2'
						>
							Stock Quantity
						</label>
						<input
							type='number'
							id='stock'
							name='stock'
							value={formData.stock}
							onChange={handleChange}
							min='0'
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
							placeholder='0'
						/>
					</div>
				</div>

				<div>
					<label
						htmlFor='description'
						className='block text-sm font-medium text-gray-700 mb-2'
					>
						Description *
					</label>
					<textarea
						id='description'
						name='description'
						value={formData.description}
						onChange={handleChange}
						rows={4}
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
						placeholder='Enter product description'
						required
					/>
				</div>

				<div>
					<label
						htmlFor='image'
						className='block text-sm font-medium text-gray-700 mb-2'
					>
						Image URL
					</label>
					<input
						type='url'
						id='image'
						name='image'
						value={formData.image}
						onChange={handleChange}
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
						placeholder='https://example.com/image.jpg'
					/>
				</div>

				<div>
					<label className='flex items-center'>
						<input
							type='checkbox'
							name='available'
							checked={formData.available}
							onChange={handleChange}
							className='mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
						/>
						<span className='text-sm font-medium text-gray-700'>
							Available for purchase
						</span>
					</label>
				</div>

				<div className='flex justify-end space-x-4 pt-6 border-t border-gray-200'>
					<button
						type='button'
						onClick={onCancel}
						className='px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium'
					>
						Cancel
					</button>
					<button
						type='submit'
						disabled={loading}
						className={`px-6 py-2 rounded-md font-medium text-white ${
							loading
								? 'bg-gray-400 cursor-not-allowed'
								: 'bg-blue-600 hover:bg-blue-700'
						}`}
					>
						{loading ? 'Updating...' : 'Update Item'}
					</button>
				</div>
			</form>
		</div>
	);
}

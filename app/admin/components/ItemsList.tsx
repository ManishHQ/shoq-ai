import { useState } from 'react';
import { Product } from '../../shop/page';

interface ItemsListProps {
	products: Product[];
	loading: boolean;
	onEdit: (item: Product) => void;
	onDelete: (id: number) => void;
	onRefresh: () => void;
}

export default function ItemsList({
	products,
	loading,
	onEdit,
	onDelete,
	onRefresh,
}: ItemsListProps) {
	const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

	const handleDelete = async (id: number) => {
		try {
			const response = await fetch(
				`http://localhost:8000/shop/admin/items/${id}`,
				{
					method: 'DELETE',
				}
			);

			const data = await response.json();

			if (data.status === 'success') {
				onDelete(id);
				setDeleteConfirm(null);
			} else {
				alert('Failed to delete item: ' + data.message);
			}
		} catch (error) {
			console.error('Error deleting item:', error);
			alert('Error deleting item');
		}
	};

	if (loading) {
		return (
			<div className='p-6'>
				<div className='flex justify-center items-center h-64'>
					<div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
				</div>
			</div>
		);
	}

	return (
		<div className='p-6'>
			<div className='flex justify-between items-center mb-6'>
				<h2 className='text-2xl font-bold text-gray-900'>Items List</h2>
				<button
					onClick={onRefresh}
					className='px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium'
				>
					Refresh
				</button>
			</div>

			{products.length === 0 ? (
				<div className='text-center py-12'>
					<p className='text-xl text-gray-500'>No items found</p>
					<p className='text-gray-400 mt-2'>
						Create your first item to get started
					</p>
				</div>
			) : (
				<div className='overflow-x-auto'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Product
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Category
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Price
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Stock
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Status
								</th>
								<th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Actions
								</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{products.map((product) => (
								<tr key={product.id} className='hover:bg-gray-50'>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div className='flex items-center'>
											<div className='flex-shrink-0 h-10 w-10'>
												<img
													className='h-10 w-10 rounded-full object-cover'
													src={product.image}
													alt={product.name}
												/>
											</div>
											<div className='ml-4'>
												<div className='text-sm font-medium text-gray-900'>
													{product.name}
												</div>
												<div className='text-sm text-gray-500 truncate max-w-xs'>
													{product.description}
												</div>
											</div>
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<span className='inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800'>
											{product.category}
										</span>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										${product.price}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{product.stock}
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<span
											className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
												product.available
													? 'bg-green-100 text-green-800'
													: 'bg-red-100 text-red-800'
											}`}
										>
											{product.available ? 'Available' : 'Out of Stock'}
										</span>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
										<div className='flex justify-end space-x-2'>
											<button
												onClick={() => onEdit(product)}
												className='text-blue-600 hover:text-blue-900'
											>
												Edit
											</button>
											{deleteConfirm === product.id ? (
												<div className='flex space-x-2'>
													<button
														onClick={() => handleDelete(product.id)}
														className='text-red-600 hover:text-red-900'
													>
														Confirm
													</button>
													<button
														onClick={() => setDeleteConfirm(null)}
														className='text-gray-600 hover:text-gray-900'
													>
														Cancel
													</button>
												</div>
											) : (
												<button
													onClick={() => setDeleteConfirm(product.id)}
													className='text-red-600 hover:text-red-900 ml-4'
												>
													Delete
												</button>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

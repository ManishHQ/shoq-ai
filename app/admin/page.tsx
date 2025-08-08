'use client';

import { useState, useEffect } from 'react';
import { Product } from '../shop/page';
import CreateItemForm from './components/CreateItemForm';
import EditItemForm from './components/EditItemForm';
import ItemsList from './components/ItemsList';

export default function AdminPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>(
		'list'
	);
	const [editingItem, setEditingItem] = useState<Product | null>(null);

	useEffect(() => {
		fetchProducts();
	}, []);

	const fetchProducts = async () => {
		try {
			setLoading(true);
			const response = await fetch('http://localhost:8000/shop');
			const data = await response.json();

			if (data.status === 'success') {
				// Map backend data to frontend format
				const mappedProducts = data.data.items.map((item: any) => ({
					id: item.productId || item._id,
					name: item.name,
					price: item.price,
					category: item.category,
					description: item.description,
					stock: item.stockQuantity || 0,
					image: item.imageUrl || item.images?.[0] || '',
					available: item.inStock || false,
				}));
				setProducts(mappedProducts);
			}
		} catch (error) {
			console.error('Error fetching products:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleItemCreated = (newItem: Product) => {
		setProducts((prev) => [...prev, newItem]);
		setActiveTab('list');
	};

	const handleItemUpdated = (updatedItem: Product) => {
		setProducts((prev) =>
			prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
		);
		setActiveTab('list');
		setEditingItem(null);
	};

	const handleItemDeleted = (deletedId: number) => {
		setProducts((prev) => prev.filter((item) => item.id !== deletedId));
	};

	const handleEdit = (item: Product) => {
		setEditingItem(item);
		setActiveTab('edit');
	};

	return (
		<div className='min-h-screen bg-gray-50'>
			<div className='container mx-auto px-4 py-8'>
				<div className='mb-8'>
					<h1 className='text-4xl font-bold text-gray-900 mb-4'>Admin Panel</h1>
					<p className='text-gray-600'>Manage your shop inventory</p>
				</div>

				{/* Tab Navigation */}
				<div className='mb-8'>
					<div className='border-b border-gray-200'>
						<nav className='-mb-px flex space-x-8'>
							<button
								onClick={() => setActiveTab('list')}
								className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === 'list'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								Items List ({products.length})
							</button>
							<button
								onClick={() => setActiveTab('create')}
								className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === 'create'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								Create New Item
							</button>
							{editingItem && (
								<button
									onClick={() => setActiveTab('edit')}
									className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
										activeTab === 'edit'
											? 'border-blue-500 text-blue-600'
											: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
									}`}
								>
									Edit: {editingItem.name}
								</button>
							)}
						</nav>
					</div>
				</div>

				{/* Tab Content */}
				<div className='bg-white rounded-lg shadow-md'>
					{activeTab === 'list' && (
						<ItemsList
							products={products}
							loading={loading}
							onEdit={handleEdit}
							onDelete={handleItemDeleted}
							onRefresh={fetchProducts}
						/>
					)}

					{activeTab === 'create' && (
						<CreateItemForm
							onItemCreated={handleItemCreated}
							onCancel={() => setActiveTab('list')}
						/>
					)}

					{activeTab === 'edit' && editingItem && (
						<EditItemForm
							item={editingItem}
							onItemUpdated={handleItemUpdated}
							onCancel={() => {
								setActiveTab('list');
								setEditingItem(null);
							}}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

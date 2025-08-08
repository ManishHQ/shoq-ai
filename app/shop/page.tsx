'use client';

import { useState, useEffect } from 'react';
import ProductCard from './components/ProductCard';
import CategoryFilter from './components/CategoryFilter';
import SearchBar from './components/SearchBar';
import PriceFilter from './components/PriceFilter';
import { API_ENDPOINTS } from '../lib/config';

export interface Product {
	id: number;
	name: string;
	price: number;
	category: string;
	available: boolean;
	description: string;
	stock: number;
	image: string;
}

export interface Category {
	id: number;
	name: string;
	count: number;
}

export default function ShopPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedCategory, setSelectedCategory] = useState<string>('');
	const [searchQuery, setSearchQuery] = useState('');
	const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
	const [sortBy, setSortBy] = useState('name');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

	useEffect(() => {
		fetchProducts();
		fetchCategories();
	}, [selectedCategory, searchQuery, priceRange, sortBy, sortOrder]);

	const fetchProducts = async () => {
		try {
			setLoading(true);
			let url = API_ENDPOINTS.SHOP;
			const params = new URLSearchParams();

			if (selectedCategory) params.append('category', selectedCategory);
			if (priceRange.min > 0)
				params.append('minPrice', priceRange.min.toString());
			if (priceRange.max < 1000)
				params.append('maxPrice', priceRange.max.toString());
			if (sortBy) params.append('sortBy', sortBy);
			if (sortOrder) params.append('sortOrder', sortOrder);
			params.append('available', 'true');

			if (params.toString()) {
				url += `?${params.toString()}`;
			}

			const response = await fetch(url);
			const data = await response.json();

			if (data.status === 'success') {
				let filteredProducts = data.data.items;

				if (searchQuery) {
					filteredProducts = filteredProducts.filter(
						(product: Product) =>
							product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
							product.description
								.toLowerCase()
								.includes(searchQuery.toLowerCase())
					);
				}

				setProducts(filteredProducts);
			}
		} catch (error) {
			console.error('Error fetching products:', error);
		} finally {
			setLoading(false);
		}
	};

	const fetchCategories = async () => {
		try {
			const response = await fetch(`${API_ENDPOINTS.SHOP}/categories`);
			const data = await response.json();

			if (data.status === 'success') {
				setCategories(data.data.categories);
			}
		} catch (error) {
			console.error('Error fetching categories:', error);
		}
	};

	const handleSearch = (query: string) => {
		setSearchQuery(query);
	};

	const handleCategoryChange = (category: string) => {
		setSelectedCategory(category);
	};

	const handlePriceRangeChange = (min: number, max: number) => {
		setPriceRange({ min, max });
	};

	const handleSortChange = (field: string, order: 'asc' | 'desc') => {
		setSortBy(field);
		setSortOrder(order);
	};

	return (
		<div className='min-h-screen bg-gray-50'>
			<div className='container mx-auto px-4 py-8'>
				<div className='mb-8'>
					<div className='flex justify-between items-start'>
						<div>
							<h1 className='text-4xl font-bold text-gray-900 mb-4'>Shop</h1>
							<p className='text-gray-600'>
								Discover amazing products at great prices
							</p>
						</div>
						<a
							href='/chat'
							className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2'
						>
							<span>💬</span>
							<span>Ask Shopping Assistant</span>
						</a>
					</div>
				</div>

				<div className='flex flex-col lg:flex-row gap-8'>
					{/* Filters Sidebar */}
					<div className='lg:w-1/4'>
						<div className='bg-white p-6 rounded-lg shadow-md space-y-6'>
							<SearchBar onSearch={handleSearch} />

							<CategoryFilter
								categories={categories}
								selectedCategory={selectedCategory}
								onCategoryChange={handleCategoryChange}
							/>

							<PriceFilter
								min={priceRange.min}
								max={priceRange.max}
								onPriceRangeChange={handlePriceRangeChange}
							/>

							<div>
								<h3 className='text-lg font-semibold text-gray-900 mb-3'>
									Sort By
								</h3>
								<div className='space-y-2'>
									<label className='flex items-center'>
										<input
											type='radio'
											name='sort'
											value='name-asc'
											checked={sortBy === 'name' && sortOrder === 'asc'}
											onChange={() => handleSortChange('name', 'asc')}
											className='mr-2'
										/>
										Name (A-Z)
									</label>
									<label className='flex items-center'>
										<input
											type='radio'
											name='sort'
											value='name-desc'
											checked={sortBy === 'name' && sortOrder === 'desc'}
											onChange={() => handleSortChange('name', 'desc')}
											className='mr-2'
										/>
										Name (Z-A)
									</label>
									<label className='flex items-center'>
										<input
											type='radio'
											name='sort'
											value='price-asc'
											checked={sortBy === 'price' && sortOrder === 'asc'}
											onChange={() => handleSortChange('price', 'asc')}
											className='mr-2'
										/>
										Price (Low to High)
									</label>
									<label className='flex items-center'>
										<input
											type='radio'
											name='sort'
											value='price-desc'
											checked={sortBy === 'price' && sortOrder === 'desc'}
											onChange={() => handleSortChange('price', 'desc')}
											className='mr-2'
										/>
										Price (High to Low)
									</label>
								</div>
							</div>
						</div>
					</div>

					{/* Products Grid */}
					<div className='lg:w-3/4'>
						<div className='mb-4 flex justify-between items-center'>
							<p className='text-gray-600'>
								{products.length}{' '}
								{products.length === 1 ? 'product' : 'products'} found
							</p>
						</div>

						{loading ? (
							<div className='flex justify-center items-center h-64'>
								<div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
							</div>
						) : products.length === 0 ? (
							<div className='text-center py-12'>
								<p className='text-xl text-gray-500'>No products found</p>
								<p className='text-gray-400 mt-2'>
									Try adjusting your filters or search terms
								</p>
							</div>
						) : (
							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
								{products.map((product) => (
									<ProductCard key={product.id} product={product} />
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

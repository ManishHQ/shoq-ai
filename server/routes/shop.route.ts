import express, { Request, Response, RequestHandler } from 'express';
import productService from '../services/productService.js';

const router = express.Router();

// Get all shop items
const getAllItems: RequestHandler = async (req, res): Promise<void> => {
	try {
		const result = await productService.getAvailableProducts();

		if (!result.success) {
			res.status(500).json({
				status: 'error',
				message: result.error || 'Failed to fetch shop items',
			});
			return;
		}

		const { category, minPrice, maxPrice, available, sortBy, sortOrder } =
			req.query;

		let filteredItems = result.products || [];

		// Filter by category
		if (category) {
			filteredItems = filteredItems.filter(
				(item: any) =>
					item.category.toLowerCase() === String(category).toLowerCase()
			);
		}

		// Filter by availability
		if (available !== undefined) {
			const isAvailable = available === 'true';
			filteredItems = filteredItems.filter(
				(item: any) => item.inStock === isAvailable
			);
		}

		// Filter by price range
		if (minPrice) {
			filteredItems = filteredItems.filter(
				(item: any) => item.price >= Number(minPrice)
			);
		}

		if (maxPrice) {
			filteredItems = filteredItems.filter(
				(item: any) => item.price <= Number(maxPrice)
			);
		}

		// Sort items
		if (sortBy) {
			const order = sortOrder === 'desc' ? -1 : 1;
			filteredItems.sort((a: any, b: any) => {
				if (sortBy === 'price') {
					return (a.price - b.price) * order;
				} else if (sortBy === 'name') {
					return a.name.localeCompare(b.name) * order;
				}
				return 0;
			});
		}

		res.json({
			status: 'success',
			data: {
				items: filteredItems,
				total: filteredItems.length,
			},
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to fetch shop items',
		});
	}
};

// Get item by ID
const getItemById: RequestHandler = async (req, res): Promise<void> => {
	try {
		const itemId = req.params.id;
		const result = await productService.getProductById(itemId);

		if (!result.success || !result.product) {
			res.status(404).json({
				status: 'error',
				message: 'Item not found',
			});
			return;
		}

		res.json({
			status: 'success',
			data: { item: result.product },
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to fetch item',
		});
	}
};

// Search items
const searchItems: RequestHandler = async (req, res): Promise<void> => {
	try {
		const query = req.params.query;
		const result = await productService.searchProducts(query);

		if (!result.success) {
			res.status(500).json({
				status: 'error',
				message: result.error || 'Failed to search items',
			});
			return;
		}

		res.json({
			status: 'success',
			data: {
				items: result.products || [],
				total: result.products?.length || 0,
				query,
			},
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to search items',
		});
	}
};

// Get categories
const getCategories: RequestHandler = async (req, res): Promise<void> => {
	try {
		const result = await productService.getAvailableProducts();

		if (!result.success) {
			res.status(500).json({
				status: 'error',
				message: 'Failed to fetch categories',
			});
			return;
		}

		// Extract unique categories from products
		const categoriesMap = new Map();
		result.products?.forEach((product: any) => {
			const category = product.category;
			if (categoriesMap.has(category)) {
				categoriesMap.set(category, categoriesMap.get(category) + 1);
			} else {
				categoriesMap.set(category, 1);
			}
		});

		const categories = Array.from(categoriesMap.entries()).map(
			([name, count], id) => ({
				id: id + 1,
				name,
				count,
			})
		);

		res.json({
			status: 'success',
			data: { categories },
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to fetch categories',
		});
	}
};

// Get featured items
const getFeaturedItems: RequestHandler = async (req, res): Promise<void> => {
	try {
		const result = await productService.getFeaturedProducts(5);

		if (!result.success) {
			res.status(500).json({
				status: 'error',
				message: 'Failed to fetch featured items',
			});
			return;
		}

		res.json({
			status: 'success',
			data: {
				items: result.products || [],
				total: result.products?.length || 0,
			},
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to fetch featured items',
		});
	}
};

// Get items by category
const getItemsByCategory: RequestHandler = async (req, res): Promise<void> => {
	try {
		const category = req.params.category.toLowerCase();
		const result = await productService.getProductsByCategory(category);

		if (!result.success) {
			res.status(500).json({
				status: 'error',
				message: 'Failed to fetch category items',
			});
			return;
		}

		const categoryItems = result.products || [];

		if (categoryItems.length === 0) {
			res.status(404).json({
				status: 'error',
				message: 'No items found in this category',
			});
			return;
		}

		res.json({
			status: 'success',
			data: {
				items: categoryItems,
				total: categoryItems.length,
				category,
			},
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to fetch category items',
		});
	}
};

// Admin: Create new item
const createItem: RequestHandler = async (req, res): Promise<void> => {
	try {
		const { name, price, category, description, stock, image } = req.body;

		// Validate required fields
		if (!name || !price || !category || !description) {
			res.status(400).json({
				status: 'error',
				message: 'Missing required fields: name, price, category, description',
			});
			return;
		}

		const result = await productService.createProduct({
			name,
			price: parseFloat(price),
			category: category.toLowerCase(),
			description,
			stockQuantity: parseInt(stock) || 0,
			imageUrl: image || '',
		});

		if (!result.success) {
			res.status(500).json({
				status: 'error',
				message: result.error || 'Failed to create item',
			});
			return;
		}

		res.status(201).json({
			status: 'success',
			message: 'Item created successfully',
			data: { item: result.product },
		});
	} catch (error) {
		console.error('Error creating item:', error);
		res.status(500).json({
			status: 'error',
			message: 'Failed to create item',
		});
	}
};

// Admin: Update item
const updateItem: RequestHandler = async (req, res): Promise<void> => {
	try {
		const itemId = req.params.id;
		const { name, price, category, description, stock, image } = req.body;

		// Validate required fields
		if (!name || !price || !category || !description) {
			res.status(400).json({
				status: 'error',
				message: 'Missing required fields: name, price, category, description',
			});
			return;
		}

		const result = await productService.updateProduct(itemId, {
			name,
			price: parseFloat(price),
			category: category.toLowerCase(),
			description,
			stockQuantity: parseInt(stock) || 0,
			imageUrl: image || '',
		});

		if (!result.success) {
			res.status(500).json({
				status: 'error',
				message: result.error || 'Failed to update item',
			});
			return;
		}

		res.json({
			status: 'success',
			message: 'Item updated successfully',
			data: { item: result.product },
		});
	} catch (error) {
		console.error('Error updating item:', error);
		res.status(500).json({
			status: 'error',
			message: 'Failed to update item',
		});
	}
};

// Admin: Delete item
const deleteItem: RequestHandler = async (req, res): Promise<void> => {
	try {
		const itemId = req.params.id;

		const result = await productService.deleteProduct(itemId);

		if (!result.success) {
			res.status(500).json({
				status: 'error',
				message: result.error || 'Failed to delete item',
			});
			return;
		}

		res.json({
			status: 'success',
			message: 'Item deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting item:', error);
		res.status(500).json({
			status: 'error',
			message: 'Failed to delete item',
		});
	}
};

// Routes
router.get('/', getAllItems);
router.get('/item/:id', getItemById);
router.get('/search/:query', searchItems);
router.get('/categories', getCategories);
router.get('/featured', getFeaturedItems);
router.get('/category/:category', getItemsByCategory);

// Admin routes
router.post('/admin/items', createItem);
router.put('/admin/items/:id', updateItem);
router.delete('/admin/items/:id', deleteItem);

export default router;

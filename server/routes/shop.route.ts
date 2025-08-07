import express, { Request, Response, RequestHandler } from 'express';

const router = express.Router();

// Hardcoded shop items data
const SHOP_ITEMS = [
	{
		id: 1,
		name: 'T-Shirt',
		price: 20,
		category: 'Clothing',
		available: true,
		description: 'Comfortable cotton t-shirt',
		stock: 50,
		image: 'https://via.placeholder.com/300x300?text=T-Shirt',
	},
	{
		id: 2,
		name: 'Coffee Mug',
		price: 8,
		category: 'Home',
		available: true,
		description: 'Ceramic coffee mug',
		stock: 100,
		image: 'https://via.placeholder.com/300x300?text=Coffee+Mug',
	},
	{
		id: 3,
		name: 'Phone Case',
		price: 15,
		category: 'Electronics',
		available: true,
		description: 'Protective phone case',
		stock: 75,
		image: 'https://via.placeholder.com/300x300?text=Phone+Case',
	},
	{
		id: 4,
		name: 'Book - Programming Guide',
		price: 25,
		category: 'Books',
		available: false,
		description: 'Complete programming guide',
		stock: 0,
		image: 'https://via.placeholder.com/300x300?text=Book',
	},
	{
		id: 5,
		name: 'Headphones',
		price: 80,
		category: 'Electronics',
		available: true,
		description: 'Wireless Bluetooth headphones',
		stock: 30,
		image: 'https://via.placeholder.com/300x300?text=Headphones',
	},
	{
		id: 6,
		name: 'Laptop Stand',
		price: 35,
		category: 'Electronics',
		available: true,
		description: 'Adjustable laptop stand',
		stock: 25,
		image: 'https://via.placeholder.com/300x300?text=Laptop+Stand',
	},
	{
		id: 7,
		name: 'Water Bottle',
		price: 12,
		category: 'Home',
		available: true,
		description: 'Stainless steel water bottle',
		stock: 60,
		image: 'https://via.placeholder.com/300x300?text=Water+Bottle',
	},
	{
		id: 8,
		name: 'Notebook',
		price: 5,
		category: 'Office',
		available: true,
		description: 'Spiral-bound notebook',
		stock: 200,
		image: 'https://via.placeholder.com/300x300?text=Notebook',
	},
	{
		id: 9,
		name: 'Wireless Mouse',
		price: 25,
		category: 'Electronics',
		available: true,
		description: 'Ergonomic wireless mouse',
		stock: 40,
		image: 'https://via.placeholder.com/300x300?text=Mouse',
	},
	{
		id: 10,
		name: 'Desk Lamp',
		price: 45,
		category: 'Home',
		available: true,
		description: 'LED desk lamp with adjustable brightness',
		stock: 20,
		image: 'https://via.placeholder.com/300x300?text=Desk+Lamp',
	},
];

// Get all shop items
const getAllItems: RequestHandler = (req, res) => {
	try {
		const { category, minPrice, maxPrice, available, sortBy, sortOrder } =
			req.query;

		let filteredItems = [...SHOP_ITEMS];

		// Filter by category
		if (category) {
			filteredItems = filteredItems.filter(
				(item) => item.category.toLowerCase() === String(category).toLowerCase()
			);
		}

		// Filter by availability
		if (available !== undefined) {
			const isAvailable = available === 'true';
			filteredItems = filteredItems.filter(
				(item) => item.available === isAvailable
			);
		}

		// Filter by price range
		if (minPrice) {
			filteredItems = filteredItems.filter(
				(item) => item.price >= Number(minPrice)
			);
		}

		if (maxPrice) {
			filteredItems = filteredItems.filter(
				(item) => item.price <= Number(maxPrice)
			);
		}

		// Sort items
		if (sortBy) {
			const order = sortOrder === 'desc' ? -1 : 1;
			filteredItems.sort((a, b) => {
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
const getItemById: RequestHandler = (req, res) => {
	try {
		const itemId = parseInt(req.params.id);
		const item = SHOP_ITEMS.find((i) => i.id === itemId);

		if (!item) {
			res.status(404).json({
				status: 'error',
				message: 'Item not found',
			});
			return;
		}

		res.json({
			status: 'success',
			data: { item },
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to fetch item',
		});
	}
};

// Purchase an item
const purchaseItem: RequestHandler = (req, res) => {
	try {
		const itemId = parseInt(req.params.id);
		const {
			customerName,
			customerEmail,
			quantity = 1,
			shippingAddress,
		} = req.body;

		const item = SHOP_ITEMS.find((i) => i.id === itemId);

		if (!item) {
			res.status(404).json({
				status: 'error',
				message: 'Item not found',
			});
			return;
		}

		if (!item.available || item.stock < quantity) {
			res.status(400).json({
				status: 'error',
				message: 'Item is not available or insufficient stock',
			});
			return;
		}

		if (!customerName || !customerEmail) {
			res.status(400).json({
				status: 'error',
				message: 'Customer name and email are required',
			});
			return;
		}

		// Simulate purchase process
		const orderId = Math.floor(Math.random() * 1000000);
		const totalPrice = item.price * quantity;
		const shippingCost = totalPrice > 50 ? 0 : 5; // Free shipping over $50
		const finalTotal = totalPrice + shippingCost;

		const order = {
			id: orderId,
			itemId: item.id,
			itemName: item.name,
			customerName,
			customerEmail,
			quantity,
			unitPrice: item.price,
			totalPrice,
			shippingCost,
			finalTotal,
			shippingAddress,
			status: 'confirmed',
			orderDate: new Date().toISOString(),
			estimatedDelivery: new Date(
				Date.now() + 7 * 24 * 60 * 60 * 1000
			).toISOString(), // 7 days from now
		};

		res.status(201).json({
			status: 'success',
			message: 'Purchase completed successfully',
			data: { order },
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to process purchase',
		});
	}
};

// Search items
const searchItems: RequestHandler = (req, res) => {
	try {
		const query = req.params.query.toLowerCase();

		const searchResults = SHOP_ITEMS.filter(
			(item) =>
				item.name.toLowerCase().includes(query) ||
				item.description.toLowerCase().includes(query) ||
				item.category.toLowerCase().includes(query)
		);

		res.json({
			status: 'success',
			data: {
				items: searchResults,
				total: searchResults.length,
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
const getCategories: RequestHandler = (req, res) => {
	try {
		const categories = [
			{ id: 1, name: 'Clothing', count: 1 },
			{ id: 2, name: 'Home', count: 3 },
			{ id: 3, name: 'Electronics', count: 4 },
			{ id: 4, name: 'Books', count: 1 },
			{ id: 5, name: 'Office', count: 1 },
		];

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
const getFeaturedItems: RequestHandler = (req, res) => {
	try {
		const featuredItems = SHOP_ITEMS.filter(
			(item) => item.stock > 20 && item.available
		);

		res.json({
			status: 'success',
			data: {
				items: featuredItems,
				total: featuredItems.length,
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
const getItemsByCategory: RequestHandler = (req, res) => {
	try {
		const category = req.params.category.toLowerCase();
		const categoryItems = SHOP_ITEMS.filter(
			(item) => item.category.toLowerCase() === category && item.available
		);

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

// Create new item (Admin)
const createItem: RequestHandler = (req, res) => {
	try {
		const { name, price, category, description, stock, image } = req.body;

		if (!name || !price || !category || !description) {
			res.status(400).json({
				status: 'error',
				message: 'Name, price, category, and description are required',
			});
			return;
		}

		const newId = Math.max(...SHOP_ITEMS.map(item => item.id)) + 1;
		
		const newItem = {
			id: newId,
			name,
			price: Number(price),
			category,
			available: true,
			description,
			stock: Number(stock) || 0,
			image: image || `https://via.placeholder.com/300x300?text=${encodeURIComponent(name)}`,
		};

		SHOP_ITEMS.push(newItem);

		res.status(201).json({
			status: 'success',
			message: 'Item created successfully',
			data: { item: newItem },
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to create item',
		});
	}
};

// Update item (Admin)
const updateItem: RequestHandler = (req, res) => {
	try {
		const itemId = parseInt(req.params.id);
		const { name, price, category, description, stock, image, available } = req.body;

		const itemIndex = SHOP_ITEMS.findIndex(item => item.id === itemId);

		if (itemIndex === -1) {
			res.status(404).json({
				status: 'error',
				message: 'Item not found',
			});
			return;
		}

		const updatedItem = {
			...SHOP_ITEMS[itemIndex],
			...(name && { name }),
			...(price !== undefined && { price: Number(price) }),
			...(category && { category }),
			...(description && { description }),
			...(stock !== undefined && { stock: Number(stock) }),
			...(image && { image }),
			...(available !== undefined && { available: Boolean(available) }),
		};

		SHOP_ITEMS[itemIndex] = updatedItem;

		res.json({
			status: 'success',
			message: 'Item updated successfully',
			data: { item: updatedItem },
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to update item',
		});
	}
};

// Delete item (Admin)
const deleteItem: RequestHandler = (req, res) => {
	try {
		const itemId = parseInt(req.params.id);
		const itemIndex = SHOP_ITEMS.findIndex(item => item.id === itemId);

		if (itemIndex === -1) {
			res.status(404).json({
				status: 'error',
				message: 'Item not found',
			});
			return;
		}

		const deletedItem = SHOP_ITEMS.splice(itemIndex, 1)[0];

		res.json({
			status: 'success',
			message: 'Item deleted successfully',
			data: { item: deletedItem },
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to delete item',
		});
	}
};

// Routes
router.get('/', getAllItems);
router.get('/item/:id', getItemById);
router.post('/item/:id/purchase', purchaseItem);
router.get('/search/:query', searchItems);
router.get('/categories', getCategories);
router.get('/featured', getFeaturedItems);
router.get('/category/:category', getItemsByCategory);

// Admin routes
router.post('/admin/items', createItem);
router.put('/admin/items/:id', updateItem);
router.delete('/admin/items/:id', deleteItem);

export default router;

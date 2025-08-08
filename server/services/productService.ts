import Product from '../models/product.model.js';

export interface ProductResult {
	success: boolean;
	products?: any[];
	product?: any;
	message?: string;
	error?: string;
}

class ProductService {
	/**
	 * Get all available products
	 */
	async getAvailableProducts(): Promise<ProductResult> {
		try {
			const products = await Product.find({
				isActive: true,
				inStock: true,
				stockQuantity: { $gt: 0 },
			}).sort({ createdAt: -1 });

			return {
				success: true,
				products: products,
			};
		} catch (error) {
			console.error('Error getting available products:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Get product by ID
	 */
	async getProductById(productId: string): Promise<ProductResult> {
		try {
			const product = await Product.findOne({ productId, isActive: true });

			if (!product) {
				return {
					success: false,
					message: 'Product not found',
					error: 'Product not found',
				};
			}

			return {
				success: true,
				product: product,
			};
		} catch (error) {
			console.error('Error getting product by ID:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Get products by category
	 */
	async getProductsByCategory(category: string): Promise<ProductResult> {
		try {
			const products = await Product.find({
				category,
				isActive: true,
				inStock: true,
				stockQuantity: { $gt: 0 },
			}).sort({ createdAt: -1 });

			return {
				success: true,
				products: products,
			};
		} catch (error) {
			console.error('Error getting products by category:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Search products
	 */
	async searchProducts(query: string): Promise<ProductResult> {
		try {
			const products = await Product.find({
				$and: [
					{
						$or: [
							{ name: { $regex: query, $options: 'i' } },
							{ description: { $regex: query, $options: 'i' } },
							{ tags: { $regex: query, $options: 'i' } },
						],
					},
					{ isActive: true },
					{ inStock: true },
					{ stockQuantity: { $gt: 0 } },
				],
			}).sort({ createdAt: -1 });

			return {
				success: true,
				products: products,
			};
		} catch (error) {
			console.error('Error searching products:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Get featured products
	 */
	async getFeaturedProducts(limit: number = 5): Promise<ProductResult> {
		try {
			const products = await Product.find({
				isActive: true,
				inStock: true,
				stockQuantity: { $gt: 0 },
			})
				.sort({ rating: -1, reviewCount: -1 })
				.limit(limit);

			return {
				success: true,
				products: products,
			};
		} catch (error) {
			console.error('Error getting featured products:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Create a new product
	 */
	async createProduct(productData: any): Promise<ProductResult> {
		try {
			// Generate a unique product ID
			const timestamp = Date.now();
			const randomSuffix = Math.random()
				.toString(36)
				.substring(2, 8)
				.toUpperCase();
			const productId = `${productData.category?.toUpperCase() || 'PROD'}${timestamp}${randomSuffix}`;

			const product = new Product({
				...productData,
				productId,
				sku: productId,
				images: productData.imageUrl ? [productData.imageUrl] : [],
				inStock: (productData.stockQuantity || 0) > 0,
				isActive: true,
				rating: 0,
				reviewCount: 0,
				tags: [productData.category?.toLowerCase() || 'general'],
			});
			await product.save();

			return {
				success: true,
				product: product,
			};
		} catch (error) {
			console.error('Error creating product:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Update product
	 */
	async updateProduct(
		productId: string,
		updateData: any
	): Promise<ProductResult> {
		try {
			const product = await Product.findOne({ productId });

			if (!product) {
				return {
					success: false,
					message: 'Product not found',
					error: 'Product not found',
				};
			}

			// Update fields
			Object.assign(product, updateData);

			// Update inStock based on stockQuantity
			product.inStock = product.stockQuantity > 0;

			await product.save();

			return {
				success: true,
				product: product,
			};
		} catch (error) {
			console.error('Error updating product:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Delete product
	 */
	async deleteProduct(productId: string): Promise<ProductResult> {
		try {
			const product = await Product.findOne({ productId });

			if (!product) {
				return {
					success: false,
					message: 'Product not found',
					error: 'Product not found',
				};
			}

			// Soft delete by setting isActive to false
			product.isActive = false;
			await product.save();

			return {
				success: true,
				message: 'Product deleted successfully',
			};
		} catch (error) {
			console.error('Error deleting product:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Update product stock
	 */
	async updateProductStock(
		productId: string,
		quantity: number
	): Promise<ProductResult> {
		try {
			const product = await Product.findOne({ productId });

			if (!product) {
				return {
					success: false,
					message: 'Product not found',
					error: 'Product not found',
				};
			}

			product.stockQuantity = quantity;
			product.inStock = quantity > 0;
			await product.save();

			return {
				success: true,
				product: product,
			};
		} catch (error) {
			console.error('Error updating product stock:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Initialize default products if none exist
	 */
	async initializeDefaultProducts(): Promise<void> {
		try {
			const productCount = await Product.countDocuments();

			if (productCount === 0) {
				const defaultProducts = [
					{
						productId: 'TSHIRT001',
						name: 'T-Shirt',
						description: 'Comfortable cotton t-shirt',
						category: 'clothing',
						price: 20,
						sku: 'TSHIRT001',
						images: [
							'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
						],
						stockQuantity: 50,
						tags: ['clothing', 't-shirt', 'cotton'],
						rating: 4.5,
						reviewCount: 10,
					},
					{
						productId: 'MUG001',
						name: 'Coffee Mug',
						description: 'Ceramic coffee mug',
						category: 'home',
						price: 8,
						sku: 'MUG001',
						images: [
							'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
						],
						stockQuantity: 100,
						tags: ['home', 'mug', 'coffee'],
						rating: 4.2,
						reviewCount: 15,
					},
					{
						productId: 'PHONECASE001',
						name: 'Phone Case',
						description: 'Protective phone case',
						category: 'electronics',
						price: 15,
						sku: 'PHONECASE001',
						images: [
							'https://images.unsplash.com/photo-1603314585442-ee3b3c16fbcf?w=400&h=300&fit=crop',
						],
						stockQuantity: 75,
						tags: ['electronics', 'phone', 'case'],
						rating: 4.0,
						reviewCount: 8,
					},
					{
						productId: 'BOOK001',
						name: 'Programming Guide',
						description: 'Comprehensive programming guide',
						category: 'books',
						price: 25,
						sku: 'BOOK001',
						images: [
							'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
						],
						stockQuantity: 30,
						tags: ['books', 'programming', 'guide'],
						rating: 4.8,
						reviewCount: 25,
					},
					{
						productId: 'HEADPHONES001',
						name: 'Headphones',
						description: 'High-quality wireless headphones',
						category: 'electronics',
						price: 80,
						sku: 'HEADPHONES001',
						images: [
							'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
						],
						stockQuantity: 20,
						tags: ['electronics', 'headphones', 'wireless'],
						rating: 4.6,
						reviewCount: 12,
					},
					// Add grocery items
					{
						productId: 'BANANA001',
						name: 'Fresh Bananas',
						description: 'Sweet and ripe bananas, perfect for snacking',
						category: 'grocery',
						price: 3.99,
						sku: 'BANANA001',
						images: [
							'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop',
						],
						stockQuantity: 100,
						tags: ['grocery', 'banana', 'fruit', 'fresh'],
						rating: 4.7,
						reviewCount: 45,
					},
					{
						productId: 'MILK001',
						name: 'Organic Milk',
						description: 'Fresh organic whole milk, 1 gallon',
						category: 'grocery',
						price: 4.99,
						sku: 'MILK001',
						images: [
							'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop',
						],
						stockQuantity: 50,
						tags: ['grocery', 'milk', 'organic', 'dairy'],
						rating: 4.5,
						reviewCount: 32,
					},
					{
						productId: 'BREAD001',
						name: 'Whole Wheat Bread',
						description: 'Fresh whole wheat bread, perfect for sandwiches',
						category: 'grocery',
						price: 2.99,
						sku: 'BREAD001',
						images: [
							'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
						],
						stockQuantity: 75,
						tags: ['grocery', 'bread', 'whole wheat', 'fresh'],
						rating: 4.3,
						reviewCount: 28,
					},
					{
						productId: 'EGGS001',
						name: 'Farm Fresh Eggs',
						description: 'Dozen farm fresh eggs',
						category: 'grocery',
						price: 3.49,
						sku: 'EGGS001',
						images: [
							'https://images.unsplash.com/photo-1569288063648-5bb8459d9c7d?w=400&h=300&fit=crop',
						],
						stockQuantity: 60,
						tags: ['grocery', 'eggs', 'farm fresh', 'protein'],
						rating: 4.6,
						reviewCount: 38,
					},
				];

				for (const productData of defaultProducts) {
					await this.createProduct(productData);
				}

				console.log('✅ Default products initialized');
			}
		} catch (error) {
			console.error('Error initializing default products:', error);
		}
	}
}

export const productService = new ProductService();
export default productService;

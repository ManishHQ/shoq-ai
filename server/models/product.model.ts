import mongoose from 'mongoose';

export interface Product extends mongoose.Document {
	productId: string;
	name: string;
	description: string;
	category: 'electronics' | 'clothing' | 'food' | 'books' | 'tickets' | 'home' | 'sports' | 'other';
	price: number;
	discountPrice?: number;
	sku: string;
	images: string[];
	inStock: boolean;
	stockQuantity: number;
	tags: string[];
	specifications?: Record<string, any>;
	vendor?: string;
	rating: number;
	reviewCount: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const productSchema = new mongoose.Schema<Product>(
	{
		productId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
		},
		category: {
			type: String,
			enum: ['electronics', 'clothing', 'food', 'books', 'tickets', 'home', 'sports', 'other'],
			required: true,
			index: true,
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
		discountPrice: {
			type: Number,
			min: 0,
		},
		sku: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		images: {
			type: [String],
			default: [],
		},
		inStock: {
			type: Boolean,
			default: true,
			index: true,
		},
		stockQuantity: {
			type: Number,
			required: true,
			min: 0,
			default: 0,
		},
		tags: {
			type: [String],
			default: [],
			index: true,
		},
		specifications: {
			type: mongoose.Schema.Types.Mixed,
		},
		vendor: {
			type: String,
			trim: true,
		},
		rating: {
			type: Number,
			min: 0,
			max: 5,
			default: 0,
		},
		reviewCount: {
			type: Number,
			min: 0,
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
			index: true,
		},
	},
	{ timestamps: true }
);

// Add text search index
productSchema.index({
	name: 'text',
	description: 'text',
	tags: 'text',
});

const Product = mongoose.model<Product>('Product', productSchema);

export default Product;
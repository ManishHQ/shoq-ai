import mongoose from 'mongoose';

export interface OrderItem {
	productId: string;
	name: string;
	description: string;
	category: 'product' | 'ticket';
	price: number;
	quantity: number;
	sku?: string;
	image?: string;
}

export interface ShippingAddress {
	street: string;
	city: string;
	state: string;
	zipCode: string;
	country: string;
}

export interface PaymentInfo {
	method: 'usdc_wallet' | 'card' | 'crypto';
	transactionHash?: string;
	amount: number;
	currency: string;
	status: 'pending' | 'confirmed' | 'failed';
}

export interface Order extends mongoose.Document {
	orderId: string;
	userId: mongoose.Types.ObjectId;
	items: OrderItem[];
	shippingAddress: ShippingAddress;
	payment: PaymentInfo;
	subtotal: number;
	shipping: number;
	tax: number;
	discount: number;
	totalPrice: number;
	status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
	trackingNumber?: string;
	estimatedDelivery?: Date;
	notes?: string;
	telegramMessageId?: string;
	createdAt: Date;
	updatedAt: Date;
}

const orderItemSchema = new mongoose.Schema({
	productId: { type: String, required: true },
	name: { type: String, required: true },
	description: { type: String, required: true },
	category: { type: String, enum: ['product', 'ticket'], required: true },
	price: { type: Number, required: true, min: 0 },
	quantity: { type: Number, required: true, min: 1, default: 1 },
	sku: { type: String },
	image: { type: String },
});

const shippingAddressSchema = new mongoose.Schema({
	street: { type: String, required: true },
	city: { type: String, required: true },
	state: { type: String, required: true },
	zipCode: { type: String, required: true },
	country: { type: String, required: true, default: 'USA' },
});

const paymentInfoSchema = new mongoose.Schema({
	method: { type: String, enum: ['usdc_wallet', 'card', 'crypto'], required: true },
	transactionHash: { type: String },
	amount: { type: Number, required: true, min: 0 },
	currency: { type: String, required: true, default: 'USD' },
	status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
});

const orderSchema = new mongoose.Schema<Order>(
	{
		orderId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		items: {
			type: [orderItemSchema],
			required: true,
			validate: {
				validator: (items: OrderItem[]) => items.length > 0,
				message: 'Order must contain at least one item',
			},
		},
		shippingAddress: {
			type: shippingAddressSchema,
			required: true,
		},
		payment: {
			type: paymentInfoSchema,
			required: true,
		},
		subtotal: {
			type: Number,
			required: true,
			min: 0,
		},
		shipping: {
			type: Number,
			required: true,
			min: 0,
			default: 0,
		},
		tax: {
			type: Number,
			required: true,
			min: 0,
			default: 0,
		},
		discount: {
			type: Number,
			min: 0,
			default: 0,
		},
		totalPrice: {
			type: Number,
			required: true,
			min: 0,
		},
		status: {
			type: String,
			enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
			default: 'pending',
			index: true,
		},
		trackingNumber: {
			type: String,
		},
		estimatedDelivery: {
			type: Date,
		},
		notes: {
			type: String,
		},
		telegramMessageId: {
			type: String,
		},
	},
	{ timestamps: true }
);

const Order = mongoose.model<Order>('Order', orderSchema);

export default Order;
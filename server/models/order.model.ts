import mongoose from 'mongoose';

export interface OrderItem {
	productId: string;
	name: string;
	price: number;
	quantity: number;
}

export interface Order extends mongoose.Document {
	orderId: string;
	userId: mongoose.Types.ObjectId;
	items: OrderItem[];
	totalPrice: number;
	status:
		| 'pending'
		| 'confirmed'
		| 'processing'
		| 'shipped'
		| 'delivered'
		| 'cancelled';
	transactionHash?: string;
	telegramMessageId?: string;
	createdAt: Date;
	updatedAt: Date;
}

const orderItemSchema = new mongoose.Schema({
	productId: { type: String, required: true },
	name: { type: String, required: true },
	price: { type: Number, required: true, min: 0 },
	quantity: { type: Number, required: true, min: 1, default: 1 },
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
		totalPrice: {
			type: Number,
			required: true,
			min: 0,
		},
		status: {
			type: String,
			enum: [
				'pending',
				'confirmed',
				'processing',
				'shipped',
				'delivered',
				'cancelled',
			],
			default: 'pending',
			index: true,
		},
		transactionHash: {
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

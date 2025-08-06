import mongoose from 'mongoose';

export interface Order extends mongoose.Document {
	orderId: string;
	userId: mongoose.Types.ObjectId;
	item: string;
	quantity: number;
	totalPrice: number;
	status: 'confirmed' | 'pending' | 'cancelled' | 'delivered';
	createdAt: Date;
	updatedAt: Date;
}

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
		item: {
			type: String,
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
			default: 1,
		},
		totalPrice: {
			type: Number,
			required: true,
			min: 0,
		},
		status: {
			type: String,
			enum: ['confirmed', 'pending', 'cancelled', 'delivered'],
			default: 'pending',
			index: true,
		},
	},
	{ timestamps: true }
);

const Order = mongoose.model<Order>('Order', orderSchema);

export default Order;
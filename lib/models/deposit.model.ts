import mongoose from 'mongoose';

export interface Deposit extends mongoose.Document {
	userId: mongoose.Types.ObjectId;
	txHash: string;
	amount: number;
	confirmed: boolean;
	walletAddress: string;
	createdAt: Date;
	updatedAt: Date;
}

const depositSchema = new mongoose.Schema<Deposit>(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		txHash: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		amount: {
			type: Number,
			required: true,
			min: 0,
		},
		confirmed: {
			type: Boolean,
			default: false,
			index: true,
		},
		walletAddress: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

const Deposit = mongoose.model<Deposit>('Deposit', depositSchema);

export default Deposit;
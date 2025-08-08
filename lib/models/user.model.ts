import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface User extends mongoose.Document {
	photo: string;
	name: string;
	username: string;
	email: string;
	password: string;
	otpCode: string;
	isVerified: boolean;
	chatId: number;
	walletAddress: string;
	balance: number;
	registeredAt: Date;
	onboardingMethod: 'telegram' | 'wallet' | 'ai';
	emailNotifications: boolean;
	comparePassword: (password: string) => Promise<boolean>;
	generateToken: () => string;
	generateOtpCode: () => string;
}

const userSchema = new mongoose.Schema<User>(
	{
		photo: {
			type: String,
		},
		name: {
			type: String,
			required: true,
		},
		username: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		email: {
			type: String,
			required: function() {
				return this.onboardingMethod !== 'telegram';
			},
			validate: {
				validator: function(email: string) {
					return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
				},
				message: 'Please provide a valid email address'
			}
		},
		password: {
			type: String,
			required: false,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		otpCode: {
			type: String,
		},
		chatId: {
			type: Number,
			required: function() {
				return this.onboardingMethod === 'telegram';
			},
			unique: true,
			sparse: true,
			index: true,
		},
		walletAddress: {
			type: String,
			required: function() {
				return this.onboardingMethod === 'wallet';
			},
			unique: true,
			sparse: true,
			index: true,
			validate: {
				validator: function(address: string) {
					return !address || /^0x[a-fA-F0-9]{40}$/.test(address);
				},
				message: 'Please provide a valid Ethereum wallet address'
			}
		},
		balance: {
			type: Number,
			default: 0,
			min: 0,
		},
		onboardingMethod: {
			type: String,
			enum: ['telegram', 'wallet', 'ai'],
			required: true,
			default: 'telegram'
		},
		emailNotifications: {
			type: Boolean,
			default: true,
		},
		registeredAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

// encrypt password before saving (only if password exists)
userSchema.pre<User>('save', async function (next) {
	if (this.isModified('password') && this.password) {
		this.password = await bcrypt.hash(this.password, 10);
	}
	next();
});

// compare password
userSchema.methods.comparePassword = async function (password: string) {
	return await bcrypt.compare(password, this.password);
};

// generate the jwt token
userSchema.methods.generateToken = function () {
	const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET!, {
		expiresIn: '1d',
	});
	return token;
};

// generate the otp code, for forgot password
userSchema.methods.generateOtpCode = function () {
	const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
	this.otpCode = otpCode;
	return otpCode;
};

const User = mongoose.model<User>('User', userSchema);

export default User;

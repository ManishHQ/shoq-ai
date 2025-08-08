import express from 'express';
import {
	login,
	register,
	getCurrentUser,
	isLoggedIn,
} from '../controllers/auth.controller.js';
import User from '../models/user.model';
import emailService from '../services/emailService.js';

const router = express.Router();

// Utility functions for validation
const validateEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

const validateWalletAddress = (address: string): boolean => {
	const walletRegex = /^0x[a-fA-F0-9]{40}$/;
	return walletRegex.test(address);
};

router.post('/login', login);
router.post('/register', register);
router.get('/current-user', isLoggedIn, getCurrentUser);

// Onboard user with wallet or other methods
router.post('/onboard', async (req, res) => {
	try {
		const { walletAddress, email, onboardingMethod, name, chatId } = req.body;

		// Validate required fields based on onboarding method
		if (
			!onboardingMethod ||
			!['telegram', 'wallet', 'ai'].includes(onboardingMethod)
		) {
			return res.status(400).json({
				success: false,
				message:
					'Valid onboarding method is required (telegram, wallet, or ai)',
			});
		}

		// Email is now required for all onboarding methods
		if (!email) {
			return res.status(400).json({
				success: false,
				message: 'Email is required for all onboarding methods',
			});
		}

		if (!validateEmail(email)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid email address format',
			});
		}

		// Method-specific validation
		if (onboardingMethod === 'wallet') {
			if (!walletAddress) {
				return res.status(400).json({
					success: false,
					message: 'Wallet address is required for wallet onboarding',
				});
			}

			if (!validateWalletAddress(walletAddress)) {
				return res.status(400).json({
					success: false,
					message: 'Invalid Ethereum wallet address format',
				});
			}
		}

		if (onboardingMethod === 'telegram' && !chatId) {
			return res.status(400).json({
				success: false,
				message: 'Chat ID is required for Telegram onboarding',
			});
		}

		// Check if user already exists
		let existingUser = null;
		if (onboardingMethod === 'wallet' && walletAddress) {
			existingUser = await User.findOne({ walletAddress });
		} else if (onboardingMethod === 'telegram' && chatId) {
			existingUser = await User.findOne({ chatId });
		} else if (email) {
			existingUser = await User.findOne({ email });
		}

		if (existingUser) {
			// Update existing user
			if (onboardingMethod === 'wallet' && email) {
				existingUser.email = email;
				existingUser.emailNotifications = true;
			}
			if (name) existingUser.name = name;

			await existingUser.save();

			return res.status(200).json({
				success: true,
				message: 'User updated successfully',
				user: {
					id: existingUser._id,
					name: existingUser.name,
					email: existingUser.email,
					walletAddress: existingUser.walletAddress,
					onboardingMethod: existingUser.onboardingMethod,
					balance: existingUser.balance,
					isVerified: existingUser.isVerified,
				},
			});
		}

		// Create new user
		const userData: any = {
			name: name || 'Anonymous User',
			username: walletAddress || `user_${Date.now()}`,
			onboardingMethod,
			emailNotifications: true,
			isVerified: false,
		};

		if (onboardingMethod === 'wallet') {
			userData.walletAddress = walletAddress;
			userData.email = email;
			userData.isVerified = true; // Wallet connection is considered verified
		}

		if (onboardingMethod === 'telegram') {
			userData.chatId = chatId;
			userData.username = name || `telegram_${chatId}`;
		}

		if (onboardingMethod === 'ai' && email) {
			userData.email = email;
		}

		const newUser = new User(userData);
		await newUser.save();

		// Send welcome email if user has email
		if (newUser.email) {
			try {
				const welcomeEmailData = {
					user: {
						name: newUser.name,
						email: newUser.email,
						username: newUser.username,
						chatId: newUser.chatId,
					},
					onboardingMethod: onboardingMethod as 'telegram' | 'wallet' | 'email',
				};

				const emailSent = await emailService.sendWelcomeEmail(welcomeEmailData);
				if (emailSent) {
					console.log(`📧 Welcome email sent to ${newUser.email}`);
				} else {
					console.log(`⚠️ Failed to send welcome email to ${newUser.email}`);
				}
			} catch (error) {
				console.error('Error sending welcome email:', error);
				// Don't fail the onboarding process if email fails
			}
		}

		// Generate JWT token
		const token = newUser.generateToken();

		res.status(201).json({
			success: true,
			message: 'User onboarded successfully',
			token,
			user: {
				id: newUser._id,
				name: newUser.name,
				email: newUser.email,
				walletAddress: newUser.walletAddress,
				onboardingMethod: newUser.onboardingMethod,
				balance: newUser.balance,
				isVerified: newUser.isVerified,
			},
		});
	} catch (error: any) {
		console.error('Onboarding error:', error);

		if (error.code === 11000) {
			// Duplicate key error
			const field = Object.keys(error.keyPattern)[0];
			return res.status(400).json({
				success: false,
				message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
			});
		}

		res.status(500).json({
			success: false,
			message: 'Internal server error during onboarding',
		});
	}
});

// Get user profile by wallet address
router.get('/profile/:walletAddress', async (req, res) => {
	try {
		const { walletAddress } = req.params;

		if (!validateWalletAddress(walletAddress)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid wallet address format',
			});
		}

		const user = await User.findOne({ walletAddress }).select(
			'-password -otpCode'
		);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			});
		}

		res.status(200).json({
			success: true,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				walletAddress: user.walletAddress,
				onboardingMethod: user.onboardingMethod,
				balance: user.balance,
				isVerified: user.isVerified,
				emailNotifications: user.emailNotifications,
				registeredAt: user.registeredAt,
			},
		});
	} catch (error) {
		console.error('Profile fetch error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		});
	}
});

// Check if user exists by multiple identifiers (for purchase flow)
router.post('/check-exists', async (req, res) => {
	try {
		const { walletAddress, chatId, email, username } = req.body;

		if (!walletAddress && !chatId && !email && !username) {
			return res.status(400).json({
				success: false,
				message: 'At least one identifier is required',
			});
		}

		let user = null;
		let foundBy = '';

		// Check by wallet address (highest priority for web users)
		if (walletAddress) {
			if (!validateWalletAddress(walletAddress)) {
				return res.status(400).json({
					success: false,
					message: 'Invalid wallet address format',
				});
			}
			user = await User.findOne({ walletAddress }).select('-password -otpCode');
			foundBy = 'walletAddress';
		}

		// Check by chat ID (for Telegram users)
		if (!user && chatId) {
			user = await User.findOne({ chatId }).select('-password -otpCode');
			foundBy = 'chatId';
		}

		// Check by email (for AI/Claude users)
		if (!user && email) {
			if (!validateEmail(email)) {
				return res.status(400).json({
					success: false,
					message: 'Invalid email format',
				});
			}
			user = await User.findOne({ email }).select('-password -otpCode');
			foundBy = 'email';
		}

		// Check by username (fallback)
		if (!user && username) {
			user = await User.findOne({ username }).select('-password -otpCode');
			foundBy = 'username';
		}

		if (user) {
			res.status(200).json({
				success: true,
				exists: true,
				foundBy,
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					username: user.username,
					walletAddress: user.walletAddress,
					chatId: user.chatId,
					onboardingMethod: user.onboardingMethod,
					isVerified: user.isVerified,
					balance: user.balance,
					registeredAt: user.registeredAt,
				},
			});
		} else {
			res.status(200).json({
				success: true,
				exists: false,
				message: 'User not found - can proceed with registration',
			});
		}
	} catch (error) {
		console.error('User check error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error during user check',
		});
	}
});

// Telegram-specific user lookup and onboarding
router.post('/telegram-user', async (req, res) => {
	try {
		const { chatId, name, username, firstName, lastName } = req.body;

		if (!chatId) {
			return res.status(400).json({
				success: false,
				message: 'Chat ID is required',
			});
		}

		// Check if user already exists
		let user = await User.findOne({ chatId });

		if (user) {
			// Update user info if provided
			let updated = false;
			if (name && name !== user.name) {
				user.name = name;
				updated = true;
			}
			if (username && username !== user.username) {
				user.username = username;
				updated = true;
			}

			if (updated) {
				await user.save();
			}

			return res.status(200).json({
				success: true,
				exists: true,
				user: {
					id: user._id,
					name: user.name,
					username: user.username,
					chatId: user.chatId,
					onboardingMethod: user.onboardingMethod,
					isVerified: user.isVerified,
					balance: user.balance,
				},
			});
		}

		// Create new Telegram user
		const displayName =
			name ||
			[firstName, lastName].filter(Boolean).join(' ') ||
			`User_${chatId}`;
		const telegramUsername = username || `tg_${chatId}`;

		const newUser = new User({
			name: displayName,
			username: telegramUsername,
			chatId,
			onboardingMethod: 'telegram',
			isVerified: true, // Telegram users are considered verified
			emailNotifications: false, // No email for telegram-only users
		});

		await newUser.save();

		res.status(201).json({
			success: true,
			exists: false,
			message: 'User created successfully',
			user: {
				id: newUser._id,
				name: newUser.name,
				username: newUser.username,
				chatId: newUser.chatId,
				onboardingMethod: newUser.onboardingMethod,
				isVerified: newUser.isVerified,
				balance: newUser.balance,
			},
		});
	} catch (error) {
		console.error('Telegram user error:', error);

		if (error.code === 11000) {
			return res.status(400).json({
				success: false,
				message: 'User with this chat ID already exists',
			});
		}

		res.status(500).json({
			success: false,
			message: 'Internal server error during Telegram user processing',
		});
	}
});

export default router;

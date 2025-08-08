'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Wallet,
	Mail,
	MessageCircle,
	Bot,
	CheckCircle,
	ArrowRight,
	Shield,
	Coins,
	RefreshCw,
	User,
	AlertTriangle,
	Copy,
	ExternalLink,
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import WalletHeader from '../../components/WalletHeader';

// Configuration object
const ONBOARD_CONFIG = {
	title: 'Welcome to Shoq',
	subtitle: 'Choose your preferred way to get started',
	methods: [
		{
			id: 'wallet',
			title: 'Connect Wallet',
			description: 'Use your crypto wallet for secure payments and refunds',
			icon: Wallet,
			benefits: ['Instant payments', 'Easy refunds', 'Secure transactions', 'No signup required'],
			color: 'from-purple-600 to-indigo-600',
			bgColor: 'bg-purple-50',
			textColor: 'text-purple-600',
		},
		{
			id: 'telegram',
			title: 'Telegram Bot',
			description: 'Start shopping directly through our Telegram bot',
			icon: MessageCircle,
			benefits: ['Quick ordering', 'Chat support', 'Order tracking', 'Community access'],
			color: 'from-blue-500 to-cyan-500',
			bgColor: 'bg-blue-50',
			textColor: 'text-blue-600',
		},
		{
			id: 'ai',
			title: 'AI Assistant',
			description: 'Let our AI help you find and order products',
			icon: Bot,
			benefits: ['Personalized recommendations', 'Smart search', 'Voice ordering', 'Auto-reorder'],
			color: 'from-emerald-500 to-teal-500',
			bgColor: 'bg-emerald-50',
			textColor: 'text-emerald-600',
		},
	],
	emailForm: {
		title: 'Complete Your Setup',
		subtitle: 'We need your email to send order confirmations and invoices',
		placeholder: 'Enter your email address',
		benefits: [
			'Order confirmations',
			'Shipping notifications',
			'Digital receipts',
			'Exclusive deals',
		],
	},
	features: [
		{
			icon: Shield,
			title: 'Secure Payments',
			description: 'Your wallet, your control',
		},
		{
			icon: Coins,
			title: 'Easy Refunds',
			description: 'Instant refunds to your wallet',
		},
		{
			icon: RefreshCw,
			title: 'Balance Management',
			description: 'Withdraw balance anytime',
		},
	],
};

export default function OnboardPage() {
	const { address, isConnected } = useAccount();
	const { disconnect } = useDisconnect();
	const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
	const [step, setStep] = useState<'method' | 'wallet' | 'email' | 'complete'>('method');
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (isConnected && address && selectedMethod === 'wallet') {
			setStep('email');
		}
	}, [isConnected, address, selectedMethod]);

	const handleMethodSelect = (methodId: string) => {
		setSelectedMethod(methodId);
		setError('');

		if (methodId === 'wallet') {
			setStep('wallet');
		} else if (methodId === 'telegram') {
			// Redirect to Telegram bot
			window.open('https://t.me/your_shoq_bot', '_blank');
		} else if (methodId === 'ai') {
			// Redirect to AI chat interface
			window.open('/chat', '_blank');
		}
	};

	const handleEmailSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email || !address) return;

		setLoading(true);
		setError('');

		try {
			// Call API to create/update user with wallet address and email
			const response = await fetch('/api/auth/onboard', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					walletAddress: address,
					email,
					onboardingMethod: 'wallet',
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Failed to complete onboarding');
			}

			setStep('complete');
		} catch (err: any) {
			setError(err.message || 'Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const copyWalletAddress = async () => {
		if (address) {
			await navigator.clipboard.writeText(address);
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50'>
			<WalletHeader />
			<div className='py-8 px-4'>
				<div className='max-w-6xl mx-auto'>
				<AnimatePresence mode='wait'>
					{step === 'method' && (
						<motion.div
							key='method'
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							className='text-center'
						>
							{/* Header */}
							<div className='mb-12'>
								<motion.h1
									initial={{ opacity: 0, y: -20 }}
									animate={{ opacity: 1, y: 0 }}
									className='text-5xl font-bold text-slate-900 mb-4'
								>
									{ONBOARD_CONFIG.title}
								</motion.h1>
								<motion.p
									initial={{ opacity: 0, y: -20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
									className='text-xl text-slate-600'
								>
									{ONBOARD_CONFIG.subtitle}
								</motion.p>
							</div>

							{/* Onboarding Methods */}
							<div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-16'>
								{ONBOARD_CONFIG.methods.map((method, index) => {
									const Icon = method.icon;
									return (
										<motion.div
											key={method.id}
											initial={{ opacity: 0, y: 30 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.2 + index * 0.1 }}
											whileHover={{ y: -8, scale: 1.02 }}
											onClick={() => handleMethodSelect(method.id)}
											className='bg-white rounded-3xl p-8 shadow-xl border border-slate-100 cursor-pointer group hover:shadow-2xl transition-all duration-300'
										>
											<div className={`w-20 h-20 ${method.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
												<Icon size={32} className={method.textColor} />
											</div>
											<h3 className='text-2xl font-bold text-slate-900 mb-3'>{method.title}</h3>
											<p className='text-slate-600 mb-6 leading-relaxed'>{method.description}</p>
											
											<div className='space-y-3'>
												{method.benefits.map((benefit, i) => (
													<div key={i} className='flex items-center justify-center space-x-2 text-sm text-slate-700'>
														<CheckCircle size={16} className={method.textColor} />
														<span>{benefit}</span>
													</div>
												))}
											</div>

											<motion.button
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												className={`w-full mt-8 bg-gradient-to-r ${method.color} text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2`}
											>
												<span>Get Started</span>
												<ArrowRight size={20} />
											</motion.button>
										</motion.div>
									);
								})}
							</div>

							{/* Features */}
							<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
								{ONBOARD_CONFIG.features.map((feature, index) => {
									const Icon = feature.icon;
									return (
										<motion.div
											key={index}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.5 + index * 0.1 }}
											className='text-center'
										>
											<div className='w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
												<Icon size={24} className='text-purple-600' />
											</div>
											<h3 className='text-lg font-semibold text-slate-900 mb-2'>{feature.title}</h3>
											<p className='text-slate-600 text-sm'>{feature.description}</p>
										</motion.div>
									);
								})}
							</div>
						</motion.div>
					)}

					{step === 'wallet' && (
						<motion.div
							key='wallet'
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							className='max-w-2xl mx-auto text-center'
						>
							<div className='bg-white rounded-3xl p-12 shadow-xl border border-slate-100'>
								<div className='w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-8'>
									<Wallet size={32} className='text-purple-600' />
								</div>
								
								<h1 className='text-4xl font-bold text-slate-900 mb-4'>Connect Your Wallet</h1>
								<p className='text-xl text-slate-600 mb-12'>
									Connect your crypto wallet to start shopping with Shoq
								</p>

								<div className='space-y-6'>
									<ConnectButton.Custom>
										{({
											account,
											chain,
											openAccountModal,
											openChainModal,
											openConnectModal,
											authenticationStatus,
											mounted,
										}) => {
											const ready = mounted && authenticationStatus !== 'loading';
											const connected =
												ready &&
												account &&
												chain &&
												(!authenticationStatus ||
													authenticationStatus === 'authenticated');

											return (
												<div
													{...(!ready && {
														'aria-hidden': true,
														'style': {
															opacity: 0,
															pointerEvents: 'none',
															userSelect: 'none',
														},
													})}
												>
													{(() => {
														if (!connected) {
															return (
																<motion.button
																	whileHover={{ scale: 1.02, y: -1 }}
																	whileTap={{ scale: 0.98 }}
																	onClick={openConnectModal}
																	className='w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-12 py-6 rounded-xl font-bold text-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-3'
																>
																	<Wallet size={24} />
																	<span>Connect Wallet</span>
																</motion.button>
															);
														}

														if (chain.unsupported) {
															return (
																<motion.button
																	whileHover={{ scale: 1.02, y: -1 }}
																	whileTap={{ scale: 0.98 }}
																	onClick={openChainModal}
																	className='w-full bg-red-600 text-white px-12 py-6 rounded-xl font-bold text-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-3'
																>
																	<AlertTriangle size={24} />
																	<span>Wrong network</span>
																</motion.button>
															);
														}

														return (
															<div className='space-y-4'>
																<div className='bg-green-50 border border-green-200 rounded-xl p-6'>
																	<div className='flex items-center justify-center space-x-2 text-green-700 mb-4'>
																		<CheckCircle size={20} />
																		<span className='font-semibold'>Wallet Connected!</span>
																	</div>
																	<div className='space-y-2 text-sm'>
																		<div className='flex items-center justify-between'>
																			<span className='text-slate-600'>Address:</span>
																			<div className='flex items-center space-x-2'>
																				<code className='text-slate-900 bg-slate-100 px-2 py-1 rounded'>
																					{account.address?.slice(0, 6)}...{account.address?.slice(-4)}
																				</code>
																				<button
																					onClick={copyWalletAddress}
																					className='text-slate-600 hover:text-purple-600 transition-colors'
																				>
																					<Copy size={14} />
																				</button>
																			</div>
																		</div>
																		<div className='flex items-center justify-between'>
																			<span className='text-slate-600'>Network:</span>
																			<span className='text-slate-900 font-medium'>{chain.name}</span>
																		</div>
																	</div>
																</div>
															</div>
														);
													})()}
												</div>
											);
										}}
									</ConnectButton.Custom>

									<div className='flex justify-center space-x-4'>
										<motion.button
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											onClick={() => setStep('method')}
											className='px-8 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all duration-300'
										>
											Back
										</motion.button>
									</div>
								</div>
							</div>
						</motion.div>
					)}

					{step === 'email' && (
						<motion.div
							key='email'
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							className='max-w-2xl mx-auto'
						>
							<div className='bg-white rounded-3xl p-12 shadow-xl border border-slate-100'>
								<div className='text-center mb-8'>
									<div className='w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6'>
										<Mail size={32} className='text-blue-600' />
									</div>
									<h1 className='text-4xl font-bold text-slate-900 mb-4'>
										{ONBOARD_CONFIG.emailForm.title}
									</h1>
									<p className='text-xl text-slate-600'>
										{ONBOARD_CONFIG.emailForm.subtitle}
									</p>
								</div>

								{/* Connected Wallet Info */}
								{address && (
									<div className='bg-green-50 border border-green-200 rounded-xl p-4 mb-8'>
										<div className='flex items-center justify-center space-x-2 text-green-700 mb-2'>
											<CheckCircle size={16} />
											<span className='text-sm font-semibold'>Wallet Connected</span>
										</div>
										<div className='text-center'>
											<code className='text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded'>
												{address.slice(0, 8)}...{address.slice(-6)}
											</code>
										</div>
									</div>
								)}

								<form onSubmit={handleEmailSubmit} className='space-y-8'>
									<div>
										<input
											type='email'
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder={ONBOARD_CONFIG.emailForm.placeholder}
											required
											className='w-full px-6 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg'
										/>
									</div>

									{error && (
										<div className='bg-red-50 border border-red-200 rounded-xl p-4'>
											<div className='flex items-center space-x-2 text-red-700'>
												<AlertTriangle size={16} />
												<span className='text-sm font-semibold'>{error}</span>
											</div>
										</div>
									)}

									<div className='grid grid-cols-2 gap-4 text-sm text-slate-600'>
										{ONBOARD_CONFIG.emailForm.benefits.map((benefit, index) => (
											<div key={index} className='flex items-center space-x-2'>
												<CheckCircle size={14} className='text-green-600 flex-shrink-0' />
												<span>{benefit}</span>
											</div>
										))}
									</div>

									<div className='flex space-x-4'>
										<motion.button
											type='button'
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											onClick={() => {
												disconnect();
												setStep('method');
											}}
											className='flex-1 px-8 py-4 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all duration-300'
										>
											Back
										</motion.button>
										<motion.button
											type='submit'
											disabled={loading || !email}
											whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
											whileTap={{ scale: loading ? 1 : 0.98 }}
											className='flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed'
										>
											{loading ? (
												<>
													<RefreshCw size={20} className='animate-spin' />
													<span>Setting up...</span>
												</>
											) : (
												<>
													<span>Complete Setup</span>
													<ArrowRight size={20} />
												</>
											)}
										</motion.button>
									</div>
								</form>
							</div>
						</motion.div>
					)}

					{step === 'complete' && (
						<motion.div
							key='complete'
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.9 }}
							className='max-w-2xl mx-auto text-center'
						>
							<div className='bg-white rounded-3xl p-12 shadow-xl border border-slate-100'>
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
									className='w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8'
								>
									<CheckCircle size={48} className='text-green-600' />
								</motion.div>
								
								<h1 className='text-4xl font-bold text-slate-900 mb-4'>Welcome to Shoq! 🎉</h1>
								<p className='text-xl text-slate-600 mb-12'>
									Your account has been set up successfully. You can now start shopping with crypto!
								</p>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
									<motion.button
										whileHover={{ scale: 1.02, y: -1 }}
										whileTap={{ scale: 0.98 }}
										onClick={() => window.location.href = '/shop'}
										className='bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2'
									>
										<span>Start Shopping</span>
										<ArrowRight size={20} />
									</motion.button>
									<motion.button
										whileHover={{ scale: 1.02, y: -1 }}
										whileTap={{ scale: 0.98 }}
										onClick={() => window.location.href = '/app/orders'}
										className='border border-slate-300 text-slate-700 px-8 py-4 rounded-xl font-semibold hover:bg-slate-50 transition-all duration-300 flex items-center justify-center space-x-2'
									>
										<User size={20} />
										<span>View Profile</span>
									</motion.button>
								</div>

								<div className='text-sm text-slate-600'>
									<p>🎁 As a welcome bonus, you'll receive exclusive deals via email!</p>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
				</div>
			</div>
		</div>
	);
}
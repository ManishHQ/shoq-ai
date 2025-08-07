'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, ShieldCheck, ShoppingCart, Target } from 'lucide-react';

// Features Configuration for Shoq.io
const FEATURES_CONFIG = {
	header: {
		title: 'Features That',
		highlight: 'Make Shoq Magic',
		description:
			'Everything Shoq does is designed to make your shopping and booking seamless, smart, and conversational.',
	},
	features: [
		{
			icon: Bot,
			title: 'AI That Understands You',
			description:
				'Just say what you need—Shoq’s natural language model can understand phrases like “buy me bananas” or “book me a concert ticket” and take action instantly.',
			image: '🤖',
			reverse: false,
			visual: {
				title1: 'Intent Detected',
				subtitle1: 'Shoq recognized "buy me a mug"',
				title2: 'Suggested Action',
				subtitle2: 'Confirm to order Coffee Mug – $13',
			},
		},
		{
			icon: ShieldCheck,
			title: 'Secure Wallet-Based Checkout',
			description:
				'Users deposit funds into Shoq’s verified wallet and submit a transaction hash for confirmation. It’s fast, secure, and eliminates the need for traditional checkouts.',
			image: '💸',
			reverse: true,
			visual: {
				title1: 'Wallet Verified',
				subtitle1: 'Transaction hash confirmed on-chain',
				title2: 'Balance Updated',
				subtitle2: 'User account credited with 100 USDC',
			},
		},
		{
			icon: ShoppingCart,
			title: 'Instant Confirmation & Tracking',
			description:
				'Shoq sends real-time order confirmation, inline buttons for tracking, and even email invoices—everything you expect from a full-service shopping assistant.',
			image: '🧾',
			reverse: false,
			visual: {
				title1: 'Order Confirmed',
				subtitle1: '1x Coffee Mug, Total: $13',
				title2: 'Tracking Enabled',
				subtitle2: 'Email + Telegram notifications sent',
			},
		},
	],
	stats: [
		{ value: '500+', label: 'Items & Tickets Listed' },
		{ value: '10K+', label: 'Orders Processed' },
		{ value: '1-Click', label: 'Order Flow' },
		{ value: '24/7', label: 'Chat Support' },
	],
	cta: {
		text: 'Explore Shoq Features',
	},
};

const Features = () => {
	return (
		<section id='features' className='py-32 bg-white'>
			<div className='max-w-7xl mx-auto px-6'>
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					className='text-center mb-20'
				>
					<h2 className='text-5xl md:text-6xl font-bold text-slate-900 mb-6'>
						{FEATURES_CONFIG.header.title}{' '}
						<span className='bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent'>
							{FEATURES_CONFIG.header.highlight}
						</span>
					</h2>
					<p className='text-xl text-slate-600 max-w-3xl mx-auto'>
						{FEATURES_CONFIG.header.description}
					</p>
				</motion.div>

				<div className='space-y-32'>
					{FEATURES_CONFIG.features.map((feature, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 50 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: index * 0.2 }}
							className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${
								feature.reverse ? 'lg:grid-flow-col-dense' : ''
							}`}
						>
							{/* Content */}
							<div className={feature.reverse ? 'lg:col-start-2' : ''}>
								<div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl mb-6'>
									<feature.icon className='text-purple-600' size={28} />
								</div>

								<h3 className='text-4xl font-bold text-slate-900 mb-6'>
									{feature.title}
								</h3>

								<p className='text-lg text-slate-600 leading-relaxed mb-8'>
									{feature.description}
								</p>

								<motion.button
									whileHover={{ scale: 1.05, y: -2 }}
									whileTap={{ scale: 0.95 }}
									className='relative overflow-hidden inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 group'
								>
									<div className='absolute inset-0 bg-gradient-to-r from-purple-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
									<div className='relative flex items-center space-x-2'>
										<span>{FEATURES_CONFIG.cta.text}</span>
										<motion.div
											whileHover={{ x: 2 }}
											className='transition-transform duration-200'
										>
											<Target size={16} />
										</motion.div>
									</div>
								</motion.button>
							</div>

							{/* Visual */}
							<div className={feature.reverse ? 'lg:col-start-1' : ''}>
								<motion.div
									whileHover={{ scale: 1.05, rotate: 2 }}
									className='relative'
								>
									<div className='w-full max-w-md mx-auto'>
										<div className='bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8 shadow-lg'>
											<div className='text-8xl text-center mb-6'>
												{feature.image}
											</div>
											<div className='space-y-4'>
												<div className='bg-white rounded-2xl p-4 shadow-sm'>
													<div className='flex items-center space-x-3 mb-2'>
														<div className='w-3 h-3 bg-purple-400 rounded-full'></div>
														<div className='text-sm font-medium text-slate-900'>
															{feature.visual?.title1 || 'Shoq Insight'}
														</div>
													</div>
													<div className='text-xs text-slate-600'>
														{feature.visual?.subtitle1 ||
															'Shoq detected your request'}
													</div>
												</div>
												<div className='bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-4'>
													<div className='text-sm font-medium mb-1'>
														{feature.visual?.title2 || 'Shoq Action'}
													</div>
													<div className='text-xs opacity-90'>
														{feature.visual?.subtitle2 ||
															'Shoq is processing your order'}
													</div>
												</div>
											</div>
										</div>
									</div>
								</motion.div>
							</div>
						</motion.div>
					))}
				</div>

				{/* Stats Section */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.6 }}
					className='mt-32 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl p-12'
				>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-8 text-center'>
						{FEATURES_CONFIG.stats.map((stat, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, scale: 0.8 }}
								whileInView={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.6, delay: index * 0.1 }}
							>
								<div className='text-3xl md:text-4xl font-bold text-purple-600 mb-2'>
									{stat.value}
								</div>
								<div className='text-slate-600 text-sm'>{stat.label}</div>
							</motion.div>
						))}
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default Features;

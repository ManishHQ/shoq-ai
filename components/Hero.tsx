'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Star, Download } from 'lucide-react';

// Hero Configuration for Shoq.io
const HERO_CONFIG = {
	headline: {
		main: 'Meet Your',
		highlight: 'AI Shopping Assistant',
		suffix: 'on Telegram',
	},
	description:
		"Shop smarter, book faster. Shoq handles everything from groceries to concert tickets—just tell it what you want, and it's done.",
	stats: {
		appStore: {
			rating: '4.8',
			source: 'Telegram Bot Reviews',
			reviews: 'Trusted by 10K+ users',
		},
		books: {
			icon: '🛒',
			count: '500+',
			label: 'Items & Tickets',
			sublabel: 'Ready to Order',
		},
	},
	downloadLinks: {
		appStore: {
			href: 'https://t.me/HeyShoqBot',
			image: '/telegram-bot-link.svg',
			alt: 'Start on Telegram',
		},
		playStore: null, // Not applicable for now
	},
	mockup: {
		todayInsight: {
			title: "Today's Order",
			icon: '🎁',
			source: 'Shoq Assistant',
			headline: 'Coffee Mug • $13',
			description: 'Order confirmed! Want to buy something else?',
		},
		action: {
			title: 'Try It Now',
			description: 'Say “buy me bananas” or “book me a movie ticket”',
		},
	},
	footer: 'Join 10,000+ users shopping smarter with Shoq',
};

const Hero = () => {
	return (
		<section className='relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50 pt-52'>
			{/* Animated Background Elements */}
			<div className='absolute inset-0'>
				<motion.div
					animate={{
						background: [
							'radial-gradient(circle at 20% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
							'radial-gradient(circle at 80% 80%, rgba(79, 70, 229, 0.1) 0%, transparent 50%)',
							'radial-gradient(circle at 20% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
							'radial-gradient(circle at 20% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
						],
					}}
					transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
					className='absolute inset-0'
				/>
			</div>

			{/* Floating Elements */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 1 }}
				className='absolute top-32 right-8 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-4 text-center shadow-lg'
			>
				<div className='flex items-center justify-center mb-2'>
					{[...Array(5)].map((_, i) => (
						<Star key={i} size={16} className='text-amber-400 fill-current' />
					))}
				</div>
				<div className='text-slate-900 font-semibold text-lg'>
					{HERO_CONFIG.stats.appStore.rating}
				</div>
				<div className='text-slate-600 text-sm'>
					{HERO_CONFIG.stats.appStore.source}
				</div>
				<div className='text-slate-500 text-xs'>
					{HERO_CONFIG.stats.appStore.reviews}
				</div>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 1.2 }}
				className='absolute top-48 left-8 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-4 text-center shadow-lg'
			>
				<div className='text-2xl mb-2'>{HERO_CONFIG.stats.books.icon}</div>
				<div className='text-slate-900 font-semibold'>
					{HERO_CONFIG.stats.books.count}
				</div>
				<div className='text-slate-600 text-sm'>
					{HERO_CONFIG.stats.books.label}
				</div>
				<div className='text-slate-500 text-xs'>
					{HERO_CONFIG.stats.books.sublabel}
				</div>
			</motion.div>

			{/* Main Content */}
			<div className='relative z-10 text-center max-w-6xl mx-auto px-6'>
				<motion.h1
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					className='text-6xl md:text-8xl font-bold text-slate-900 mb-8 leading-tight'
				>
					{HERO_CONFIG.headline.main}{' '}
					<span className='bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent'>
						{HERO_CONFIG.headline.highlight}
					</span>{' '}
					{HERO_CONFIG.headline.suffix}
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
					className='text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto font-light leading-relaxed'
				>
					{HERO_CONFIG.description}
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.4 }}
					className='flex flex-col sm:flex-row items-center justify-center gap-4 mb-12'
				>
					<motion.a
						href={HERO_CONFIG.downloadLinks.appStore.href}
						whileHover={{ scale: 1.05, y: -3 }}
						whileTap={{ scale: 0.95 }}
						className='relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white px-10 py-4 rounded-full text-lg font-bold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 group'
					>
						<div className='absolute inset-0 bg-gradient-to-r from-purple-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
						<div className='relative flex items-center space-x-3'>
							<span className='text-xl'>💬</span>
							<span>Open in Telegram</span>
							<motion.span
								initial={{ x: 0 }}
								whileHover={{ x: 3 }}
								className='transition-transform duration-200'
							>
								→
							</motion.span>
						</div>
					</motion.a>

					<motion.div
						whileHover={{ scale: 1.05, y: -2 }}
						className='relative bg-white border-2 border-purple-200 text-purple-700 px-10 py-4 rounded-full text-lg font-semibold hover:shadow-lg hover:border-purple-300 transition-all duration-300 group cursor-not-allowed'
					>
						<div className='flex items-center space-x-3'>
							<span className='text-xl'>📱</span>
							<span>Mobile App</span>
							<span className='text-sm bg-purple-100 text-purple-600 px-2 py-1 rounded-full'>Coming Soon</span>
						</div>
					</motion.div>
				</motion.div>

				{/* Phone Mockup */}
				<motion.div
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1, delay: 0.6 }}
					className='relative max-w-sm mx-auto'
				>
					<div className='relative'>
						<div className='w-80 h-[600px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-2 shadow-2xl mx-auto'>
							<div className='w-full h-full bg-gradient-to-br from-purple-50 to-indigo-50 rounded-[2.5rem] overflow-hidden'>
								<div className='p-6 space-y-4'>
									<div className='flex items-center justify-between'>
										<div className='text-slate-900 font-bold text-lg'>
											{HERO_CONFIG.mockup.todayInsight.title}
										</div>
										<div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
											{HERO_CONFIG.mockup.todayInsight.icon}
										</div>
									</div>
									<div className='bg-white rounded-2xl p-4 shadow-sm'>
										<div className='text-sm text-purple-600 font-medium mb-2'>
											{HERO_CONFIG.mockup.todayInsight.source}
										</div>
										<div className='text-slate-900 font-semibold mb-2'>
											{HERO_CONFIG.mockup.todayInsight.headline}
										</div>
										<div className='text-slate-600 text-sm'>
											{HERO_CONFIG.mockup.todayInsight.description}
										</div>
									</div>
									<div className='bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-4'>
										<div className='text-sm font-medium mb-2'>
											{HERO_CONFIG.mockup.action.title}
										</div>
										<div className='text-sm opacity-90'>
											{HERO_CONFIG.mockup.action.description}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1 }}
					className='mt-12 text-slate-500 text-sm'
				>
					{HERO_CONFIG.footer}
				</motion.div>
			</div>

			{/* Scroll Indicator */}
			<motion.div
				animate={{ y: [0, 10, 0] }}
				transition={{ duration: 2, repeat: Infinity }}
				className='absolute bottom-8 left-1/2 transform -translate-x-1/2'
			>
				<div className='w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center'>
					<div className='w-1 h-3 bg-slate-400 rounded-full mt-2'></div>
				</div>
			</motion.div>
		</section>
	);
};

export default Hero;

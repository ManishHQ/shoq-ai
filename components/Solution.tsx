'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, MessageSquare, Search } from 'lucide-react';

// How It Works Configuration for Shoq.io
const SOLUTION_CONFIG = {
	header: {
		title: 'How',
		highlight: 'Shoq',
		suffix: 'Works',
		description:
			'Shoq makes shopping and ticket booking effortless. Just chat, confirm, and enjoy—Shoq takes care of the rest.',
	},
	steps: [
		{
			icon: MessageSquare, // replace with your icon set
			title: 'Start a Chat',
			description:
				'Open Telegram and say what you need—like "Buy me a coffee mug" or "Book a movie ticket."',
			color: 'from-purple-600 to-purple-700',
			number: '01',
		},
		{
			icon: Search,
			title: 'Get the Best Match',
			description:
				'Shoq finds the most relevant product or ticket and sends you a quick summary with pricing.',
			color: 'from-indigo-600 to-indigo-700',
			number: '02',
		},
		{
			icon: CheckCircle,
			title: 'Confirm & Go',
			description:
				'Tap confirm, and your order is placed. Receive instant confirmation, order tracking, and an email receipt.',
			color: 'from-violet-600 to-violet-700',
			number: '03',
		},
	],
	bottomCta: {
		icon: '🛒',
		title: 'Your Shopping Assistant Is Just a Chat Away',
		description: 'No apps. No checkout forms. Just Shoq.',
		buttonText: 'Try Shoq on Telegram',
	},
};

const Solution = () => {
	return (
		<section
			id='how-it-works'
			className='py-32 bg-gradient-to-br from-slate-50 to-purple-50'
		>
			<div className='max-w-7xl mx-auto px-6'>
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					className='text-center mb-20'
				>
					<h2 className='text-5xl md:text-6xl font-bold text-slate-900 mb-6'>
						The{' '}
						<span className='bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent'>
							Smartest Way
						</span>{' '}
						To Shop Online
					</h2>
					<p className='text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed'>
						Shoq helps you shop faster, smarter, and effortlessly—whether it’s
						groceries, gadgets, or gifts. Just say what you need, and we’ll do
						the rest.
					</p>
				</motion.div>

				<div className='relative'>
					{/* Connection Line */}
					<div className='hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-200 via-indigo-200 to-violet-200 transform -translate-y-1/2 z-0' />

					<div className='grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10'>
						{SOLUTION_CONFIG.steps.map((step, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 50 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: index * 0.2 }}
								className='relative'
							>
								<motion.div
									whileHover={{ y: -10, scale: 1.02 }}
									className='bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 h-full border border-slate-100'
								>
									<div
										className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl mb-6`}
									>
										<step.icon className='text-white' size={28} />
									</div>

									<h3 className='text-2xl font-bold text-slate-900 mb-4'>
										{step.title}
									</h3>

									<p className='text-slate-600 leading-relaxed mb-6'>
										{step.description}
									</p>

									<motion.div
										whileHover={{ x: 5 }}
										className='flex items-center text-purple-600 font-medium cursor-pointer'
									>
										<span className='text-sm'>Learn more</span>
										<ArrowRight size={16} className='ml-2' />
									</motion.div>
								</motion.div>
							</motion.div>
						))}
					</div>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.6 }}
					className='text-center mt-20'
				>
					<div className='bg-white rounded-3xl p-8 shadow-lg max-w-2xl mx-auto border border-slate-100'>
						<div className='text-4xl mb-4'>🎯</div>
						<h3 className='text-2xl font-bold text-slate-900 mb-4'>
							{SOLUTION_CONFIG.bottomCta.title}
						</h3>
						<p className='text-slate-600 mb-6'>
							{SOLUTION_CONFIG.bottomCta.description}
						</p>
						<motion.button
							whileHover={{ scale: 1.05, y: -3 }}
							whileTap={{ scale: 0.95 }}
							className='relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white px-12 py-5 rounded-full text-lg font-bold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 group'
						>
							<div className='absolute inset-0 bg-gradient-to-r from-purple-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
							<div className='relative flex items-center space-x-3'>
								<span className='text-xl'>🚀</span>
								<span>{SOLUTION_CONFIG.bottomCta.buttonText}</span>
								<motion.span
									whileHover={{ x: 3 }}
									className='transition-transform duration-200'
								>
									→
								</motion.span>
							</div>
						</motion.button>
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default Solution;

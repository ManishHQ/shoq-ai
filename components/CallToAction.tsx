'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Download, Star, ArrowRight } from 'lucide-react';

const CallToAction = () => {
	return (
		<section className='py-32 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 relative overflow-hidden'>
			{/* Background Animation */}
			<div className='absolute inset-0'>
				<motion.div
					animate={{
						background: [
							'radial-gradient(circle at 20% 20%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)',
							'radial-gradient(circle at 80% 80%, rgba(79, 70, 229, 0.3) 0%, transparent 50%)',
							'radial-gradient(circle at 20% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)',
							'radial-gradient(circle at 20% 20%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)',
						],
					}}
					transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
					className='absolute inset-0'
				/>
			</div>

			<div className='max-w-7xl mx-auto px-6 relative z-10'>
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					className='text-center mb-16'
				>
					<h2 className='text-5xl md:text-7xl font-bold text-white mb-6 leading-tight'>
						Shop & Book with{' '}
						<span className='bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent'>
							ShoqBot
						</span>
					</h2>
					<p className='text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed'>
						All you need is chat. Shoq helps you buy items, book tickets, and
						track everything—right from Telegram.
					</p>
				</motion.div>

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
					{/* Left Side - Features */}
					<motion.div
						initial={{ opacity: 0, x: -30 }}
						whileInView={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.8 }}
						className='space-y-8'
					>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							className='bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8'
						>
							<h3 className='text-2xl font-semibold text-white mb-4'>
								Why Shoq?
							</h3>
							<div className='space-y-4'>
								{[
									'No apps, no forms—just chat',
									'Prepaid wallet with secure balance tracking',
									'Instant order confirmations + email receipts',
									'Smart AI agent that understands real requests',
								].map((feature, index) => (
									<motion.div
										key={index}
										initial={{ opacity: 0, x: -20 }}
										whileInView={{ opacity: 1, x: 0 }}
										transition={{ duration: 0.5, delay: index * 0.1 }}
										className='flex items-center space-x-3'
									>
										<div className='w-2 h-2 bg-purple-400 rounded-full' />
										<span className='text-purple-100'>{feature}</span>
									</motion.div>
								))}
							</div>
						</motion.div>
					</motion.div>

					{/* Right Side - Bot UI Preview */}
					<motion.div
						initial={{ opacity: 0, x: 30 }}
						whileInView={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className='text-center'
					>
						<motion.div
							whileHover={{ scale: 1.05, rotate: 2 }}
							className='relative max-w-sm mx-auto'
						>
							<div className='w-80 h-[600px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-2 shadow-2xl'>
								<div className='w-full h-full bg-gradient-to-br from-purple-50 to-indigo-50 rounded-[2.5rem] overflow-hidden'>
									<div className='p-6 space-y-4'>
										<div className='text-left space-y-2'>
											<p className='text-slate-900 font-semibold'>
												Order Confirmed ✅
											</p>
											<p className='text-slate-600 text-sm'>
												1x Coffee Mug • Total: $13
												<br />
												Track your order via Shoq or check email for receipt.
											</p>
										</div>

										<div className='bg-white rounded-2xl p-4 shadow-sm mt-4'>
											<p className='text-sm text-purple-600 font-medium mb-2'>
												Wallet Balance
											</p>
											<p className='text-slate-900 font-semibold text-lg'>
												87 USDC remaining
											</p>
										</div>

										<div className='bg-purple-50 rounded-2xl p-4'>
											<p className='text-sm text-purple-600 font-medium mb-2'>
												Next Action
											</p>
											<p className='text-slate-900 text-sm'>
												Ask Shoq: "Buy me headphones" 🎧
											</p>
										</div>
									</div>
								</div>
							</div>
						</motion.div>

						{/* Rating */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.4 }}
							className='mt-8 text-center'
						>
							<div className='inline-flex items-center space-x-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3'>
								<div className='flex items-center space-x-1'>
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											size={14}
											className='text-amber-400 fill-current'
										/>
									))}
								</div>
								<span className='text-white font-semibold'>4.8</span>
								<span className='text-purple-200'>• Trusted by 10K+ users</span>
							</div>
						</motion.div>
					</motion.div>
				</div>

				{/* Final CTA Button */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.4 }}
					className='text-center mt-16'
				>
					<motion.a
						href='https://t.me/HeyShoqBot'
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className='bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-12 py-6 rounded-full text-xl font-semibold hover:shadow-2xl transition-all duration-300 inline-flex items-center space-x-3'
					>
						<Download size={24} />
						<span>Try Shoq on Telegram</span>
						<ArrowRight size={20} />
					</motion.a>

					<div className='mt-6 text-purple-200'>
						Open-source AI agent • Secure transactions • Built for speed
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default CallToAction;

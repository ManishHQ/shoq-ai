'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
	{
		name: 'Neha T.',
		role: 'Busy Professional',
		text: "Shoq is a lifesaver. I just typed 'book me a football match ticket' on Telegram and it handled everything. No forms, no apps—just done. Love the simplicity!",
		rating: 5,
		avatar: '⚽️',
	},
	{
		name: 'Jason R.',
		role: 'Remote Worker',
		text: 'I used Shoq to order a coffee mug, track it, and get the invoice—all through chat. The balance deposit and confirmation felt secure and smooth. It’s like having a shopping assistant in my pocket.',
		rating: 5,
		avatar: '💼',
	},
	{
		name: 'Aanya M.',
		role: 'Digital Native',
		text: "This is the future of shopping. I said 'buy me bananas' and got confirmation in seconds with buttons to confirm. Shoq feels like magic.",
		rating: 5,
		avatar: '🛍️',
	},
];

const Testimonials = () => {
	return (
		<section
			id='testimonials'
			className='py-32 bg-gradient-to-br from-slate-50 to-purple-50'
		>
			<div className='max-w-7xl mx-auto px-6'>
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					className='text-center mb-16'
				>
					<h2 className='text-5xl md:text-6xl font-bold text-slate-900 mb-6'>
						Join Professionals Who Are{' '}
						<span className='bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent'>
							Getting Smarter Daily
						</span>
					</h2>
					<p className='text-xl text-slate-600 max-w-3xl mx-auto'>
						See how Instawise is transforming careers and lives around the world
					</p>
				</motion.div>

				<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
					{testimonials.map((testimonial, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 50 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: index * 0.2 }}
							whileHover={{ y: -10 }}
							className='bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300'
						>
							<div className='flex items-center space-x-1 mb-6'>
								{[...Array(testimonial.rating)].map((_, i) => (
									<Star
										key={i}
										size={16}
										className='text-amber-400 fill-current'
									/>
								))}
							</div>

							<Quote className='text-purple-200 mb-4' size={32} />

							<p className='text-slate-600 mb-6 leading-relaxed'>
								"{testimonial.text}"
							</p>

							<div className='flex items-center space-x-3'>
								<div className='text-3xl'>{testimonial.avatar}</div>
								<div>
									<div className='text-slate-900 font-semibold'>
										{testimonial.name}
									</div>
									<div className='text-slate-500 text-sm'>
										{testimonial.role}
									</div>
								</div>
							</div>
						</motion.div>
					))}
				</div>

				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.6 }}
					className='text-center mt-16'
				>
					<div className='inline-flex items-center space-x-6 bg-white rounded-full px-8 py-4 shadow-lg'>
						<div className='flex items-center space-x-2'>
							<div className='flex items-center space-x-1'>
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										size={16}
										className='text-amber-400 fill-current'
									/>
								))}
							</div>
							<span className='text-slate-900 font-semibold'>4.9/5</span>
						</div>
						<div className='w-px h-6 bg-slate-200' />
						<div className='text-slate-600'>Based on 12,000+ reviews</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default Testimonials;
